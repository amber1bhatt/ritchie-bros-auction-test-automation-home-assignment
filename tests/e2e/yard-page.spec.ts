import { test, expect } from '../../src/fixtures/test';
import { logger } from '../../src/utils/logger';
import { EDMONTON_YARD, ITEMS_IN_YARD, PATTERNS, THRESHOLDS } from '../../test-data/constants';

test('Scenario 3 - Edmonton yard page', async ({ edmontonYard: yard }) => {
  await test.step('open the yard page', async () => {
    const response = await yard.open();
    expect(response?.ok(), `/lp/${EDMONTON_YARD.slug} loads (HTTP ${response?.status()})`).toBe(
      true,
    );
    await expect(yard.heading, `yard heading "${EDMONTON_YARD.name}" is visible`).toBeVisible();
  });

  await test.step('3.1 details: address, office hours, phone', async () => {
    await expect(yard.detailsHeading, 'Details heading is visible').toBeVisible();

    await expect(yard.address, 'address is shown').toBeVisible();
    const address = await yard.address.innerText();
    const addressLine = `${EDMONTON_YARD.addressLine}, ${EDMONTON_YARD.city}, ${EDMONTON_YARD.province}`;
    await expect(yard.address, `address includes "${addressLine}" ("${address}")`).toContainText(
      addressLine,
    );
    await expect(
      yard.address,
      `address includes postal code ${EDMONTON_YARD.postalCode}`,
    ).toContainText(EDMONTON_YARD.postalCode);

    await expect(yard.officeHours, 'office hours are shown').toBeVisible();
    const hours = await yard.officeHours.innerText();
    await expect(yard.officeHours, `office hours include Mon - Fri ("${hours}")`).toContainText(
      PATTERNS.weekdayRange,
    );
    await expect(yard.officeHours, 'office hours include a time range').toContainText(
      PATTERNS.timeRange,
    );

    await expect(yard.phoneLink, 'telephone number is shown').toBeVisible();
    const phone = await yard.phoneLink.innerText();
    await expect(yard.phoneLink, `phone looks like a number ("${phone}")`).toContainText(
      PATTERNS.phone,
    );
    await expect(yard.phoneLink, 'phone is a tel: link').toHaveAttribute('href', /^tel:/);
  });

  await test.step('3.2 auction events', async () => {
    await expect(yard.auctionEventsHeading, 'Auction events heading is visible').toBeVisible();
    // side by side on desktop, so check DOM order rather than position
    expect(
      await yard.isAfter(yard.auctionEventsHeading, yard.detailsHeading),
      'Auction events comes after Details',
    ).toBe(true);
    await expect(yard.eventCards.first(), 'first event card is visible').toBeVisible();

    const events = await yard.eventSummaries();
    expect(
      events.length,
      `event cards: ${events.length} (must be >= ${THRESHOLDS.minEventCards})`,
    ).toBeGreaterThanOrEqual(THRESHOLDS.minEventCards);
    for (const [i, event] of events.entries()) {
      expect(event.dateRange, `event ${i + 1} has a date range ("${event.dateRange}")`).toMatch(
        PATTERNS.eventDateRange,
      );
      expect(event.title, `event ${i + 1} has a title ("${event.title}")`).not.toBe('');
    }
  });

  await test.step('3.3 about this yard', async () => {
    await expect(yard.aboutHeading, 'About this yard heading is visible').toBeVisible();
    await expect(yard.aboutBody, 'About section is visible').toBeVisible();
    await expect(yard.aboutBody, 'About section is not empty').not.toBeEmpty();
    await expect(
      yard.aboutBody,
      'About text says the yard is open weekdays for drop-off, inspection and pick-up',
    ).toContainText(/open weekdays for equipment drop-off, inspection,? and pick-up/i);
  });

  await test.step('3.4 items in yard carousel (all slides, incl. off-screen)', async () => {
    const carousel = yard.itemsCarousel;
    await expect(carousel.heading, 'Items in yard heading is visible').toBeVisible();

    const categories = await carousel.categories();
    const inView = await carousel.inViewCount();
    logger.info(`Carousel: ${categories.map((c) => `${c.name} (${c.quantityText})`).join(', ')}`);

    expect(
      categories.length,
      `carousel cards: ${categories.length}, ${inView} in view (must be > ${THRESHOLDS.itemsInYardCategories})`,
    ).toBeGreaterThan(THRESHOLDS.itemsInYardCategories);

    const malformed = categories.filter(
      (c) => c.name === '' || !PATTERNS.itemQuantity.test(c.quantityText),
    );
    expect(malformed, `all ${categories.length} cards have a name and "N items"`).toEqual([]);

    const cardNames = categories.map((c) => c.name);
    expect(cardNames, `carousel includes ${ITEMS_IN_YARD.required}`).toContain(
      ITEMS_IN_YARD.required,
    );
    const found = cardNames.filter((n) => (ITEMS_IN_YARD.anyOf as readonly string[]).includes(n));
    expect(
      found,
      `carousel includes one of ${ITEMS_IN_YARD.anyOf.join(', ')} (found: ${found.join(', ')})`,
    ).not.toHaveLength(0);
  });

  await test.step('3.5 become a seller CTA (never submitted)', async () => {
    await expect(yard.sellerHeading, 'Become a seller heading is visible').toBeVisible();
    await expect(yard.sellerForm, 'seller form is visible (not submitted)').toBeVisible();
    const sellerPhone = (await yard.sellerSection.innerText()).match(PATTERNS.phone)?.[0];
    await expect(
      yard.sellerSection,
      `seller section has a phone number (${sellerPhone})`,
    ).toContainText(PATTERNS.phone);
  });

  await test.step('3.6 representatives tab', async () => {
    await yard.openRepresentatives();
    await expect(yard.representativesTab, 'Representatives tab is selected').toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(yard.representativesPanel, 'representatives panel is visible').toBeVisible();
    await expect(yard.representativeNames.first(), 'first rep card is visible').toBeVisible();

    const reps = await yard.representativeCards();
    expect(
      reps.length,
      `rep cards: ${reps.length} (must be >= ${THRESHOLDS.minRepresentatives})`,
    ).toBeGreaterThanOrEqual(THRESHOLDS.minRepresentatives);

    const incomplete = reps.filter(
      (r) => r.name === '' || r.region === '' || !PATTERNS.repContact.test(r.text),
    );
    expect(
      incomplete,
      `all ${reps.length} rep cards have a region and a phone, mobile or email (e.g. ${reps[0]?.name}, ${reps[0]?.region})`,
    ).toEqual([]);
  });
});
