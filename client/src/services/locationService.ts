import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeText } from '../utils/text';

// API endpoints
const REST_COUNTRIES_API = 'https://restcountries.com/v3.1';
const COUNTRIES_NOW_API = 'https://countriesnow.space/api/v0.1';

const COUNTRIES_CACHE_KEY = '@raven_countries_cache';
const CITIES_CACHE_PREFIX = '@raven_cities_';

// Types
export interface Country {
  name: string;
  code: string;
  flag: string;
  nativeName?: string;
}

// In-memory cache (fast — no async needed after first load)
let countriesMemCache: Country[] | null = null;
const citiesMemCache: Record<string, string[]> = {};

// In-flight promise deduplication (prevents parallel duplicate requests)
let countriesInFlight: Promise<Country[]> | null = null;
const citiesInFlight: Record<string, Promise<string[]>> = {};

/**
 * Fetches all countries. Uses memory cache → AsyncStorage cache → network.
 */
export const fetchCountries = async (): Promise<Country[]> => {
  // 1. In-memory hit
  if (countriesMemCache) return countriesMemCache;

  // 2. Deduplicate in-flight requests
  if (countriesInFlight) return countriesInFlight;

  const doFetch = async (): Promise<Country[]> => {
    // 3. AsyncStorage hit
    try {
      const cached = await AsyncStorage.getItem(COUNTRIES_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Country[];
        if (parsed.length > 0) {
          countriesMemCache = parsed;
          return parsed;
        }
      }
    } catch {}

    // 4. Network fetch
    try {
      const response = await axios.get(
        `${REST_COUNTRIES_API}/all?fields=name,cca2,flags`,
        { timeout: 15000 }
      );

      if (response.data && Array.isArray(response.data)) {
        const countries: Country[] = response.data
          .map((c: any) => ({
            name: c.name?.common || '',
            code: c.cca2 || '',
            flag: c.flags?.emoji || getFlagEmoji(c.cca2 || ''),
            nativeName: c.name?.nativeName
              ? (Object.values(c.name.nativeName)[0] as any)?.common
              : undefined,
          }))
          .filter((c: Country) => c.name && c.code)
          .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

        countriesMemCache = countries;
        // Persist to AsyncStorage (no await — fire and forget)
        AsyncStorage.setItem(COUNTRIES_CACHE_KEY, JSON.stringify(countries)).catch(() => {});
        return countries;
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }

    return [];
  };

  countriesInFlight = doFetch().finally(() => { countriesInFlight = null; });
  return countriesInFlight;
};

/**
 * Fetches cities for a given country. Uses memory cache → AsyncStorage cache → network.
 */
export const fetchCities = async (countryName: string): Promise<string[]> => {
  const key = countryName.toLowerCase();

  // 1. In-memory hit
  if (citiesMemCache[key]) return citiesMemCache[key];

  // 2. Deduplicate in-flight requests
  if (key in citiesInFlight) return citiesInFlight[key];

  const doFetch = async (): Promise<string[]> => {
    // 3. AsyncStorage hit
    try {
      const cached = await AsyncStorage.getItem(CITIES_CACHE_PREFIX + key);
      if (cached) {
        const parsed = JSON.parse(cached) as string[];
        if (parsed.length > 0) {
          citiesMemCache[key] = parsed;
          return parsed;
        }
      }
    } catch {}

    // 4. Network fetch
    try {
      const response = await axios.post(
        `${COUNTRIES_NOW_API}/countries/cities`,
        { country: countryName },
        { timeout: 10000 }
      );

      if (response.data?.error === false && Array.isArray(response.data?.data)) {
        const cities: string[] = response.data.data
          .filter((c: string) => c && c.trim())
          .sort((a: string, b: string) => a.localeCompare(b));

        citiesMemCache[key] = cities;
        // Persist to AsyncStorage (fire and forget)
        AsyncStorage.setItem(CITIES_CACHE_PREFIX + key, JSON.stringify(cities)).catch(() => {});
        return cities;
      }
    } catch (error) {
      console.error(`Failed to fetch cities for ${countryName}:`, error);
    }

    return [];
  };

  citiesInFlight[key] = doFetch().finally(() => { delete citiesInFlight[key]; });
  return citiesInFlight[key];
};

/**
 * Pre-warm cities cache for a given country (call when country is selected, 
 * before the user taps the city field).
 */
export const prewarmCities = (countryName: string): void => {
  if (!countryName) return;
  const key = countryName.toLowerCase();
  // Only kick off if not already cached or in-flight
  if (!citiesMemCache[key] && !citiesInFlight[key]) {
    fetchCities(countryName).catch(() => {});
  }
};

/**
 * Search countries by name (includes native names)
 */
export const searchCountries = (countries: Country[], query: string): Country[] => {
  if (!query.trim()) return countries;

  const normalizedQuery = normalizeText(query);

  return countries.filter(country => {
    if (normalizeText(country.name).includes(normalizedQuery)) return true;
    if (country.nativeName && normalizeText(country.nativeName).includes(normalizedQuery)) return true;
    if (normalizeText(country.code) === normalizedQuery) return true;
    return false;
  });
};

/**
 * Generate flag emoji from country code
 */
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

/**
 * Clear all caches (useful for refresh)
 */
export const clearLocationCache = (): void => {
  countriesMemCache = null;
  Object.keys(citiesMemCache).forEach(key => delete citiesMemCache[key]);
};
