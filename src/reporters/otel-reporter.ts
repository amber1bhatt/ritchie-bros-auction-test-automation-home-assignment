import { readFileSync } from 'node:fs';

import {
  ROOT_CONTEXT,
  SpanStatusCode,
  trace,
  type Attributes,
  type Context,
  type Span,
  type Tracer,
} from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ExportResultCode, type ExportResult } from '@opentelemetry/core';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  type ReadableSpan,
  type SpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';

import { env } from '../config/env';

// sends each run as one trace over OTLP/HTTP: run > test > step > expect / pw:api call.
// only added in playwright.config.ts when an OTLP endpoint is set. the exporter
// reads the standard OTEL_* vars itself. export errors are logged, never fail the run

const EXPORTED_STEP_CATEGORIES = new Set(['test.step', 'expect', 'pw:api']);

function packageVersion(): string {
  try {
    return (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;
  } catch {
    return 'unknown';
  }
}

// reporters don't get the cli --grep, so read it from argv. "@smoke" -> "smoke"
function suiteName(): string {
  const args = process.argv;
  const i = args.findIndex((a) => a === '--grep' || a === '-g');
  const filter = i >= 0 ? args[i + 1] : args.find((a) => a.startsWith('--grep='))?.slice(7);
  if (!filter) return 'all';
  return filter.match(/^@(\w+)$/)?.[1] ?? filter;
}

// so a trace links back to its CI run
function ciAttributes(): Attributes {
  const e = process.env;
  if (!e.GITHUB_ACTIONS) return { 'ci.provider': env.isCI ? 'unknown' : 'local' };
  return {
    'ci.provider': 'github-actions',
    'ci.workflow': e.GITHUB_WORKFLOW,
    'ci.event': e.GITHUB_EVENT_NAME,
    'ci.run_id': e.GITHUB_RUN_ID,
    'ci.run_attempt': e.GITHUB_RUN_ATTEMPT,
    'ci.run_url': `${e.GITHUB_SERVER_URL}/${e.GITHUB_REPOSITORY}/actions/runs/${e.GITHUB_RUN_ID}`,
    'vcs.ref': e.GITHUB_REF_NAME,
    'vcs.revision': e.GITHUB_SHA,
  };
}

const end = (start: Date, durationMs: number) =>
  new Date(start.getTime() + Math.max(durationMs, 0));

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const firstLine = (message: string | undefined) =>
  (message ?? '').replace(ANSI, '').split('\n')[0] ?? '';

// counts what was exported, the SDK only reports export errors to its diag logger
class CountingExporter implements SpanExporter {
  exported = 0;
  lastError?: string;

  constructor(private readonly inner: SpanExporter) {}

  export(spans: ReadableSpan[], done: (result: ExportResult) => void): void {
    this.inner.export(spans, (result) => {
      if (result.code === ExportResultCode.SUCCESS) this.exported += spans.length;
      else this.lastError = result.error?.message || result.error?.name || 'unknown error';
      done(result);
    });
  }

  shutdown(): Promise<void> {
    return this.inner.shutdown();
  }

  forceFlush(): Promise<void> {
    return this.inner.forceFlush?.() ?? Promise.resolve();
  }
}

export default class OtelReporter implements Reporter {
  private readonly exporter = new CountingExporter(new OTLPTraceExporter());
  private readonly provider: BasicTracerProvider;
  private readonly tracer: Tracer;
  private suite?: Suite;
  private root?: Span;
  private rootContext: Context = ROOT_CONTEXT;

  constructor() {
    this.provider = new BasicTracerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: env.otel.serviceName,
        [ATTR_SERVICE_VERSION]: packageVersion(),
        'deployment.environment': env.baseUrl,
      }),
      spanProcessors: [new BatchSpanProcessor(this.exporter)],
    });
    this.tracer = this.provider.getTracer('playwright-otel-reporter', packageVersion());
  }

  printsToStdio(): boolean {
    return false;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.suite = suite;
    this.root = this.tracer.startSpan(
      'playwright run',
      {
        startTime: new Date(),
        attributes: {
          'test.suite': suiteName(),
          'test.total': suite.allTests().length,
          'test.workers': config.workers,
          'test.base_url': env.baseUrl,
          'playwright.version': config.version,
          ...ciAttributes(),
        },
      },
      ROOT_CONTEXT,
    );
    this.rootContext = trace.setSpan(ROOT_CONTEXT, this.root);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    try {
      const failed = result.status !== 'passed' && result.status !== 'skipped';
      const span = this.tracer.startSpan(
        `test: ${test.titlePath().slice(3).join(' › ')}`,
        {
          startTime: result.startTime,
          attributes: {
            'test.title': test.title,
            'test.file': test.location.file.replace(`${process.cwd()}/`, ''),
            'test.project': test.parent.project()?.name ?? '',
            'test.tags': test.tags,
            'test.status': result.status,
            'test.expected_status': test.expectedStatus,
            'test.retry': result.retry,
            'test.worker': result.workerIndex,
            'test.duration_ms': result.duration,
          },
        },
        this.rootContext,
      );
      if (failed) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: firstLine(result.error?.message) });
        if (result.error) span.recordException({ message: result.error.message ?? 'error' });
      }
      const ctx = trace.setSpan(ROOT_CONTEXT, span);
      for (const step of result.steps) this.exportStep(step, ctx);
      span.end(end(result.startTime, result.duration));
    } catch (error) {
      console.warn(`[otel] could not record "${test.title}": ${(error as Error).message}`);
    }
  }

  private exportStep(step: TestStep, parent: Context): void {
    if (!EXPORTED_STEP_CATEGORIES.has(step.category)) return;
    const span = this.tracer.startSpan(
      step.category === 'pw:api'
        ? step.title
        : `${step.category.replace('test.', '')}: ${step.title}`,
      {
        startTime: step.startTime,
        attributes: { 'step.category': step.category, 'step.duration_ms': step.duration },
      },
      parent,
    );
    if (step.error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: firstLine(step.error.message) });
    }
    const ctx = trace.setSpan(ROOT_CONTEXT, span);
    for (const child of step.steps) this.exportStep(child, ctx);
    span.end(end(step.startTime, step.duration));
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!this.root) return;
    const counts = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
    for (const test of this.suite?.allTests() ?? []) {
      const outcome = test.outcome();
      if (outcome === 'expected') counts.passed++;
      else if (outcome === 'flaky') counts.flaky++;
      else if (outcome === 'skipped') counts.skipped++;
      else counts.failed++;
    }
    this.root.setAttributes({
      'test.run_status': result.status,
      'test.passed': counts.passed,
      'test.failed': counts.failed,
      'test.flaky': counts.flaky,
      'test.skipped': counts.skipped,
      'test.duration_ms': result.duration,
    });
    if (result.status !== 'passed') {
      this.root.setStatus({ code: SpanStatusCode.ERROR, message: `run ${result.status}` });
    }
    this.root.end(new Date());

    try {
      await this.provider.forceFlush();
      await this.provider.shutdown();
    } catch (error) {
      this.exporter.lastError ??= (error as Error).message;
    }
    const traceId = this.root.spanContext().traceId;
    if (this.exporter.lastError || this.exporter.exported === 0) {
      const reason = this.exporter.lastError || 'collector did not accept any spans';
      console.warn(`[otel] export failed for trace ${traceId}: ${reason}`);
    } else {
      console.log(`[otel] exported ${this.exporter.exported} spans, trace ${traceId}`);
    }
  }
}
