import { ErrorCode } from '#lib/interfaces/index.ts';
import { AppError, authService, errorService } from '#lib/services/index.ts';
import { API_CONFIG, defaultHeaders } from './api.config';

interface RequestOptions {
	requireAuth?: boolean;
	customHeaders?: HeadersInit;
	// Enviar/recibir cookies (p. ej. refresh_token HttpOnly)
	withCredentials?: boolean;
}

class ApiPinodo {
	// Token a enviar en la petición. Por defecto requiere auth (se envía si existe)
	private resolveToken(options: RequestOptions): string | null {
		if (options.requireAuth === false) return null;

		const token = authService.getToken();
		if (!token && options.requireAuth === true) {
			// Sin token no hay sesión (se borraron las keys): se cierra para que la app redirija al login
			authService.expireSession();
			throw new AppError({
				message: 'Debes iniciar sesión para continuar.',
				code: ErrorCode.TOKEN_REQUIRED,
				status: 401
			});
		}
		return token;
	}

	// Método para construir headers con autenticación
	private buildHeaders(options: RequestOptions, token: string | null): HeadersInit {
		const headers: HeadersInit = { ...defaultHeaders };

		// Agregar headers customizados si existen
		if (options.customHeaders) {
			Object.assign(headers, options.customHeaders);
		}

		if (token) {
			(headers as Record<string, string>).Authorization = `Bearer ${token}`;
		}

		return headers;
	}

	// Ejecuta el fetch con timeout. No interpreta la respuesta
	private async send(
		endpoint: string,
		method: string,
		data: unknown,
		options: RequestOptions,
		token: string | null
	): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

		try {
			const headers = this.buildHeaders(options, token);
			const isRawBody = data instanceof FormData || data instanceof URLSearchParams;

			// Si es FormData o URLSearchParams, dejar que el navegador establezca el Content-Type
			if (isRawBody) {
				delete (headers as Record<string, string>)['Content-Type'];
			}

			return await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
				method,
				headers,
				body: isRawBody ? (data as BodyInit) : data ? JSON.stringify(data) : undefined,
				credentials: options.withCredentials ? 'include' : 'same-origin',
				signal: controller.signal
			});
		} finally {
			clearTimeout(timeoutId);
		}
	}

	// Método genérico para solicitudes. Siempre lanza AppError.
	private async request<T>(
		endpoint: string,
		method: string,
		data?: unknown,
		options: RequestOptions = {}
	): Promise<T> {
		try {
			const token = this.resolveToken(options);
			let response = await this.send(endpoint, method, data, options, token);

			// Access token vencido: se renueva (una sola vez) y se reintenta la petición
			if (response.status === 401 && token) {
				const newToken = await authService.refreshToken(token);
				response = await this.send(endpoint, method, data, options, newToken);

				// Rechazado incluso con un token recién emitido: la sesión ya no es válida
				if (response.status === 401) authService.expireSession();
			}

			// Manejar respuestas sin cuerpo: 204 (No Content) y 202 (Accepted, p. ej. forgot-password)
			if (response.status === 204 || response.status === 202) {
				return {} as T;
			}

			if (!response.ok) {
				throw await errorService.fromResponse(response);
			}

			return await response.json();
		} catch (error) {
			const appError = errorService.fromUnknown(error);
			errorService.log(appError);
			throw appError;
		}
	}

	// Métodos para diferentes tipos de solicitudes
	async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'GET', undefined, options);
	}

	async post<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'POST', data, options);
	}

	async put<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'PUT', data, options);
	}

	async patch<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'PATCH', data, options);
	}

	async delete<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'DELETE', data, options);
	}

	// Métodos específicos para endpoints que no requieren autenticación
	async getPublic<T>(endpoint: string): Promise<T> {
		return this.get<T>(endpoint, { requireAuth: false });
	}

	async postPublic<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
		return this.post<T>(endpoint, data, { ...options, requireAuth: false });
	}
}

export const apiPinodo = new ApiPinodo();
