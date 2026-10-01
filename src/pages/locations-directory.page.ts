import type { Page, Locator } from '@playwright/test';

import { CountryGroup } from '../components/country-group';
import { SiteToggle } from '../components/site-toggle';
import type { Yard } from '../models';
import { readPageProps } from '../api/next-data';
import { URLS } from '../../test-data/constants';

import { BasePage } from './base-page';

interface LpPageProps {
  yards: Yard[];
}

export class LocationsDirectoryPage extends BasePage {
  protected readonly path = URLS.locationsDirectory;

  readonly heading: Locator;
  readonly toggle: SiteToggle;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.toggle = new SiteToggle(page);
  }

  countryHeadings(): Locator {
    return this.page.getByRole('heading', { level: 4 });
  }

  group(country: string): CountryGroup {
    return new CountryGroup(this.page, country);
  }

  async yards(): Promise<Yard[]> {
    const props = await readPageProps<LpPageProps>(this.page);
    return props.yards;
  }
}
