import type { Page, Locator } from '@playwright/test';

import { CountryGroup } from '../components/country-group';
import { SiteToggle } from '../components/site-toggle';
import type { DirectorySite } from '../models';
import { URLS } from '../../test-data/constants';

import { BasePage } from './base-page';

export class LocationsDirectoryPage extends BasePage {
  protected readonly path = URLS.locationsDirectory;

  readonly heading: Locator;
  readonly intro: Locator;
  readonly satelliteNote: Locator;
  readonly localRepresentativesContent: Locator;
  readonly localRepresentativesEmptyState: Locator;
  readonly toggle: SiteToggle;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.intro = page.getByText(/offers over 60 permanent auction sites and local yards/i);
    this.satelliteNote = page.getByText(/satellite sites are represented by an asterisk/i);
    this.localRepresentativesContent = page.getByText(/search for representatives/i);
    this.localRepresentativesEmptyState = page.getByText(/^no results\./i);
    this.toggle = new SiteToggle(page);
  }

  countryHeadings(): Locator {
    return this.page.getByRole('heading', { level: 4 });
  }

  group(country: string): CountryGroup {
    return new CountryGroup(this.page, country);
  }

  async countryNames(): Promise<string[]> {
    return (await this.countryHeadings().allTextContents()).map((t) => t.trim());
  }

  async sitesFor(country: string): Promise<DirectorySite[]> {
    return this.group(country).sites();
  }

  async openSite(country: string, name: string): Promise<void> {
    await this.group(country).siteLink(name).click();
    await this.page.waitForURL(/\/lp\/[^/?#]+/);
  }

  async allSites(): Promise<DirectorySite[]> {
    const countries = await this.countryNames();
    const groups = await Promise.all(countries.map((country) => this.group(country).sites()));
    return groups.flat();
  }
}
