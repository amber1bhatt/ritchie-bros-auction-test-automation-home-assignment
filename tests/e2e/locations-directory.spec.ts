import { test, expect, TAG } from '../../src/fixtures/test';
import { logger } from '../../src/utils/logger';
import {
  FIRST_COUNTRIES,
  REQUIRED_COUNTRIES,
  REQUIRED_US_CITIES,
  REQUIRED_CANADIAN_CITIES,
  THRESHOLDS,
  SITE_TYPE_EXAMPLES,
} from '../../test-data/constants';

const names = (sites: { name: string }[]) => sites.map((s) => s.name);

// one test with a step per row, so /lp is loaded once
test(
  'Scenario 1 - Locations directory',
  { tag: [TAG.smoke, TAG.regression, TAG.directory] },
  async ({ page, locationsPage }) => {
    await test.step('1.1 open the page', async () => {
      const response = await locationsPage.open();
      expect(response?.ok(), `/lp loads (HTTP ${response?.status()})`).toBe(true);
      await expect(locationsPage.heading, 'h1 heading is "Locations"').toHaveText('Locations');
      await expect(page, `page title mentions auction sites ("${await page.title()}")`).toHaveTitle(
        /auction sites/i,
      );
    });

    await test.step('1.2 intro text and satellite-site note', async () => {
      await expect(
        locationsPage.intro,
        'intro says Ritchie Bros. offers over 60 permanent auction sites and local yards',
      ).toBeVisible();
      await expect(locationsPage.intro, 'intro names Ritchie Bros.').toContainText('Ritchie Bros.');
      await expect(
        locationsPage.satelliteNote,
        'note says satellite sites are marked with an asterisk',
      ).toBeVisible();
      await expect(locationsPage.satelliteNote, 'note shows the * marker').toContainText('*');
    });

    await test.step('1.3 list country groups (below the map)', async () => {
      const firstHeading = locationsPage.countryHeadings().first();
      await firstHeading.scrollIntoViewIfNeeded();
      await expect(firstHeading, 'country headings are visible below the map').toBeVisible();

      const countries = await locationsPage.countryNames();
      logger.info(`Countries: ${countries.join(', ')}`);

      expect(
        countries.length,
        `country headings: ${countries.length} (must be > 0)`,
      ).toBeGreaterThan(0);
      expect(
        countries.slice(0, FIRST_COUNTRIES.length),
        `first two headings are ${FIRST_COUNTRIES.join(', ')}`,
      ).toEqual([...FIRST_COUNTRIES]);
      expect(countries, `headings include ${REQUIRED_COUNTRIES.join(', ')}`).toEqual(
        expect.arrayContaining([...REQUIRED_COUNTRIES]),
      );

      const counts = await Promise.all(
        countries.map(async (c) => ({
          country: c,
          sites: (await locationsPage.sitesFor(c)).length,
        })),
      );
      logger.info(`Sites per country: ${counts.map((c) => `${c.country} ${c.sites}`).join(', ')}`);
      expect(
        counts.filter((c) => c.sites === 0),
        'every country heading has a site list below it',
      ).toEqual([]);
    });

    await test.step('1.4 list sites under United States', async () => {
      const usSites = names(await locationsPage.sitesFor('United States'));
      expect(
        usSites.length,
        `United States sites: ${usSites.length} (must be > ${THRESHOLDS.usLocations})`,
      ).toBeGreaterThan(THRESHOLDS.usLocations);
      expect(usSites, `US list includes ${REQUIRED_US_CITIES.join(', ')}`).toEqual(
        expect.arrayContaining([...REQUIRED_US_CITIES]),
      );
    });

    await test.step('1.5 list sites under Canada', async () => {
      const canadaSites = names(await locationsPage.sitesFor('Canada'));
      expect(
        canadaSites.length,
        `Canada sites: ${canadaSites.length} (must be > ${THRESHOLDS.canadianLocations})`,
      ).toBeGreaterThan(THRESHOLDS.canadianLocations);
      expect(canadaSites, `Canada list includes ${REQUIRED_CANADIAN_CITIES.join(', ')}`).toEqual(
        expect.arrayContaining([...REQUIRED_CANADIAN_CITIES]),
      );
    });

    const all = await locationsPage.allSites();

    await test.step('1.6 count satellite vs permanent sites', async () => {
      const satellites = all.filter((s) => s.isSatellite).length;
      const permanent = all.filter((s) => !s.isSatellite).length;
      const total = satellites + permanent;

      expect(
        satellites,
        `satellite sites (*): ${satellites} (must be > ${THRESHOLDS.satelliteLocations})`,
      ).toBeGreaterThan(THRESHOLDS.satelliteLocations);
      expect(
        permanent,
        `permanent sites: ${permanent} (must be > ${THRESHOLDS.permanentLocations})`,
      ).toBeGreaterThan(THRESHOLDS.permanentLocations);
      expect(
        total,
        `total sites: ${total} (must be > ${THRESHOLDS.combinedLocations})`,
      ).toBeGreaterThan(THRESHOLDS.combinedLocations);
    });

    await test.step('1.7 check known satellite vs permanent', async () => {
      const byName = (name: string) => all.find((s) => s.name === name);
      for (const name of SITE_TYPE_EXAMPLES.satellite) {
        expect(byName(name), `${name} is listed`).toBeDefined();
        expect(byName(name)?.isSatellite, `${name} is marked with * (satellite)`).toBe(true);
      }
      for (const name of SITE_TYPE_EXAMPLES.permanent) {
        expect(byName(name), `${name} is listed`).toBeDefined();
        expect(byName(name)?.isSatellite, `${name} has no * (permanent)`).toBe(false);
      }
    });

    await test.step('1.9 switch Auction sites / Local representatives', async () => {
      const { auctionSites, localRepresentatives } = locationsPage.toggle;
      await expect(auctionSites, 'Auction sites tab is visible').toBeVisible();
      await expect(localRepresentatives, 'Local representatives tab is visible').toBeVisible();
      await expect(auctionSites, 'Auction sites is selected by default').toHaveAttribute(
        'aria-selected',
        'true',
      );

      await locationsPage.toggle.showLocalRepresentatives();
      await expect(
        localRepresentatives,
        'Local representatives is selected after clicking it',
      ).toHaveAttribute('aria-selected', 'true');
      await expect(
        locationsPage.localRepresentativesContent,
        '"Search for representatives" is shown',
      ).toBeVisible();

      await locationsPage.toggle.showAuctionSites();
      await expect(auctionSites, 'Auction sites is selected after switching back').toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(
        locationsPage.group('Canada').heading,
        'directory is shown (Canada heading visible)',
      ).toBeVisible();
      await expect(
        locationsPage.localRepresentativesContent,
        '"Search for representatives" is hidden again',
      ).toBeHidden();
    });
  },
);
