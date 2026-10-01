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

- `POST /api/search`. `freeText` goes at the top level of the body, next to
  `filters`. I found that in the search page's own JSON
  (`pageProps.data.requests`).
- My first try nested it under `searchParams`. That gets ignored silently and
  returns the whole catalog (~93k), which is why the API total didn't match the
  page before. `{ freeText: 'Edmonton', size: 60 }` returns the filtered total
  (1906 today), same as the page.
- Totals are in `results.totalAmount`, and lots are in `results.records[]`,
  using `assetDescription` for the name (there's no `title`).
- On the page, lot cards are `[data-testid^="searchResultItemCard-"]` and
  titles are `item-card-title-link`. The total shows as "1-60 of N" at the
  bottom and "N results for" at the top. The tests read the bottom one.

## Negative cases (e2e)

- An unknown yard slug (e.g. `/lp/not-a-real-yard-xyz`) redirects to
  `/not-found`, with the title "404 page not found".
- An unmatched search term doesn't show an empty or error state. The API
  returns 200 with the full catalog (~93k total, 60 returned), and
  `fallbackApplied` stays `false`. So the test checks that the page still shows
  results instead of erroring.

## Negative cases (API)

- Malformed JSON to `/api/search` returns 400. It has to be sent as a `Buffer`,
  because a string gets re-encoded by Playwright and comes back 200.
- An empty `freeText` returns 200 with the full catalog. No query is needed, and
  there's no error.
- The `/not-found` page for a bad yard slug has no `yardDetails` in its page
  JSON.

## CI

- `.github/workflows/tests.yml` runs on every push, PR and manual dispatch.
  `quality` (lint and typecheck) blocks. `tests` runs Playwright under
  `xvfb-run`, since headed needs a display.
- `tests` has `continue-on-error: true`, because the site may block GitHub
  runner IPs. That would be a red build that has nothing to do with the code. To
  make it block, remove that line.
- `BASE_URL` comes from the dispatch input, then the repo variable, then prod.
  That's where a staging URL would go.

## Resolved

- Toggle role: it's `role="tab"`, not a button, and `SiteToggle` uses
  `getByRole('tab')`.
- The Edmonton total mismatch: see "Search" above.
