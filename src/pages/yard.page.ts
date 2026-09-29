import type { Page, Locator } from '@playwright/test';

import { ItemsCarousel } from '../components/items-carousel';
import type { ItemCategory, ItemsInYardGroup, UpcomingEvent, Yard } from '../models';
import { readPageProps } from '../api/next-data';
import { flattenCategories } from '../utils/parsing';

import { BasePage } from './base-page';

interface YardPageProps {
  yardDetails: Yard;
  upcomingEvents: UpcomingEvent[];
  itemsInYard: ItemsInYardGroup[];
}

export class YardPage extends BasePage {
  protected readonly path: string;

  readonly heading: Locator;
  readonly auctionEventsHeading: Locator;
  readonly representativesTab: Locator;
  readonly itemsCarousel: ItemsCarousel;

  constructor(page: Page, slug: string) {
    super(page);
    this.path = `/lp/${slug}`;
    this.heading = page.getByRole('heading', { level: 1 });
    this.auctionEventsHeading = page.getByRole('heading', { name: /auction events/i });
    this.representativesTab = page.getByRole('tab', { name: /representatives/i });
    this.itemsCarousel = new ItemsCarousel(page);
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
