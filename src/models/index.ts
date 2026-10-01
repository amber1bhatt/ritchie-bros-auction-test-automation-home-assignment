export type SiteType = 'Satellite' | 'Permanent';

export interface YardAddress {
  addressLine1: string;
  city: string;
  provinceState?: string;
  provinceStateCode?: string;
  country: string;
  countryCode: string;
  zipPostalCode: string;
}

export interface Yard {
  name: string;
  type: SiteType;
  status: string;
  address: YardAddress;
  contactPhone?: string;
  pickupHoursFrom?: string;
  pickupHoursTo?: string;
}

export interface UpcomingEvent {
  event_advertised_name: string;
  event_start_date_time?: string;
  event_end_date_time?: string;
  date_of_event?: string;
}

export interface ItemCategory {
  category: string;
  categoryLocalized: string;
  totalAssets?: number;
}

export interface ItemsInYardGroup {
  categories: ItemCategory[];
}

export interface SearchRecord {
  assetDescription: string;
  itemSiteName?: string;
  locationName?: string;
  dateOfEvent?: string;
}

export interface SearchResults {
  totalAmount: number;
  returnedAmount: number;
  records: SearchRecord[];
}

export interface DirectorySite {
  name: string;
  slug: string;
  isSatellite: boolean;
}
