import type { BrowserContext } from '@playwright/test';

// keeps test runs out of RB's analytics and ad tracking. most requests on
// these pages are trackers, so pages also load faster.
// allowlist: anything not here is aborted. if a test breaks because the site
// added something it needs, add it here or set BLOCK_THIRD_PARTY=false
const ALLOWED: readonly RegExp[] = [
  // first party, except ssgtm (server-side tag manager)
  /^https:\/\/(?!ssgtm\.)([a-z0-9-]+\.)*rbauction\.com\//,
  // contentful images
  /^https:\/\/images\.ctfassets\.net\//,
  // map on /lp
  /^https:\/\/maps\.(googleapis|gstatic)\.com\//,
  /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
  // recaptcha on the seller form
  /^https:\/\/www\.(google|gstatic)\.com\/recaptcha\//,
  // feature flags change what renders
  /^https:\/\/([a-z0-9-]+\.)*launchdarkly\.com\//,
  // cookie consent
  /^https:\/\/consent\.trustarc\.com\//,
  /^https:\/\/([a-z0-9-]+\.)*stripe\.(com|network)\//,
];

export const isAllowedRequest = (url: string): boolean =>
  !/^https?:/.test(url) || ALLOWED.some((pattern) => pattern.test(url));

export async function blockThirdPartyTracking(context: BrowserContext): Promise<void> {
  await context.route(
    (url) => !isAllowedRequest(url.href),
    (route) => route.abort('blockedbyclient'),
  );
}
