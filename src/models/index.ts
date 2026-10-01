export type SiteType = 'Satellite' | 'Permanent';

export interface Location {
  name: string;
  country: string;
  countryCode?: string;
  siteType: SiteType;
}

export interface YardAddress {
  line1: string;
  city: string;
  province?: string;
  postalCode: string;
}

export interface AuctionEvent {
  name: string;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
}

export interface ItemCategory {
  categoryLocalized: string;
  totalAssets?: number;
}

export interface Yard {
  name: string;
  address: YardAddress;
  phone?: string;
  officeHours?: string;
  events: AuctionEvent[];
  itemsInYard: ItemCategory[];
}

export interface SearchResultSummary {
  totalAmount: number;
  firstTitles: string[];
}
