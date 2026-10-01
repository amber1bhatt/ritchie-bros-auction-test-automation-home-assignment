import type { Page } from '@playwright/test';

export interface NextData<T = unknown> {
  props: { pageProps: T };
  buildId: string;
  locale?: string;
  defaultLocale?: string;
  page: string;
  query: Record<string, unknown>;
}

export async function readNextData<T = unknown>(page: Page): Promise<NextData<T>> {
  const raw = await page.locator('#__NEXT_DATA__').textContent();
  if (!raw) {
    throw new Error('__NEXT_DATA__ script not found on page');
  }
  return JSON.parse(raw) as NextData<T>;
}

// /lp/[slug] only returns JSON when the locale is in the path, so always include it
export function nextDataPath(buildId: string, locale: string, route: string): string {
  const normalized = route.replace(/^\/+|\/+$/g, '');
  return `/_next/data/${buildId}/${locale}/${normalized}.json`;
}
