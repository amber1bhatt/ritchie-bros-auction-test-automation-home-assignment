import type { Page, Locator } from '@playwright/test';

import { parseDisplayedTotal } from '../utils/parsing';

import { BasePage } from './base-page';

export class SearchResultsPage extends BasePage {
  protected readonly path: string;

  readonly resultTotal: Locator;
  readonly lotCards: Locator;
  readonly lotTitles: Locator;

  constructor(
    page: Page,
    private readonly freeText: string,
  ) {
    super(page);
    this.path = `/search?freeText=${encodeURIComponent(freeText)}`;
    this.resultTotal = page.getByText(/\d+\s*-\s*\d+\s+of\s+[\d,]+/i);
    this.lotCards = page.locator('[data-testid^="searchResultItemCard-"]');
    this.lotTitles = page.getByTestId('item-card-title-link');
  }

  async displayedTotal(): Promise<number> {
    const text = (await this.resultTotal.first().textContent()) ?? '';
    return parseDisplayedTotal(text);
  }

  async firstTitles(count: number): Promise<string[]> {
    const titles = await this.lotTitles.allTextContents();
    return titles.slice(0, count).map((t) => t.trim());
  }
}
