import { VITE_API_ENDPOINT } from '$app/env/public';

export const defaultHeaders: HeadersInit = {
	'Content-Type': 'application/json'
};

export const API_CONFIG = {
	BASE_URL: VITE_API_ENDPOINT,
	TIMEOUT: 30000,
	MAX_RETRIES: 3
} as const;
