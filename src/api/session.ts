import type { Page } from '@playwright/test';

import { URLS } from '../../test-data/constants';

import { readNextData } from './next-data';

export interface SiteSession {
  buildId: string;
  locale: string;
}

// load a real page first: it sets the WAF cookies and gives us the buildId for /_next/data
export async function bootstrapSession(page: Page): Promise<SiteSession> {
  const response = await page.goto(URLS.locationsDirectory, { waitUntil: 'domcontentloaded' });
  if (!response?.ok()) {
    throw new Error(
      `Session bootstrap failed: ${URLS.locationsDirectory} returned ${response?.status()}`,
    );
  }
  const data = await readNextData(page);
  return {
    buildId: data.buildId,
    locale: data.locale ?? data.defaultLocale ?? 'en-US',
  };
}
