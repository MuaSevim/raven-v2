// Location APIs for Countries, Cities, and Airports
import axios from 'axios';
import { normalizeText } from '../utils/text';

// ============================================
// Countries & Cities API (countriesnow.space)
// ============================================

const COUNTRIES_API_BASE = 'https://countriesnow.space/api/v0.1';

export interface Country {
  country: string;
  iso2: string;
  iso3: string;
}

export interface City {
  name: string;
  country: string;
}

// Get all countries
export async function getAllCountries(): Promise<Country[]> {
  try {
    const response = await axios.get(`${COUNTRIES_API_BASE}/countries/iso`);
    if (response.data.error) throw new Error(response.data.msg);
    return response.data.data.map((item: any) => ({
      country: item.name,
      iso2: item.Iso2,
      iso3: item.Iso3,
    }));
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
}

// Get cities by country
export async function getCitiesByCountry(country: string): Promise<string[]> {
  try {
    const response = await axios.post(`${COUNTRIES_API_BASE}/countries/cities`, {
      country,
    });
    if (response.data.error) throw new Error(response.data.msg);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
}

// ============================================
// Airports API (Free API alternatives)
// Using airportdb.io or similar free endpoints
// ============================================

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// Search airports by city using free API
export async function searchAirports(query: string): Promise<Airport[]> {
  try {
    // Using a free airport search endpoint
    // Alternative: https://raw.githubusercontent.com/datasets/airport-codes/master/data/airport-codes.csv
    const response = await axios.get(
      `https://raw.githubusercontent.com/mwgg/Airports/master/airports.json`
    );
    
    const airportsData = response.data;
    const results: Airport[] = [];
    const queryLower = normalizeText(query);
    
    // Search through airports
    for (const [icao, airport] of Object.entries(airportsData)) {
      const a = airport as any;
      if (
        a.iata && // Only airports with IATA codes (major airports)
        (normalizeText(a.city || '').includes(queryLower) ||
          normalizeText(a.name || '').includes(queryLower) ||
          normalizeText(a.country || '').includes(queryLower))
      ) {
        results.push({
          icao,
          iata: a.iata,
          name: a.name,
          city: a.city,
          country: a.country,
          lat: parseFloat(a.lat),
          lng: parseFloat(a.lon),
        });
      }
      
      if (results.length >= 20) break; // Limit results
    }
    
    return results;
  } catch (error) {
    console.error('Error searching airports:', error);
    return [];
  }
}

// Get airports by country code
export async function getAirportsByCountry(countryCode: string): Promise<Airport[]> {
  try {
    const response = await axios.get(
      `https://raw.githubusercontent.com/mwgg/Airports/master/airports.json`
    );
    
    const airportsData = response.data;
    const results: Airport[] = [];
    
    for (const [icao, airport] of Object.entries(airportsData)) {
      const a = airport as any;
      if (a.iata && a.country?.toLowerCase() === countryCode.toLowerCase()) {
        results.push({
          icao,
          iata: a.iata,
          name: a.name,
          city: a.city,
          country: a.country,
          lat: parseFloat(a.lat),
          lng: parseFloat(a.lon),
        });
      }
    }
    
    // Sort by city name
    return results.sort((a, b) => a.city.localeCompare(b.city));
  } catch (error) {
    console.error('Error fetching airports by country:', error);
    return [];
  }
}

// ============================================
// Geocoding API (OpenStreetMap Nominatim - Free)
// ============================================

export interface GeoLocation {
  lat: number;
  lng: number;
  displayName: string;
  address: {
    city?: string;
    country?: string;
    road?: string;
    suburb?: string;
  };
}

// Search for a location
export async function searchLocation(query: string): Promise<GeoLocation[]> {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 10,
        },
        headers: {
          'User-Agent': 'RavenDeliveryApp/1.0',
        },
      }
    );
    
    return response.data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      address: {
        city: item.address?.city || item.address?.town || item.address?.village,
        country: item.address?.country,
        road: item.address?.road,
        suburb: item.address?.suburb,
      },
    }));
  } catch (error) {
    console.error('Error searching location:', error);
    return [];
  }
}

// Reverse geocode (lat/lng to address)
export async function reverseGeocode(lat: number, lng: number): Promise<GeoLocation | null> {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'RavenDeliveryApp/1.0',
        },
      }
    );
    
    const item = response.data;
    return {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      address: {
        city: item.address?.city || item.address?.town || item.address?.village,
        country: item.address?.country,
        road: item.address?.road,
        suburb: item.address?.suburb,
      },
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

// Get city center coordinates
export async function getCityCenter(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const results = await searchLocation(`${city}, ${country}`);
    if (results.length > 0) {
      return { lat: results[0].lat, lng: results[0].lng };
    }
    return null;
  } catch (error) {
    console.error('Error getting city center:', error);
    return null;
  }
}

// ============================================
// Phone Country Codes
// ============================================

export interface PhoneCountry {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'Russia', code: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
].sort((a, b) => a.name.localeCompare(b.name));

// Get flag emoji from country code
export function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
