import { env, type LogLevel } from '../config/env';

// output is captured per test and printed by the validation reporter

const ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const enabled = (level: LogLevel) => ORDER[level] >= ORDER[env.logLevel];

function write(level: LogLevel, message: string): void {
  if (!enabled(level)) return;
  const line = `[${level}] ${message}`;
  if (level === 'warn' || level === 'error') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string): void => write('debug', message),
  info: (message: string): void => write('info', message),
  warn: (message: string): void => write('warn', message),
  error: (message: string): void => write('error', message),
  list(label: string, items: readonly string[]): void {
    if (!enabled('info')) return;
    console.log(`[info] ${label}:`);
    items.forEach((item, index) => console.log(`  ${index + 1}. ${item}`));
  },
};
