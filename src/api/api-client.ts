import type { Page } from '@playwright/test';

import type { SearchResponse, SearchResults } from '../models';
import { isRetryableStatus, withRetry } from '../utils/retry';

import { browserFetch, type FetchInit, type HttpResponse } from './browser-fetch';
import { nextDataPath } from './next-data';
import type { SiteSession } from './session';

export interface SearchParams {
  freeText: string;
  size?: number;
}

const JSON_HEADERS = { 'content-type': 'application/json', accept: 'application/json' };

// calls are made with fetch from a page that's already past the WAF (see browser-fetch.ts).
// *Raw methods return the response as is, for negative tests. every call is
// read-only, so retrying 5xx is safe
export class ApiClient {
  constructor(
    private readonly page: Page,
    readonly session: SiteSession,
  ) {}

  async searchRaw(params: SearchParams): Promise<HttpResponse> {
    // freeText must be top level, nesting it under searchParams is silently ignored
    return this.send('/api/search', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ size: 60, ...params }),
    });
  }

  async search(params: SearchParams): Promise<SearchResults> {
    const response = await this.searchRaw(params);
    return (await this.parseJson<SearchResponse>(response, '/api/search')).results;
  }

  pageDataUrl(route: string): string {
    return nextDataPath(this.session.buildId, this.session.locale, route);
  }

  async pageDataRaw(route: string): Promise<HttpResponse> {
    return this.send(this.pageDataUrl(route), {
      method: 'GET',
      headers: { accept: 'application/json', 'x-nextjs-data': '1' },
    });
  }

  async pageProps<T>(route: string): Promise<T> {
    const response = await this.pageDataRaw(route);
    return (await this.parseJson<{ pageProps: T }>(response, route)).pageProps;
  }

  async get(path: string): Promise<HttpResponse> {
    return this.send(path, { method: 'GET' });
  }

  // a string body is sent as is, for the malformed JSON test
  async postRaw(path: string, body: string | Record<string, unknown>): Promise<HttpResponse> {
    return this.send(path, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  private send(url: string, init: FetchInit): Promise<HttpResponse> {
    return withRetry(() => browserFetch(this.page, url, init), {
      label: `${init.method} ${url}`,
      retryOnResult: (response) =>
        isRetryableStatus(response.status()) ? `HTTP ${response.status()}` : false,
    });
  }

  private async parseJson<T>(response: HttpResponse, label: string): Promise<T> {
    if (!response.ok()) {
      throw new Error(`${label} returned HTTP ${response.status()}`);
    }
    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error(`${label} returned '${contentType}', expected application/json`);
    }
    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new Error(`${label} returned invalid JSON: ${(error as Error).message}`);
    }
  }
}
