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
  sale_event_id?: string;
  categories: ItemCategory[];
}

export interface RepresentativeContacts {
  phone?: string;
  mobile?: string;
  email?: string;
  fax?: string;
}

export interface Representative {
  name: string;
  role?: string;
  region: string[];
  contacts: RepresentativeContacts;
}

export interface LocationsPageProps {
  yards: Yard[];
}

export interface YardPageProps {
  yardDetails?: Yard;
  upcomingEvents: UpcomingEvent[];
  itemsInYard: ItemsInYardGroup[];
  localRepresentative: Representative[];
}

export interface RedirectPageProps {
  __N_REDIRECT?: string;
  __N_REDIRECT_STATUS?: number;
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
  // missing (not []) when there are no hits
  records?: SearchRecord[];
  fallbackApplied?: boolean;
}

export interface SearchResponse {
  results: SearchResults;
}

export interface DirectorySite {
  name: string;
  slug: string;
  isSatellite: boolean;
}

export interface CarouselCategory {
  name: string;
  quantityText: string;
  quantity: number;
}
