import type {
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';

// prints a one-line status per test while running, then every test as a tree of
// steps and validations at the end, happy paths first and negatives last

const useColor = !process.env.NO_COLOR && (process.stdout.isTTY || !!process.env.CI);
const paint = (code: number) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = paint(32);
const red = paint(31);
const yellow = paint(33);
const dim = paint(2);
const bold = paint(1);

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const stripAnsi = (s: string) => s.replace(ANSI, '');
const indent = (depth: number) => '  '.repeat(depth);
const seconds = (ms: number) => dim(`(${(ms / 1000).toFixed(1)}s)`);

function stepDepth(step: TestStep): number {
  let depth = 0;
  for (let p = step.parent; p; p = p.parent) {
    if (p.category === 'test.step') depth++;
  }
  return depth;
}

// Expected/Received lines from a failed expect, without the stack trace
function failureDetail(message: string, title: string): string[] {
  return stripAnsi(message)
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^(Expected|Received|Error:|Timeout|Call log)/.test(l))
    .filter((l) => l !== `Error: ${title}`)
    .slice(0, 4);
}

interface Attempt {
  lines: string[];
  openSteps: number;
}

export default class ValidationReporter implements Reporter {
  private root?: Suite;
  private attempts = new Map<string, Attempt>();
  private passedChecks = 0;
  private failedChecks = 0;

  printsToStdio(): boolean {
    return true;
  }

  onBegin(_config: unknown, suite: Suite): void {
    this.root = suite;
  }

  private attempt(test: TestCase, result: TestResult): Attempt {
    const key = `${test.id}#${result.retry}`;
    let attempt = this.attempts.get(key);
    if (!attempt) {
      attempt = { lines: [], openSteps: 0 };
      this.attempts.set(key, attempt);
    }
    return attempt;
  }

  onStepBegin(test: TestCase, result: TestResult, step: TestStep): void {
    if (step.category !== 'test.step') return;
    const attempt = this.attempt(test, result);
    attempt.lines.push(`${indent(stepDepth(step) + 1)}${bold(step.title)}`);
    attempt.openSteps++;
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    const attempt = this.attempt(test, result);
    if (step.category === 'test.step') {
      attempt.openSteps--;
      return;
    }
    if (step.category !== 'expect') return;

    const pad = indent(stepDepth(step) + 1);
    if (step.error) {
      this.failedChecks++;
      attempt.lines.push(`${pad}${red('✘')} ${step.title}`);
      for (const line of failureDetail(step.error.message ?? '', step.title)) {
        attempt.lines.push(`${pad}    ${red(line)}`);
      }
    } else {
      this.passedChecks++;
      attempt.lines.push(`${pad}${green('✓')} ${step.title}`);
    }
  }

  onStdOut(chunk: string | Buffer, test?: TestCase, result?: TestResult): void {
    if (!test || !result) {
      process.stdout.write(chunk);
      return;
    }
    const attempt = this.attempt(test, result);
    for (const line of String(chunk).replace(/\n$/, '').split('\n')) {
      attempt.lines.push(`${indent(attempt.openSteps + 1)}${dim(line)}`);
    }
  }

  onStdErr(chunk: string | Buffer, test?: TestCase, result?: TestResult): void {
    this.onStdOut(chunk, test, result);
  }

  private header(test: TestCase, result: TestResult): string {
    const icon =
      result.status === 'passed'
        ? green('✓')
        : result.status === 'skipped'
          ? yellow('-')
          : red('✘');
    const project = dim(`[${test.parent.project()?.name}]`);
    const title = test.titlePath().slice(3).join(' › ');
    const retry = result.retry ? yellow(` (retry ${result.retry})`) : '';
    return `${icon} ${project} ${title}${retry} ${seconds(result.duration)}`;
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    console.log(this.header(test, result));
  }

  private ordered(): TestCase[] {
    const tests = this.root?.allTests() ?? [];
    const projects = this.root?.suites.map((s) => s.title) ?? [];
    const isNegative = (t: TestCase) => t.tags.includes('@negative');
    return [...tests].sort(
      (a, b) =>
        projects.indexOf(a.parent.project()?.name ?? '') -
          projects.indexOf(b.parent.project()?.name ?? '') ||
        Number(isNegative(a)) - Number(isNegative(b)) ||
        (isNegative(a)
          ? a.location.line - b.location.line
          : a.title.localeCompare(b.title, 'en', { numeric: true })),
    );
  }

  onEnd(result: FullResult): void {
    const counts = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
    console.log(`\n${bold('Results')}\n`);

    for (const test of this.ordered()) {
      const last = test.results[test.results.length - 1];
      if (!last) continue;

      const outcome = test.outcome();
      if (outcome === 'expected') counts.passed++;
      else if (outcome === 'flaky') counts.flaky++;
      else if (outcome === 'skipped') counts.skipped++;
      else counts.failed++;

      const out = [this.header(test, last)];
      out.push(...(this.attempts.get(`${test.id}#${last.retry}`)?.lines ?? []));
      if (last.status !== 'passed' && last.status !== 'skipped' && last.error?.message) {
        const first = stripAnsi(last.error.message)
          .split('\n')
          .find((l) => l.trim());
        if (first && !out.some((l) => stripAnsi(l).includes(first.trim()))) {
          out.push(`${indent(1)}${red(first.trim())}`);
        }
      }
      console.log(out.join('\n') + '\n');
    }

    const summary = [
      green(`${counts.passed} passed`),
      counts.failed ? red(`${counts.failed} failed`) : '',
      counts.flaky ? yellow(`${counts.flaky} flaky`) : '',
      counts.skipped ? yellow(`${counts.skipped} skipped`) : '',
    ].filter(Boolean);
    const checks = `${this.passedChecks} validations passed${this.failedChecks ? `, ${this.failedChecks} failed` : ''}`;
    console.log(`${summary.join(', ')} ${seconds(result.duration)}\n${dim(checks)}`);
  }
}
