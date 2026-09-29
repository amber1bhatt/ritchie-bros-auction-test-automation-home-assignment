import type { Page, Locator } from '@playwright/test';

import { parseDisplayedTotal } from '../utils/parsing';

import { BasePage } from './base-page';

export interface LotCardSummary {
  title: string;
  // null when the card doesn't show it
  location: string | null;
  closing: string | null;
}

export class SearchResultsPage extends BasePage {
  protected readonly path: string;

  readonly searchInput: Locator;
  // 2.2k results for "Edmonton"
  readonly countHeader: Locator;
  // 1-60 of 2290
  readonly pagerTotal: Locator;
  readonly lotCards: Locator;
  readonly lotTitles: Locator;
  readonly noExactMatches: Locator;

  constructor(
    page: Page,
    readonly freeText: string,
  ) {
    super(page);
    this.path = `/search?freeText=${encodeURIComponent(freeText)}`;
    this.searchInput = page.getByRole('textbox', { name: 'Search', exact: true });
    this.countHeader = page.getByTestId('search-count-header');
    this.pagerTotal = page.getByText(/^\s*\d+\s*-\s*\d+\s+of\s+[\d,]+\s*$/).first();
    this.lotCards = page.locator('[data-testid^="searchResultItemCard-"]');
    this.lotTitles = page.getByTestId('item-card-title-link');
    this.noExactMatches = page.getByTestId('zero-exact-matches-title');
  }

  async displayedTotal(): Promise<number> {
    return parseDisplayedTotal((await this.pagerTotal.textContent()) ?? '');
  }

  async headerTotal(): Promise<number> {
    const text = (await this.countHeader.textContent()) ?? '';
    return parseDisplayedTotal(text.replace(/"[^"]*"/g, ''));
  }

  // location has no test id, it's the <p title="..."> under the lot title
  async cardSummaries(): Promise<LotCardSummary[]> {
    await this.lotCards.first().waitFor();
    return this.lotCards.evaluateAll((cards) =>
      cards.map((card) => {
        const text = (selector: string): string | null => {
          const el = card.querySelector(selector);
          return el ? (el.textContent ?? '').trim() : null;
        };
        return {
          title: text('[data-testid="item-card-title-link"]') ?? '',
          location: text('p[title]:not([data-testid])'),
          closing: text('[data-testid="end-date-section"]'),
        };
      }),
    );
  }
}
