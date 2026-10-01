import { test, expect, TAG } from '../../src/fixtures/test';
import type { LocationsPageProps, Yard } from '../../src/models';
import { logger } from '../../src/utils/logger';
import {
  EDMONTON_YARD,
  PHOENIX_YARD,
  SITE_TYPES,
  THRESHOLDS,
  URLS,
} from '../../test-data/constants';

test(
  'API 1 - Auction sites list from /lp page JSON',
  { tag: [TAG.smoke, TAG.regression, TAG.directory] },
  async ({ api }) => {
    let yards: Yard[] = [];

    await test.step('A1.1 payload is JSON and includes a list of yards', async () => {
      const url = api.pageDataUrl(URLS.locationsDirectory);
      const response = await api.pageDataRaw(URLS.locationsDirectory);
      const contentType = response.headers()['content-type'];
      expect(response.status(), `GET ${url} returns ${response.status()}`).toBe(200);
      expect(contentType, `content-type is JSON ("${contentType}")`).toContain('application/json');

      const body = (await response.json()) as { pageProps: LocationsPageProps };
      expect(Array.isArray(body.pageProps.yards), 'pageProps.yards is an array').toBe(true);
      yards = body.pageProps.yards;
      expect(yards.length, `yards list is not empty (${yards.length})`).toBeGreaterThan(0);
    });

    await test.step('A1.2 more than 60 locations', async () => {
      expect(
        yards.length,
        `locations: ${yards.length} (must be > ${THRESHOLDS.combinedLocations})`,
      ).toBeGreaterThan(THRESHOLDS.combinedLocations);
    });

    await test.step('A1.3 each location has a name and a country', async () => {
      const incomplete = yards.filter(
        (y) => !y.name?.trim() || !(y.address?.country?.trim() || y.address?.countryCode?.trim()),
      );
      expect(incomplete, `all ${yards.length} locations have a name and a country`).toEqual([]);
    });

    await test.step('A1.4 includes Edmonton (CAN) and Phoenix (USA)', async () => {
      const edmonton = yards.find((y) => y.name === EDMONTON_YARD.name)?.address;
      const phoenix = yards.find((y) => y.name === PHOENIX_YARD.name)?.address;

      expect(
        edmonton,
        `Edmonton is in ${EDMONTON_YARD.country} / ${EDMONTON_YARD.countryCode}`,
      ).toMatchObject({ country: EDMONTON_YARD.country, countryCode: EDMONTON_YARD.countryCode });
      expect(
        phoenix,
        `Phoenix is in ${PHOENIX_YARD.country} / ${PHOENIX_YARD.countryCode}`,
      ).toMatchObject({ country: PHOENIX_YARD.country, countryCode: PHOENIX_YARD.countryCode });
    });

    await test.step('A1.5 every location has a site type; satellite/permanent counts', async () => {
      const untyped = yards.filter((y) => !(SITE_TYPES as readonly string[]).includes(y.type));
      expect(untyped, `all ${yards.length} locations are ${SITE_TYPES.join(' or ')}`).toEqual([]);

      const satellite = yards.filter((y) => y.type === 'Satellite').length;
      const permanent = yards.filter((y) => y.type === 'Permanent').length;
      expect(
        satellite,
        `satellite: ${satellite} (must be > ${THRESHOLDS.satelliteLocations})`,
      ).toBeGreaterThan(THRESHOLDS.satelliteLocations);
      expect(
        permanent,
        `permanent: ${permanent} (must be > ${THRESHOLDS.permanentLocations})`,
      ).toBeGreaterThan(THRESHOLDS.permanentLocations);
    });

    await test.step('A1.6 distinct countries', async () => {
      const countries = [...new Set(yards.map((y) => y.address.country))];
      logger.info(`Countries: ${countries.join(', ')}`);

      expect(
        countries.length,
        `distinct countries: ${countries.length} (must be > ${THRESHOLDS.distinctCountries})`,
      ).toBeGreaterThan(THRESHOLDS.distinctCountries);
      expect(countries, 'countries include United States and Canada').toEqual(
        expect.arrayContaining(['United States', 'Canada']),
      );
    });
  },
);
