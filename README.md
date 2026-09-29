# Ritchie Bros. Auction - Test Automation

E2E and API tests for the Ritchie Bros. locations site, written in TypeScript
with Playwright.

The tests run against the live production site. They don't create accounts,
place bids, or submit the "Become a seller" form.

## Prerequisites

- Node.js 20.12+ (`nvm use`)
- npm 10+

## Setup

```bash
npm ci
npx playwright install chromium
```

To override `BASE_URL`, `PLAYWRIGHT_WORKERS` or `HEADLESS`, copy `.env.example`
to `.env`.

## Running

```bash
npm test            # everything
npm run test:e2e    # e2e only
npm run test:api    # api only
npm run report      # open the last HTML report

npx playwright test tests/e2e/yard-page.spec.ts
```

Tests run headed, so you'll see Chromium windows open. The site returns 403 to
headless Chromium (details in `ASSUMPTIONS.md`). On Linux without a display, use
`xvfb-run -a npm test`.

While the tests run you get one line per test. At the end there's a full
breakdown: each test, its steps (numbered as in the assignment), and every
validation under each step with ✓ or ✘. Validations include the value that was
checked, like `United States sites: 31 (must be > 20)`, and failures show
expected vs received. The search total and first 5 titles (Scenario 4 and
API 3) are printed in the same place. The reporter is in
`src/reporters/validation-reporter.ts`, and lint requires a message on every
`expect` so nothing is left out of the output.

## Checks

```bash
npm run typecheck
npm run lint
npm run format:check
```

## What's covered

| Assignment   | Spec                                    |
| ------------ | --------------------------------------- |
| Scenario 1   | `tests/e2e/locations-directory.spec.ts` |
| Scenario 2   | `tests/e2e/open-yard.spec.ts`           |
| Scenario 3   | `tests/e2e/yard-page.spec.ts`           |
| Scenario 4   | `tests/e2e/search.spec.ts`              |
| Negative e2e | `tests/e2e/negative.spec.ts`            |
| API 1        | `tests/api/auction-sites.spec.ts`       |
| API 2        | `tests/api/edmonton-yard.spec.ts`       |
| API 3        | `tests/api/search.spec.ts`              |
| Negative API | `tests/api/negative.spec.ts`            |

Test steps use the assignment's numbering (1.1, A2.3, ...), so they're easy to
match up in the HTML report.

Negative tests:

- e2e: unknown yard slug goes to `/not-found`, a country with no sites isn't
  listed, the Local representatives empty state, a search with no match shows
  "No exact matches" and no lots, and a partial match still shows lots.
- API: malformed JSON gets a 400. A search with no match returns 0 hits with
  `fallbackApplied: true`. An empty search returns the full catalog. An unknown
  yard slug redirects to `/not-found`. An unknown `/api` route returns 404.

## Structure

```
tests/e2e/          e2e specs
tests/api/          api specs
src/pages/          page objects
src/components/     shared UI pieces (country group, tab toggle, carousel)
src/api/            api client and session setup
src/models/         types
src/fixtures/       playwright fixtures
src/utils/          parsing and logging
test-data/          expected values, thresholds, regexes
```

E2E specs only look at the rendered page, through page objects. API specs only
make HTTP calls, through `ApiClient`. That way a failure clearly belongs to one
side or the other.

Page objects hold locators and specs hold assertions. Locators use roles, names
and the site's `data-testid`s where possible, not CSS classes.

`ApiClient` goes through `page.request` so it shares the browser's cookies.
Plain HTTP requests get blocked. The `api` fixture loads one page first, which
sets the cookies and gives us the Next.js `buildId` for `/_next/data` URLs.

Values that change (cities, thresholds, formats) are in `test-data/constants.ts`.
Tests check shape, minimums and membership, not exact live numbers.

## CI

`.github/workflows/tests.yml` runs on every push and PR:

- `quality`: lint and typecheck. Failures block.
- `tests`: Playwright under `xvfb-run`, with the report and traces uploaded as
  artifacts.

The `tests` job doesn't block for now, since the site may block GitHub's IP
ranges. Set a `BASE_URL` repo variable, or use **Run workflow**, to point it at
another environment.
