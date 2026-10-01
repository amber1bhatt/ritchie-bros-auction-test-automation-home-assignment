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

`npm ci` also sets up a pre-commit hook that lints, formats and typechecks.

Settings are read from env vars in `src/config/env.ts`. To change them, copy
`.env.example` to `.env`. The main ones are `BASE_URL`, `PLAYWRIGHT_WORKERS`,
`PLAYWRIGHT_RETRIES` and `HEADLESS`.

## Running

```bash
npm run test:smoke        # smoke suite
npm run test:regression   # everything
npm run test:negative     # negative tests only
npm run test:e2e          # e2e only
npm run test:api          # api only
npm run test:list         # list tests and tags without running them
npm run report            # open the last HTML report

npx playwright test --grep @yard
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

## Suites

Each test has a suite tag and an area tag (`src/fixtures/tags.ts`).

- `@smoke`: Scenarios 1, 2 and 4, API 1 and API 3. Runs on every push and PR
  and takes under 10s.
- `@regression`: all 17 tests. Runs nightly.
- `@negative`: the error and empty state tests.
- Areas: `@directory`, `@yard`, `@search`.

Smoke hits each page and endpoint once, including the one click-through
journey (Scenario 2). Scenario 3 and API 2 are regression only. They check a
lot of detail on one yard, so when they fail it's usually a content change, not
an outage.

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
src/config/         env vars and defaults
src/fixtures/       extended test (page objects, api client) and tags
src/pages/          page objects, all extend BasePage
src/components/     shared UI pieces (country group, tab toggle, carousel)
src/api/            api client and session setup
src/models/         types
src/reporters/      console reporter and OpenTelemetry reporter
src/utils/          retries, navigation, logging, parsing, request blocking
test-data/          expected values, thresholds, regexes
```

Specs import `test` from `src/fixtures/test.ts`, which hands them the page
objects and the API client.

E2E specs only look at the rendered page, through page objects. API specs only
make HTTP calls, through `ApiClient`. That way a failure clearly belongs to one
side or the other.

Page objects hold locators and specs hold assertions. Locators use roles, names
and the site's `data-testid`s where possible, not CSS classes.

`ApiClient` sends its calls with `fetch` from inside a browser page, because
the site blocks requests that don't come from a real browser. Each worker opens
one page on `/lp`, which gets past the bot check and gives us the Next.js
`buildId` for `/_next/data` URLs. All API tests in that worker then use that
page.

Values that change (cities, thresholds, formats) are in `test-data/constants.ts`.
Tests check shape, minimums and membership, not exact live numbers.

## Running against prod

- Page loads and API calls are retried up to 3 times on network errors and
  5xx/429, with a 1s then 2s wait. Retries show up as `[warn]` lines in the
  output. 4xx and 403 aren't retried.
- Tests run fully parallel on 4 workers locally and 2 on CI. The full suite
  takes about 15s locally.
- Most requests these pages make go to ad and analytics vendors. Those are
  blocked during runs (`src/utils/third-party.ts`), so the tests don't end up
  in RB's analytics and pages load faster. It's an allowlist, so if the site
  adds something it needs, a test may break. `BLOCK_THIRD_PARTY=false` turns
  it off.

## Checks

```bash
npm run check    # lint, typecheck and format check
npm run lint:fix
npm run format
```

Dependencies are pinned to exact versions, and the lockfile is committed.

## CI

`.github/workflows/tests.yml`:

- `quality`: lint, typecheck and format check. Failures block.
- `tests`: smoke on push and PR, regression nightly (06:00 UTC). **Run
  workflow** lets you pick the suite and a base URL. Runs under `xvfb-run` and
  uploads the report and traces as artifacts.

The `tests` job doesn't block by default, since the site may block GitHub's IP
ranges. Set the repo variable `TESTS_BLOCKING=true` to make it block. Set a
`BASE_URL` repo variable to point it at another environment.

## OpenTelemetry

If `OTEL_EXPORTER_OTLP_ENDPOINT` is set, each run is also sent as a trace
(`src/reporters/otel-reporter.ts`). The run is the root span. Under it is one
span per test, under that one per step, and under those the checks and
Playwright calls. Spans carry the test status, tags, retry count and, on CI,
the run URL and commit.

With Honeycomb:

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io \
OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=<api key> \
npm run test:smoke
```

Or locally with Jaeger (UI on http://localhost:16686):

```bash
docker run --rm -p 16686:16686 -p 4318:4318 jaegertracing/jaeger:2.21.0
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 npm run test:smoke
```

On CI, set the `OTEL_EXPORTER_OTLP_ENDPOINT` repo variable and the
`OTEL_EXPORTER_OTLP_HEADERS` secret. If the export fails, a warning is printed
and the run isn't affected.

## Known gaps

- Headed Chromium only, because of the WAF. CI runs may get blocked.
- Prod only, so tests check shape and minimums rather than exact data.
- Not tested: the seller form submission, anything behind login, a stale
  `buildId`, and `size: -1` on search. Reasons are in `ASSUMPTIONS.md`.
- No visual or accessibility checks.
