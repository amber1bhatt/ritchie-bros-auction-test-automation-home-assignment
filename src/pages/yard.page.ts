import type { Page, Locator } from '@playwright/test';

import { ItemsCarousel } from '../components/items-carousel';
import type {
  ItemCategory,
  ItemsInYardGroup,
  Representative,
  UpcomingEvent,
  Yard,
} from '../models';
import { readPageProps } from '../api/next-data';
import { flattenCategories } from '../utils/parsing';

import { BasePage } from './base-page';

interface YardPageProps {
  yardDetails: Yard;
  upcomingEvents: UpcomingEvent[];
  itemsInYard: ItemsInYardGroup[];
  localRepresentative: Representative[];
}

export class YardPage extends BasePage {
  protected readonly path: string;

  readonly heading: Locator;
  readonly detailsHeading: Locator;
  readonly auctionEventsHeading: Locator;
  readonly aboutHeading: Locator;
  readonly aboutSection: Locator;
  readonly becomeSellerHeading: Locator;
  readonly representativesTab: Locator;
  readonly itemsCarousel: ItemsCarousel;

  constructor(
    page: Page,
    slug: string,
    private readonly locationName: string,
  ) {
    super(page);
    this.path = `/lp/${slug}`;
    // no h1 on yard pages, the name is an h3
    this.heading = page.getByRole('heading', { level: 3, name: locationName, exact: true });
    this.detailsHeading = page.getByRole('heading', { name: /^details$/i });
    this.auctionEventsHeading = page.getByRole('heading', { name: /auction events/i });
    this.aboutHeading = page.getByRole('heading', { name: /about this yard/i });
    this.aboutSection = page.getByText(
      /open weekdays for equipment drop-off, inspection and pick-up/i,
    );
    this.becomeSellerHeading = page.getByRole('heading', { name: /become a seller/i });
    this.representativesTab = page.getByRole('tab', { name: /representatives/i });
    this.itemsCarousel = new ItemsCarousel(page);
  }

  text(pattern: RegExp): Locator {
    return this.page.getByText(pattern);
  }

  async openRepresentatives(): Promise<void> {
    await this.representativesTab.click();
    await this.page.waitForURL(/tab=local_representative/);
  }

  async representatives(): Promise<Representative[]> {
    return (await readPageProps<YardPageProps>(this.page)).localRepresentative;
  }

  async details(): Promise<Yard> {
    return (await readPageProps<YardPageProps>(this.page)).yardDetails;
  }

  async upcomingEvents(): Promise<UpcomingEvent[]> {
    return (await readPageProps<YardPageProps>(this.page)).upcomingEvents;
  }

  async itemCategories(): Promise<ItemCategory[]> {
    const props = await readPageProps<YardPageProps>(this.page);
    return flattenCategories(props.itemsInYard);
  }
}
