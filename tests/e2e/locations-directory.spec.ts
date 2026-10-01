import { test, expect } from '../../src/fixtures/test';
import {
  REQUIRED_COUNTRIES,
  REQUIRED_US_CITIES,
  REQUIRED_CANADIAN_CITIES,
  THRESHOLDS,
  SITE_TYPE_EXAMPLES,
} from '../../test-data/constants';

const names = (sites: { name: string }[]) => sites.map((s) => s.name);

test('Scenario 1 - Locations directory', async ({ locationsPage }) => {
  await test.step('1.1 open the page', async () => {
    await locationsPage.open();
  });

  await test.step('1.2 heading and satellite-site note', async () => {
    await expect(locationsPage.heading).toHaveText(/locations/i);
    await expect(locationsPage.intro).toBeVisible();
    await expect(locationsPage.satelliteNote).toBeVisible();
  });

  await test.step('1.3 list country groups', async () => {
    const countries = await locationsPage.countryNames();
    expect(countries.length).toBeGreaterThan(THRESHOLDS.distinctCountries);
    expect(countries.slice(0, 2)).toEqual(['United States', 'Canada']);
    for (const country of REQUIRED_COUNTRIES) {
      expect(countries).toContain(country);
    }
  });

  await test.step('1.4 list sites under United States', async () => {
    const usSites = names(await locationsPage.sitesFor('United States'));
    expect(usSites.length).toBeGreaterThan(THRESHOLDS.usLocations);
    for (const city of REQUIRED_US_CITIES) {
      expect(usSites).toContain(city);
    }
  });

  await test.step('1.5 list sites under Canada', async () => {
    const canadaSites = names(await locationsPage.sitesFor('Canada'));
    expect(canadaSites.length).toBeGreaterThan(THRESHOLDS.canadianLocations);
    for (const city of REQUIRED_CANADIAN_CITIES) {
      expect(canadaSites).toContain(city);
    }
  });

  await test.step('1.6 count satellite vs permanent sites', async () => {
    const all = await locationsPage.allSites();
    const satellites = all.filter((s) => s.isSatellite);
    const permanent = all.filter((s) => !s.isSatellite);
    expect(satellites.length).toBeGreaterThan(THRESHOLDS.satelliteLocations);
    expect(permanent.length).toBeGreaterThan(THRESHOLDS.permanentLocations);
    expect(all.length).toBeGreaterThan(THRESHOLDS.combinedLocations);
  });

  await test.step('1.7 check known satellite vs permanent', async () => {
    const all = await locationsPage.allSites();
    const byName = (name: string) => all.find((s) => s.name === name);
    for (const name of SITE_TYPE_EXAMPLES.satellite) {
      expect(byName(name)?.isSatellite, `${name} should be a satellite`).toBe(true);
    }
    for (const name of SITE_TYPE_EXAMPLES.permanent) {
      expect(byName(name)?.isSatellite, `${name} should be permanent`).toBe(false);
    }
  });

  await test.step('1.9 switch Auction sites / Local representatives', async () => {
    await expect(locationsPage.toggle.auctionSites).toBeVisible();
    await expect(locationsPage.toggle.localRepresentatives).toBeVisible();
    await locationsPage.toggle.showLocalRepresentatives();
    await expect(locationsPage.localRepresentativesContent).toBeVisible();
  });
});
