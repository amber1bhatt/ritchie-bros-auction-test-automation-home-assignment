import { existsSync } from 'node:fs';

// all suite settings come from here. see .env.example for the list

if (existsSync('.env')) {
  // doesn't override variables that are already set
  process.loadEnvFile('.env');
}

const raw = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

const bool = (name: string, fallback: boolean): boolean => {
  const value = raw(name)?.toLowerCase();
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value);
};

const int = (name: string, min: number): number | undefined => {
  const value = raw(name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new Error(`${name} must be an integer >= ${min}, got "${value}"`);
  }
  return parsed;
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

const logLevel = (): LogLevel => {
  const value = raw('LOG_LEVEL')?.toLowerCase();
  return LOG_LEVELS.includes(value as LogLevel) ? (value as LogLevel) : 'info';
};

const isCI = bool('CI', false);

export const env = {
  baseUrl: raw('BASE_URL') ?? 'https://www.rbauction.com',
  isCI,
  // the WAF returns 403 to headless chromium, so headed is the default
  headless: bool('HEADLESS', false),
  // kept low, it's a live site
  workers: int('PLAYWRIGHT_WORKERS', 1) ?? (isCI ? 2 : 4),
  retries: int('PLAYWRIGHT_RETRIES', 0) ?? (isCI ? 2 : 0),
  // see src/utils/third-party.ts
  blockThirdParty: bool('BLOCK_THIRD_PARTY', true),
  logLevel: logLevel(),
  otel: {
    // standard OTel env vars, so any OTLP backend works
    endpoint: raw('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT') ?? raw('OTEL_EXPORTER_OTLP_ENDPOINT'),
    serviceName: raw('OTEL_SERVICE_NAME') ?? 'rb-auction-tests',
  },
} as const;
