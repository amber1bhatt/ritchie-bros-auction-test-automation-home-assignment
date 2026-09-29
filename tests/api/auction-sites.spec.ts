import { test, expect } from '../../src/fixtures/test';
import { THRESHOLDS } from '../../test-data/constants';

test('API 1 - Auction sites list from /lp page JSON', async ({ locationsPage }) => {
  await locationsPage.open();
  const yards = await locationsPage.yards();

  await test.step('A1.1 payload includes a list of yards', async () => {
    expect(Array.isArray(yards)).toBe(true);
    expect(yards.length).toBeGreaterThan(0);
  });

  await test.step('A1.2 more than 60 locations', async () => {
    expect(yards.length).toBeGreaterThan(THRESHOLDS.combinedLocations);
  });

  await test.step('A1.3 each location has a name and a country', async () => {
    for (const yard of yards) {
      expect(yard.name.length).toBeGreaterThan(0);
      expect((yard.address.country || yard.address.countryCode).length).toBeGreaterThan(0);
    }
  });

  await test.step('A1.4 includes Edmonton (CAN) and Phoenix (USA)', async () => {
    const edmonton = yards.find((y) => y.name === 'Edmonton');
    const phoenix = yards.find((y) => y.name === 'Phoenix');
    expect(edmonton?.address.countryCode).toBe('CAN');
    expect(phoenix?.address.countryCode).toBe('USA');
  });

  await test.step('A1.5 site-type counts', async () => {
    const satellite = yards.filter((y) => y.type === 'Satellite');
    const permanent = yards.filter((y) => y.type === 'Permanent');
    expect(satellite.length).toBeGreaterThan(THRESHOLDS.satelliteLocations);
    expect(permanent.length).toBeGreaterThan(THRESHOLDS.permanentLocations);
  });

  await test.step('A1.6 distinct countries', async () => {
    const countries = new Set(yards.map((y) => y.address.country));
    expect(countries.size).toBeGreaterThan(THRESHOLDS.distinctCountries);
    expect(countries.has('United States')).toBe(true);
    expect(countries.has('Canada')).toBe(true);
  });
});
