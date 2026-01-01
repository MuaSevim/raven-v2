/**
 * API utility functions with proper error handling and timeout management
 */

import { API_URL } from '../config';

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT = 30000;

interface FetchOptions extends RequestInit {
    timeout?: number;
}

/**
 * Enhanced fetch with timeout and better error handling
 */
export async function fetchWithTimeout(
    url: string,
    options: FetchOptions = {}
): Promise<Response> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timeout - please check your connection');
        }

        if (error.message === 'Network request failed') {
            throw new Error(
                `Cannot connect to server at ${API_URL}. Please ensure:\n` +
                '1. The server is running (npm run start:dev)\n' +
                '2. Your device is on the same network\n' +
                '3. The IP address in config.ts is correct'
            );
        }

        throw error;
    }
}

/**
 * API helper for authenticated requests
 */
export async function apiRequest(
    endpoint: string,
    options: FetchOptions & { token?: string } = {}
): Promise<Response> {
    const { token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return fetchWithTimeout(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });
}

/**
 * Parse JSON response with error handling
 */
export async function parseJsonResponse<T = any>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If JSON parsing fails, use status text
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    return response.json();
}
