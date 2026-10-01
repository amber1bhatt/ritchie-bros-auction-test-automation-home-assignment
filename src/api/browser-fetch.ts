import type { Page } from '@playwright/test';

// same methods as Playwright's APIResponse that the specs use
export interface HttpResponse {
  status(): number;
  ok(): boolean;
  headers(): Record<string, string>;
  text(): string;
  json(): Promise<unknown>;
}

export interface FetchInit {
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  // sent as is, so malformed JSON stays malformed
  body?: string;
  timeoutMs?: number;
}

interface RawResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

// runs fetch inside the page. on CI the WAF lets the browser through but blocks
// Playwright's request API (Node TLS and headers), so api calls go through the
// browser like the site's own client-side requests do
export async function browserFetch(
  page: Page,
  url: string,
  init: FetchInit,
): Promise<HttpResponse> {
  const raw = await page.evaluate(
    async ({ url, method, headers, body, timeoutMs }): Promise<RawResponse> => {
      const res = await fetch(url, {
        method,
        headers,
        body,
        credentials: 'same-origin',
        signal: AbortSignal.timeout(timeoutMs),
      });
      return {
        status: res.status,
        headers: Object.fromEntries(res.headers.entries()),
        body: await res.text(),
      };
    },
    {
      url,
      method: init.method,
      headers: init.headers,
      body: init.body,
      timeoutMs: init.timeoutMs ?? 30_000,
    },
  );

  return {
    status: () => raw.status,
    ok: () => raw.status >= 200 && raw.status < 300,
    headers: () => raw.headers,
    text: () => raw.body,
    json: async () => JSON.parse(raw.body) as unknown,
  };
}
