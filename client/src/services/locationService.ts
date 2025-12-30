import axios from 'axios';

// API endpoints
const REST_COUNTRIES_API = 'https://restcountries.com/v3.1';
const COUNTRIES_NOW_API = 'https://countriesnow.space/api/v0.1';

// Types
export interface Country {
  name: string;
  code: string;
  flag: string;
  nativeName?: string;
}

// Cache
let countriesCache: Country[] | null = null;
const citiesCache: Record<string, string[]> = {};

/**
 * Fetches all countries from RestCountries API
 * Returns cached data if available
 */
export const fetchCountries = async (): Promise<Country[]> => {
  // Return cached data if available
  if (countriesCache) {
    return countriesCache;
  }

  try {
    const response = await axios.get(
      `${REST_COUNTRIES_API}/all?fields=name,cca2,flags`,
      { timeout: 10000 }
    );

    if (response.data && Array.isArray(response.data)) {
      const countries: Country[] = response.data
        .map((country: any) => ({
          name: country.name?.common || '',
          code: country.cca2 || '',
          flag: country.flags?.emoji || getFlagEmoji(country.cca2 || ''),
          nativeName: country.name?.nativeName 
            ? (Object.values(country.name.nativeName)[0] as any)?.common 
            : undefined,
        }))
        .filter((c: Country) => c.name && c.code)
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

      countriesCache = countries;
      return countries;
    }

    throw new Error('Invalid response from countries API');
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    throw error;
  }
};

/**
 * Fetches cities for a given country from CountriesNow API
 * Returns cached data if available
 */
export const fetchCities = async (countryName: string): Promise<string[]> => {
  const cacheKey = countryName.toLowerCase();
  
  // Return cached data if available
  if (citiesCache[cacheKey]) {
    return citiesCache[cacheKey];
  }

  try {
    const response = await axios.post(
      `${COUNTRIES_NOW_API}/countries/cities`,
      { country: countryName },
      { timeout: 10000 }
    );

    if (response.data?.error === false && Array.isArray(response.data?.data)) {
      const cities = response.data.data
        .filter((city: string) => city && city.trim())
        .sort((a: string, b: string) => a.localeCompare(b));
      
      citiesCache[cacheKey] = cities;
      return cities;
    }

    // Return empty array if no cities found
    return [];
  } catch (error) {
    console.error(`Failed to fetch cities for ${countryName}:`, error);
    return [];
  }
};

/**
 * Search countries by name (includes native names)
 */
export const searchCountries = (countries: Country[], query: string): Country[] => {
  if (!query.trim()) return countries;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return countries.filter(country => {
    // Check main name
    if (country.name.toLowerCase().includes(normalizedQuery)) return true;
    
    // Check native name
    if (country.nativeName?.toLowerCase().includes(normalizedQuery)) return true;
    
    // Check country code
    if (country.code.toLowerCase() === normalizedQuery) return true;
    
    return false;
  });
};

/**
 * Generate flag emoji from country code
 */
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

/**
 * Clear all caches (useful for refresh)
 */
export const clearLocationCache = (): void => {
  countriesCache = null;
  Object.keys(citiesCache).forEach(key => delete citiesCache[key]);
};
