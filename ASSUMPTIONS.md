# Assumptions and notes

Things I found while building this, and the decisions that came out of them.

## Setup

- TypeScript and `@playwright/test` for both suites. npm, lockfile committed.
- Chromium only for now.
- Node 20 (`.nvmrc`, `engines`).
- `tests/e2e` and `tests/api` are separate Playwright projects.

## Bot protection

- `curl` and plain `fetch` to `/lp` get a 403.
- Headless Chromium also gets a 403 ("Access Denied"), even with a real user
  agent, so the suite runs headed. CI will need xvfb for that.
- `page.request` shares the browser context's cookies, so the API client gets
  through too.

## General

- Counts, dates and lots change, so tests check shape, minimums and membership
  instead of exact values. Expected values are in `test-data/constants.ts`.
- No accounts, bids or form submissions.

## /lp

- `h1` is "Locations". There are 16 `h4` country headings, and each one is
  followed by a `<ul>` of `<a href="/lp/{slug}">City</a>`. Satellites have a
  trailing `*`.
- The "Auction sites" / "Local representatives" toggles are `role="tab"`,
  not buttons.
- Page JSON: `pageProps.yards` (74 today). Each yard has `name`, `type`
  (`Satellite` or `Permanent`), `address` (`addressLine1`, `city`,
  `provinceStateCode`, `country`, `countryCode`, `zipPostalCode`),
  `contactPhone` and `pickupHoursFrom/To`.

## Yard page (/lp/edmonton-ab)

- There's no `h1`. The name is an `h3`, and section titles are `h4`.
- Representatives is a tab and sets `?tab=local_representative`. Rep data is in
  the page JSON as `localRepresentative[]` (name, role, region[], contacts). 23
  today.
- Page JSON for `/lp/edmonton-ab` has `yardDetails` (same shape as above),
  `upcomingEvents[]` (`event_advertised_name`, `event_start_date_time`,
  `event_end_date_time`) and `itemsInYard[]`. Each `itemsInYard` group has its
  own `categories[]` of `{categoryLocalized, totalAssets}`, so they need
  flattening to count.

## Search

- `POST /api/search` with `{ searchParams: { freeText } }` returns 200 JSON.
  Totals are in `results.totalAmount`, and lots are in `results.records[]`,
  using `assetDescription` for the name (there's no `title`).
- On the page, lot cards are `[data-testid^="searchResultItemCard-"]` and
  titles are `item-card-title-link`. The total shows as "1-60 of N" at the
  bottom and "N results for" at the top. The tests read the bottom one.

## Open questions

- The `/search` page shows the Edmonton total (1906 today), but a raw
  `POST /api/search` with only `{ searchParams: { freeText } }` returns the
  full catalog (~93k). The page must be adding a filter. Need to sort this out
  for API 3. Scenario 4 reads the total off the page, so it isn't affected.
- Toggle role: it's `role="tab"`, not a button, and `SiteToggle` uses
  `getByRole('tab')` now.
