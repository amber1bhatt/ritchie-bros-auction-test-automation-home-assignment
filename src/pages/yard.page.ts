import type { Page, Locator } from '@playwright/test';

import { ItemsCarousel } from '../components/items-carousel';

import { BasePage } from './base-page';

export interface EventCardSummary {
  dateRange: string;
  title: string;
}

export interface RepresentativeCardSummary {
  name: string;
  region: string;
  text: string;
}

export class YardPage extends BasePage {
  protected readonly path: string;

  readonly heading: Locator;
  readonly detailsTab: Locator;
  readonly representativesTab: Locator;

  readonly detailsPanel: Locator;
  readonly detailsHeading: Locator;
  readonly address: Locator;
  readonly officeHours: Locator;
  readonly phoneLink: Locator;

  readonly auctionEventsHeading: Locator;
  readonly eventCards: Locator;

  readonly aboutHeading: Locator;
  readonly aboutBody: Locator;

  readonly itemsCarousel: ItemsCarousel;

  readonly sellerHeading: Locator;
  readonly sellerSection: Locator;
  readonly sellerForm: Locator;

  readonly representativesPanel: Locator;
  readonly representativeNames: Locator;

  constructor(
    page: Page,
    slug: string,
    readonly locationName: string,
  ) {
    super(page);
    this.path = `/lp/${slug}`;

    // no h1 on yard pages, the name is an h3
    this.heading = page.getByRole('heading', { level: 3, name: locationName, exact: true });
    this.detailsTab = page.getByRole('tab', { name: 'Details', exact: true });
    this.representativesTab = page.getByRole('tab', { name: 'Representatives', exact: true });

    this.detailsPanel = page.locator('#auction-site-tabpanel-details');
    this.detailsHeading = this.detailsPanel.getByRole('heading', {
      level: 4,
      name: 'Details',
      exact: true,
    });
    this.address = this.detailValue('Address');
    this.officeHours = this.detailValue('Office hours');
    this.phoneLink = this.detailsPanel.getByTestId('contact-phone-link');

    this.auctionEventsHeading = this.detailsPanel.getByRole('heading', {
      level: 4,
      name: 'Auction events',
      exact: true,
    });
    this.eventCards = this.detailsPanel.getByTestId(/^auction-card-\d+$/);

    this.aboutHeading = this.detailsPanel.getByRole('heading', {
      level: 4,
      name: 'About this yard',
      exact: true,
    });
    this.aboutBody = this.aboutHeading.locator('xpath=following-sibling::*[1]');

    this.itemsCarousel = new ItemsCarousel(page);

    this.sellerHeading = page.getByRole('heading', { name: 'Become a seller', exact: true });
    this.sellerForm = page.getByTestId('seller-form-body');
    this.sellerSection = page
      .locator('div')
      .filter({ has: this.sellerHeading })
      .filter({ has: this.sellerForm })
      .last();

    this.representativesPanel = page.locator('#auction-site-tabpanel-local_representative');
    this.representativeNames = this.representativesPanel.getByRole('heading', { level: 4 });
  }

  async isAfter(later: Locator, earlier: Locator): Promise<boolean> {
    const earlierHandle = await earlier.elementHandle();
    return later.evaluate(
      (el, other) =>
        !!other && !!(other.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING),
      earlierHandle,
    );
  }

  private detailValue(label: string): Locator {
    return this.detailsPanel
      .getByRole('heading', { level: 6, name: label, exact: true })
      .locator('xpath=following-sibling::*[1]');
  }

  async eventSummaries(): Promise<EventCardSummary[]> {
    const summaries: EventCardSummary[] = [];
    for (const card of await this.eventCards.all()) {
      summaries.push({
        dateRange: (await card.getByTestId(/^auction-card-date-range-/).innerText()).trim(),
        title: (await card.getByRole('heading', { level: 5 }).innerText()).trim(),
      });
    }
    return summaries;
  }

  async openRepresentatives(): Promise<void> {
    await this.representativesTab.click();
    await this.page.waitForURL(/tab=local_representative/);
  }

  // rep cards have no test id; walk up from the name h4 to the card
  async representativeCards(): Promise<RepresentativeCardSummary[]> {
    await this.representativeNames.first().waitFor();
    return this.representativeNames.evaluateAll((names) =>
      names.map((h4) => {
        let card: HTMLElement = h4 as HTMLElement;
        while (card.parentElement && card.parentElement.querySelectorAll('h4').length === 1) {
          card = card.parentElement;
        }
        return {
          name: h4.textContent?.trim() ?? '',
          region: card.querySelector('h6')?.textContent?.trim() ?? '',
          text: card.innerText,
        };
      }),
    );
  }
}
