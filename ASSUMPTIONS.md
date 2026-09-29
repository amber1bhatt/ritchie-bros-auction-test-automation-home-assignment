# Assumptions and notes

Things I found while building this, and the decisions that came out of them.

## Setup

- TypeScript and `@playwright/test` for both suites. npm, lockfile committed.
- Chromium only.
- Node 20 (`.nvmrc`, `engines`).
- `tests/e2e` and `tests/api` are separate Playwright projects.

## Bot protection

- `curl` and plain `fetch` to `/lp` get a 403.
- Headless Chromium also gets a 403 ("Access Denied"), even with a real user
  agent. The new headless mode (`channel: 'chromium'`) is blocked too.
- Headed Chromium works, so the suite runs headed. CI needs xvfb for that.
  `HEADLESS=true` is only there for other environments.
- API calls use `page.request`, which shares the browser context's cookies. The
  `api` fixture loads `/lp` once before making any calls.

## General

- Counts, dates and lots change, so tests check shape, minimums and membership
  instead of exact values.
- No accounts, bids or form submissions.

## /lp

- `h1` is "Locations". There are 16 `h4` country headings, and each one is
  followed by a `<ul>` of `<a href="/lp/{slug}">City</a>`. Satellites have a
  trailing `*`.
- The "Auction sites" / "Local representatives" toggles are `role="tab"`.
  Switching to Local representatives adds a rep search above the directory but
  doesn't hide the country list. Before a site is picked it shows "No results.
  Search for your location representative...".
- Page JSON: `pageProps.yards` (74 today). Each yard has `name`, `type`
  (`Satellite` or `Permanent`), `address` (`addressLine1`, `city`,
  `provinceStateCode`, `country`, `countryCode`, `zipPostalCode`),
  `contactPhone` and `pickupHoursFrom/To`.

## Yard page (/lp/edmonton-ab)

- There's no `h1`. The name is an `h3`, and section titles are `h4`.
- "Details" and "Auction events" sit side by side on desktop, so 3.2 checks
  that events come after details in the DOM rather than lower on the screen.
- Representatives is a tab and sets `?tab=local_representative`. Rep cards have
  no test id. The name is an `h4`, the region is the first `h6`, and contacts
  show as "Phone: / Mobile: / Email:". There are 23 today.
- Items in yard: every slide is in the DOM (41 cards, about 5 visible), so 3.4
  counts all of them.
- Page JSON has `yardDetails`, `upcomingEvents[]` and `itemsInYard[]`.
  `itemsInYard` is grouped by sale event, so flattening it (A2.4) repeats some
  categories: 54 entries, 41 unique. A2.4 counts the flattened list as asked and
  logs both numbers.

## Page JSON endpoint

- API 1 and 2 call `GET /_next/data/{buildId}/{locale}/lp.json` and
  `.../lp/edmonton-ab.json`, so they can check the status code and content type.
- `/lp/[slug]` only returns JSON when the locale (`en-US`) is in the path.
  Without it you get HTML. `/lp` works either way, but the locale is always
  included.
- `buildId` changes with each deploy, so it's read from the page at run time.

## Search

- `POST /api/search`. `freeText` goes at the top level of the body. I first
  nested it under `searchParams`, which gets ignored silently and returns the
  whole catalog (~95k).
- Totals are in `results.totalAmount`, and lots are in `results.records[]`,
  using `assetDescription` for the name. `records` is missing entirely when
  there are no hits.
- On the page, lot cards are `[data-testid^="searchResultItemCard-"]` and titles
  are `item-card-title-link`. The pager at the bottom shows the exact total
  ("1-60 of N"), and that's the number the tests use. The header at the top
  (`search-count-header`) shows a rounded one ("2.1k results for ...").
  Location is the `<p title>` under the title, and the closing date is
  `end-date-section`.
- No match: a letters-only nonsense term shows "No exact matches found for ..."
  (`zero-exact-matches-title`) and no lots. The API returns `totalAmount: 0` and
  `fallbackApplied: true`.
- A term with digits like `zzzzqqqxnotarealthing123` still shows "No exact
  matches". It then lists "Results matching fewer words", about 125 lots that
  match "Lot 123".
- An empty `freeText` returns the full catalog.
- Early on I thought nonsense terms returned the full catalog. That turned out
  to come from the `searchParams` mistake above.

## Negative cases

- An unknown yard slug redirects to `/not-found` (title "404 page not found").
  Its page JSON is `{ __N_REDIRECT: "/not-found" }` with no `yardDetails`.
- Malformed JSON to `/api/search` returns 400. It has to be sent as a `Buffer`,
  because a string gets re-encoded by Playwright and comes back 200.
- An unknown `/api/*` route returns 404.
- Two cases aren't tested:
  - A stale `buildId` returns 404 from the browser but 403 from `page.request`,
    so the result isn't consistent.
  - `size: -1` returns a 503. That looks like a server bug, and I didn't want to
    keep hitting it on prod.

## CI

- `quality` (lint and typecheck) blocks. `tests` has `continue-on-error: true`,
  because the site may block GitHub runner IPs. That would be a red build that
  has nothing to do with the code. To make it block, remove that line.
- `BASE_URL` comes from the dispatch input, then the repo variable, then prod.
