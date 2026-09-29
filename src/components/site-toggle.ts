import type { Page, Locator } from '@playwright/test';

export class SiteToggle {
  readonly auctionSites: Locator;
  readonly localRepresentatives: Locator;

  constructor(page: Page) {
    this.auctionSites = page.getByRole('button', { name: /auction sites/i });
    this.localRepresentatives = page.getByRole('button', { name: /local representatives/i });
  }

  async showAuctionSites(): Promise<void> {
    await this.auctionSites.click();
  }

  async showLocalRepresentatives(): Promise<void> {
    await this.localRepresentatives.click();
  }
}
