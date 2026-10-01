import type { ItemCategory, ItemsInYardGroup } from '../models';

const SATELLITE_MARKER = '*';

export function isSatellite(siteLabel: string): boolean {
  return siteLabel.trim().endsWith(SATELLITE_MARKER);
}

export function cleanSiteName(siteLabel: string): string {
  return siteLabel.trim().replace(/\*+$/, '').trim();
}

export function slugFromHref(href: string): string {
  return href.replace(/^\/lp\//, '').trim();
}

export function flattenCategories(groups: ItemsInYardGroup[]): ItemCategory[] {
  return groups.flatMap((group) => group.categories ?? []);
}

// "78 items" -> 78
export function parseItemQuantity(text: string): number {
  const match = text.match(/(\d[\d,]*)\s+items?\b/i);
  return match ? Number(match[1]!.replace(/,/g, '')) : Number.NaN;
}

// handles both "2.2k results" and "1-60 of 2290"
export function parseDisplayedTotal(text: string): number {
  const suffixed = text.match(/([\d.,]+)\s*([km])\b/i);
  const plain = [...text.matchAll(/\b([\d,]+)\b/g)].map((m) => Number(m[1]!.replace(/,/g, '')));

  const candidates: number[] = plain.filter((n) => !Number.isNaN(n));
  if (suffixed) {
    const base = Number(suffixed[1]!.replace(/,/g, ''));
    const factor = suffixed[2]!.toLowerCase() === 'm' ? 1_000_000 : 1_000;
    candidates.push(base * factor);
  }
  return candidates.length ? Math.max(...candidates) : 0;
}

export function isIsoDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}
