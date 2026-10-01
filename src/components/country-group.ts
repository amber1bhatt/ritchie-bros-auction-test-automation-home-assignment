import type { Page, Locator } from '@playwright/test';

import type { DirectorySite } from '../models';
import { cleanSiteName, isSatellite, slugFromHref } from '../utils/parsing';

export class CountryGroup {
  readonly heading: Locator;

  constructor(
    page: Page,
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

  // match with or without the trailing *
  siteLink(name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.siteLinks().filter({ hasText: new RegExp(`^\\s*${escaped}\\s*\\*?\\s*$`) });
  }

  async sites(): Promise<DirectorySite[]> {
    // evaluateAll doesn't auto-wait
    await this.heading.waitFor();
    const raw = await this.siteLinks().evaluateAll((links) =>
      links.map((link) => ({
        label: link.textContent ?? '',
        href: link.getAttribute('href') ?? '',
      })),
    );
    return raw.map(({ label, href }) => ({
      name: cleanSiteName(label),
      slug: slugFromHref(href),
      isSatellite: isSatellite(label),
    }));
  }
}
