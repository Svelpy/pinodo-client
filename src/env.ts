import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

/**
 * Variables de entorno de la app (leídas desde `.env`).
 * Las marcadas como `public` se importan desde `$app/env/public`.
 */
export const variables = defineEnvVars({
	VITE_API_ENDPOINT: {
		public: true,
		static: true,
		description: 'URL base de la API de Pinodo (incluye /api/v1)',
		schema: z.url().transform((url) => url.replace(/\/+$/, ''))
	},
	PUBLIC_SITE_URL: {
		public: true,
		static: true,
		description: 'URL pública del sitio, usada para canonical y Open Graph',
		schema: z.url().transform((url) => url.replace(/\/+$/, ''))
	}
});
