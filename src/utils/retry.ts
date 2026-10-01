import { logger } from './logger';

// retries network blips and 5xx inside a test, so one bad response doesn't
// cost a whole test retry. 4xx fails straight away

// no 403: that's the WAF, retrying it won't help
export const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([408, 429, 500, 502, 503, 504]);

export const isRetryableStatus = (status: number): boolean => RETRYABLE_STATUSES.has(status);

// chromium net::ERR_*, fetch failures in the page, and node socket errors
export const isTransientNetworkError = (error: unknown): boolean =>
  error instanceof Error &&
  /net::ERR_|Failed to fetch|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(
    error.message,
  );

export interface RetryOptions<T> {
  label: string;
  // total tries, including the first
  attempts?: number;
  // doubles after each try
  initialDelayMs?: number;
  // default: network errors only
  retryOnError?: (error: unknown) => boolean;
  // return a reason to retry (like "HTTP 503"). the last result is returned
  // as is, so the test can still assert on the status
  retryOnResult?: (result: T) => string | false;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  {
    label,
    attempts = 3,
    initialDelayMs = 1_000,
    retryOnError = isTransientNetworkError,
    retryOnResult = () => false,
  }: RetryOptions<T>,
): Promise<T> {
  let delay = initialDelayMs;
  for (let attempt = 1; ; attempt++) {
    const isLast = attempt >= attempts;
    let reason: string;
    try {
      const result = await fn(attempt);
      const retryReason = retryOnResult(result);
      if (!retryReason || isLast) return result;
      reason = retryReason;
    } catch (error) {
      if (isLast || !retryOnError(error)) throw error;
      reason = error instanceof Error ? error.message.split('\n')[0]! : String(error);
    }
    logger.warn(
      `${label}: attempt ${attempt}/${attempts} failed (${reason}), retrying in ${delay}ms`,
    );
    await sleep(delay);
    delay *= 2;
  }
}
