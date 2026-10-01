import { test, expect, TAG } from '../../src/fixtures/test';
import type { YardPageProps } from '../../src/models';
import { logger } from '../../src/utils/logger';
import { flattenCategories, isIsoDate } from '../../src/utils/parsing';
import { EDMONTON_YARD, ITEMS_IN_YARD, THRESHOLDS, URLS } from '../../test-data/constants';

test('API 2 - Edmonton yard page JSON', { tag: [TAG.regression, TAG.yard] }, async ({ api }) => {
  let props: YardPageProps | undefined;

  await test.step('A2.1 payload is JSON', async () => {
    const url = api.pageDataUrl(URLS.edmontonYard);
    const response = await api.pageDataRaw(URLS.edmontonYard);
    const contentType = response.headers()['content-type'];
    expect(response.status(), `GET ${url} returns ${response.status()}`).toBe(200);
    expect(contentType, `content-type is JSON ("${contentType}")`).toContain('application/json');

    props = ((await response.json()) as { pageProps: YardPageProps }).pageProps;
    expect(props.yardDetails, 'payload has yardDetails').toBeDefined();
  });

  const yard = () => props!;

  await test.step('A2.2 yard name, address, phone and hours', async () => {
    const { name, address, contactPhone, pickupHoursFrom, pickupHoursTo } = yard().yardDetails!;
    expect(name, `name is "${name}"`).toBe(EDMONTON_YARD.name);
    expect(
      address.addressLine1,
      `address includes "${EDMONTON_YARD.addressLine}" ("${address.addressLine1}")`,
    ).toContain(EDMONTON_YARD.addressLine);
    expect(address.city, `city is "${address.city}"`).toBe(EDMONTON_YARD.city);
    expect(address.zipPostalCode, `postal code is "${address.zipPostalCode}"`).toBe(
      EDMONTON_YARD.postalCode,
    );
    expect(contactPhone, `phone number is present ("${contactPhone}")`).toMatch(/\d{7,}/);
    expect(pickupHoursFrom, `pickup hours start ("${pickupHoursFrom}")`).toMatch(/^\d{1,2}:\d{2}/);
    expect(pickupHoursTo, `pickup hours end ("${pickupHoursTo}")`).toMatch(/^\d{1,2}:\d{2}/);
  });

  await test.step('A2.3 upcoming events', async () => {
    const events = yard().upcomingEvents;
    logger.list(
      'Upcoming events',
      events.map(
        (e) => `${e.event_advertised_name}: ${e.event_start_date_time} to ${e.event_end_date_time}`,
      ),
    );

    // same minimum as scenario 3.2
    expect(
      events.length,
      `upcoming events: ${events.length} (must be >= ${THRESHOLDS.minEventCards})`,
    ).toBeGreaterThanOrEqual(THRESHOLDS.minEventCards);

    const malformed = events.filter(
      (e) =>
        !e.event_advertised_name?.trim() ||
        !isIsoDate(e.event_start_date_time) ||
        !isIsoDate(e.event_end_date_time) ||
        Date.parse(e.event_end_date_time!) < Date.parse(e.event_start_date_time!),
    );
    expect(malformed, `all ${events.length} events have a name and valid start/end dates`).toEqual(
      [],
    );

    const local = events.filter((e) =>
      EDMONTON_YARD.eventNamePattern.test(e.event_advertised_name),
    );
    expect(
      local,
      `an event refers to Edmonton or Nisku (${local.length} of ${events.length})`,
    ).not.toHaveLength(0);
  });

  await test.step('A2.4 equipment categories in itemsInYard', async () => {
    const categories = flattenCategories(yard().itemsInYard);
    const distinct = new Set(categories.map((c) => c.categoryLocalized));

    // a category can repeat across events, hence the distinct count
    expect(
      categories.length,
      `categories: ${categories.length} flattened, ${distinct.size} distinct (must be > ${THRESHOLDS.itemsInYardCategories})`,
    ).toBeGreaterThan(THRESHOLDS.itemsInYardCategories);

    const unnamed = categories.filter(
      (c) => typeof c.categoryLocalized !== 'string' || c.categoryLocalized.trim() === '',
    );
    expect(unnamed, `all ${categories.length} categories have a categoryLocalized name`).toEqual(
      [],
    );

    const badQuantities = categories.filter(
      (c) =>
        c.totalAssets !== undefined &&
        c.totalAssets !== null &&
        !(
          typeof c.totalAssets === 'number' &&
          Number.isFinite(c.totalAssets) &&
          c.totalAssets >= 0
        ),
    );
    expect(badQuantities, 'every totalAssets present is a number >= 0').toEqual([]);

    expect([...distinct], `categories include ${ITEMS_IN_YARD.required}`).toContain(
      ITEMS_IN_YARD.required,
    );
  });
});
