import type { Page, Locator } from '@playwright/test';

import type { CarouselCategory } from '../models';
import { parseItemQuantity } from '../utils/parsing';

// every slide is in the DOM, off-screen ones are just translated out of view
export class ItemsCarousel {
  readonly heading: Locator;
  readonly root: Locator;
  readonly cards: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { level: 4, name: 'Items in yard', exact: true });
    this.root = page
      .locator('div')
      .filter({ has: this.heading })
      .filter({ has: page.getByTestId('carousel-right-arrow') })
      .last();
    this.cards = this.root
      .getByRole('link')
      .filter({ has: page.getByRole('heading', { level: 6 }) });
  }

  async categories(): Promise<CarouselCategory[]> {
    await this.cards.first().waitFor({ state: 'attached' });
    const raw = await this.cards.evaluateAll((cards) =>
      cards.map((card) => {
        const name = card.querySelector('h6')?.textContent?.trim() ?? '';
        const rest = (card as HTMLElement).innerText.replace(name, '').trim();
        return { name, quantityText: rest };
      }),
    );
    return raw.map((c) => ({ ...c, quantity: parseItemQuantity(c.quantityText) }));
  }

  async inViewCount(): Promise<number> {
    const box = await this.root.boundingBox();
    if (!box) return 0;
    return this.cards.evaluateAll(
      (cards, bounds) =>
        cards.filter((card) => {
          const r = card.getBoundingClientRect();
          return r.width > 0 && r.left < bounds.x + bounds.width && r.right > bounds.x;
        }).length,
      box,
    );
  }
}
