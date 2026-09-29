import type { APIRequestContext, APIResponse } from '@playwright/test';

import type { SearchResponse, SearchResults } from '../models';

import { nextDataPath } from './next-data';
import type { SiteSession } from './session';

export interface SearchParams {
  freeText: string;
  size?: number;
}

const JSON_HEADERS = { 'content-type': 'application/json', accept: 'application/json' };

// uses page.request so calls share the browser's cookies (plain requests get a 403)
export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    readonly session: SiteSession,
  ) {}

  async searchRaw(params: SearchParams): Promise<APIResponse> {
    // freeText must be top level, nesting it under searchParams is silently ignored
    return this.request.post('/api/search', {
      headers: JSON_HEADERS,
      data: { size: 60, ...params },
    });
  }

  async search(params: SearchParams): Promise<SearchResults> {
    const response = await this.searchRaw(params);
    return (await this.parseJson<SearchResponse>(response, '/api/search')).results;
  }

  pageDataUrl(route: string): string {
    return nextDataPath(this.session.buildId, this.session.locale, route);
  }

  async pageDataRaw(route: string): Promise<APIResponse> {
    return this.request.get(this.pageDataUrl(route), {
      headers: { accept: 'application/json', 'x-nextjs-data': '1' },
    });
  }

  async pageProps<T>(route: string): Promise<T> {
    const response = await this.pageDataRaw(route);
    return (await this.parseJson<{ pageProps: T }>(response, route)).pageProps;
  }

  async get(path: string): Promise<APIResponse> {
    return this.request.get(path);
  }

  async postRaw(path: string, body: Buffer | Record<string, unknown>): Promise<APIResponse> {
    return this.request.post(path, { headers: JSON_HEADERS, data: body });
  }

  private async parseJson<T>(response: APIResponse, label: string): Promise<T> {
    if (!response.ok()) {
      throw new Error(`${label} returned HTTP ${response.status()}`);
    }
    const contentType = response.headers()['content-type'] ?? '';
    if (!contentType.includes('application/json')) {
      throw new Error(`${label} returned '${contentType}', expected application/json`);
    }
    return (await response.json()) as T;
  }
}
