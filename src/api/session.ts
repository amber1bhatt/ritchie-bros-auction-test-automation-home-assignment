import type { Page } from '@playwright/test';

import { URLS } from '../../test-data/constants';
import { logger } from '../utils/logger';
import { gotoWithRetry } from '../utils/navigation';

import { readNextData } from './next-data';

export interface SiteSession {
  buildId: string;
  locale: string;
}

// load a real page first: it sets the WAF cookies and gives us the buildId for /_next/data
export async function bootstrapSession(page: Page): Promise<SiteSession> {
  const response = await gotoWithRetry(page, URLS.locationsDirectory);
  if (!response?.ok()) {
    throw new Error(
      `Session bootstrap failed: ${URLS.locationsDirectory} returned ${response?.status()}` +
        (response?.status() === 403 ? ' (blocked by the WAF, see ASSUMPTIONS.md)' : ''),
    );
  }
  const data = await readNextData(page);
  const session = { buildId: data.buildId, locale: data.locale ?? data.defaultLocale ?? 'en-US' };
  logger.debug(`API session ready: buildId=${session.buildId} locale=${session.locale}`);
  return session;
}
