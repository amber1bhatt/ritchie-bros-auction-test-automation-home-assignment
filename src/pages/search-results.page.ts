import type { Page, Locator } from '@playwright/test';

import { BasePage } from './base-page';

export class SearchResultsPage extends BasePage {
  protected readonly path: string;

  readonly resultCount: Locator;

  constructor(page: Page, freeText: string) {
    super(page);
    this.path = `/search?freeText=${encodeURIComponent(freeText)}`;
    this.resultCount = page.getByText(/results?\b/i).first();
  }
}
