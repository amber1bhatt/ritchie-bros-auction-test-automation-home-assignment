import type { Page, Response } from '@playwright/test';

import { isRetryableStatus, withRetry } from './retry';

// timeouts aren't retried here, 3 x 45s would go past the test timeout.
// playwright's test retries cover those
export async function gotoWithRetry(page: Page, url: string): Promise<Response | null> {
  return withRetry(() => page.goto(url, { waitUntil: 'domcontentloaded' }), {
    label: `GET ${url}`,
    retryOnResult: (response) =>
      response && isRetryableStatus(response.status()) ? `HTTP ${response.status()}` : false,
  });
}
