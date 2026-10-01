import type { Page, Locator } from '@playwright/test';

import type { DirectorySite } from '../models';
import { cleanSiteName, isSatellite, slugFromHref } from '../utils/parsing';

export class CountryGroup {
  readonly heading: Locator;

  constructor(
    private readonly page: Page,
    readonly country: string,
  ) {
    this.heading = page.getByRole('heading', { level: 4, name: country, exact: true });
  }

  async exists(): Promise<boolean> {
    return (await this.heading.count()) > 0;
  }

  private siteLinks(): Locator {
    return this.heading.locator('xpath=following-sibling::ul[1]').getByRole('link');
  }

  siteLink(name: string): Locator {
    return this.siteLinks().filter({ hasText: name });
  }

  async sites(): Promise<DirectorySite[]> {
    const links = await this.siteLinks().all();
    const sites: DirectorySite[] = [];
    for (const link of links) {
      const label = (await link.textContent())?.trim() ?? '';
      const href = (await link.getAttribute('href')) ?? '';
      sites.push({
        name: cleanSiteName(label),
        slug: slugFromHref(href),
        isSatellite: isSatellite(label),
      });
    }
    return sites;
  }
}
