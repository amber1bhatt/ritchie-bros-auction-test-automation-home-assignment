import type { Page, Locator } from '@playwright/test';

export class ItemsCarousel {
  readonly heading: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: /items in yard/i });
  }

  async isVisible(): Promise<boolean> {
    return this.heading.isVisible();
  }
}
