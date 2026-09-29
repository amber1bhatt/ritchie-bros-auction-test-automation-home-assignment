export const URLS = {
  locationsDirectory: '/lp',
  edmontonYard: '/lp/edmonton-ab',
  edmontonSearch: '/search?freeText=Edmonton',
} as const;

export const REQUIRED_COUNTRIES = [
  'United States',
  'Canada',
  'Australia',
  'United Kingdom',
  'Netherlands',
  'UAE',
] as const;

export const REQUIRED_US_CITIES = [
  'Phoenix',
  'Salt Lake City',
  'Houston',
  'Las Vegas',
  'Atlanta',
] as const;

export const REQUIRED_CANADIAN_CITIES = [
  'Edmonton',
  'Montreal',
  'Toronto',
  'Regina',
  'Saskatoon',
] as const;

export const THRESHOLDS = {
  usLocations: 20,
  canadianLocations: 10,
  satelliteLocations: 15,
  permanentLocations: 25,
  combinedLocations: 60,
  distinctCountries: 8,
  itemsInYardCategories: 5,
} as const;

export const EDMONTON_YARD = {
  name: 'Edmonton',
  addressLine: '1500 Sparrow Drive',
  city: 'Nisku',
  province: 'AB',
  postalCode: 'T9E 8H6',
} as const;

export const SITE_TYPE_EXAMPLES = {
  satellite: ['San Antonio', 'Calgary, AB'],
  permanent: ['Phoenix', 'Edmonton'],
} as const;
