import type { APIResponse, Page } from '@playwright/test';

import type { SearchResults } from '../models';

export interface SearchParams {
  freeText: string;
  size?: number;
}

interface SearchResponse {
  results: SearchResults;
}

// uses page.request so calls share the browser's cookies (plain requests get a 403)
export class ApiClient {
  constructor(private readonly page: Page) {}

  async searchRaw(params: SearchParams): Promise<APIResponse> {
    return this.page.request.post('/api/search', {
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      data: { size: 60, ...params },
    });
  }

  async search(params: SearchParams): Promise<SearchResults> {
    const response = await this.searchRaw(params);
    if (!response.ok()) {
      throw new Error(`/api/search returned ${response.status()}`);
    }
    const body = (await response.json()) as SearchResponse;
    return body.results;
  }
}
