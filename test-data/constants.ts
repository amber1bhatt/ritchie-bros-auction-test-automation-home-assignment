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

export const FIRST_COUNTRIES = ['United States', 'Canada'] as const;

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

// from the brief. min* values are >=, the rest are >
export const THRESHOLDS = {
  usLocations: 20,
  canadianLocations: 10,
  satelliteLocations: 15,
  permanentLocations: 25,
  combinedLocations: 60,
  distinctCountries: 8,
  itemsInYardCategories: 5,
  minEventCards: 1,
  minRepresentatives: 1,
} as const;

export const EDMONTON_YARD = {
  slug: 'edmonton-ab',
  name: 'Edmonton',
  country: 'Canada',
  countryCode: 'CAN',
  addressLine: '1500 Sparrow Drive',
  city: 'Nisku',
  province: 'AB',
  postalCode: 'T9E 8H6',
  eventNamePattern: /edmonton|nisku/i,
} as const;

export const PHOENIX_YARD = {
  name: 'Phoenix',
  country: 'United States',
  countryCode: 'USA',
} as const;

export const SITE_TYPE_EXAMPLES = {
  satellite: ['San Antonio', 'Calgary, AB'],
  permanent: ['Phoenix', 'Edmonton'],
} as const;

export const SITE_TYPES = ['Satellite', 'Permanent'] as const;

export const ITEMS_IN_YARD = {
  required: 'Excavators',
  anyOf: ['Harvesting Equipment', 'Agricultural Tractors', 'Sprayers', 'Excavator Attachments'],
} as const;

export const SEARCH = {
  edmonton: 'Edmonton',
  // no digits on purpose, "foo123" would match "Lot 123"
  noMatch: 'qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
  partialMatch: 'zzzzqqqxnotarealthing123',
  logFirstN: 5,
} as const;

export const NEGATIVE = {
  unknownYardSlug: 'not-a-real-yard-xyz',
  absentCountry: 'Antarctica',
  unknownApiRoute: '/api/does-not-exist',
} as const;

export const PATTERNS = {
  weekdayRange: /mon\s*-\s*fri/i,
  timeRange: /\d{1,2}:\d{2}\s*[ap]m\s*-\s*\d{1,2}:\d{2}\s*[ap]m/i,
  phone: /\+?\d[\d\s().-]{7,}\d/,
  // "Sep 22 - Sep 25", or a single date for one-day events
  eventDateRange: /^[A-Z][a-z]{2} \d{1,2}(\s*-\s*[A-Z][a-z]{2} \d{1,2})?$/,
  itemQuantity: /^\d[\d,]*\s+items?$/i,
  repContact: /(phone|mobile|email)\s*:/i,
} as const;
