import { apiPinodo } from '#lib/config/index.ts';
import type {
	AuthTokens,
	CurrentUser,
	LoginCredentials,
	LoginResponse,
	RegisterRequest,
	RegisterResponse
} from '#lib/interfaces/index.ts';
import { ErrorCode } from '#lib/interfaces/index.ts';
import {
	ACCESS_TOKEN_KEY,
	REFRESH_LOCK_KEY,
	REFRESH_TOKEN_KEY,
	TIENDA_DATA_KEY,
	USER_DATA_KEY
} from '#lib/constants/index.ts';
import { AppError } from './error.service';

class AuthService {
	// Refresh en curso, compartido por todas las peticiones que recibieron 401 a la vez
	private refreshPromise: Promise<string> | null = null;
	private sessionExpiredListeners = new Set<() => void>();

	public static getTokens(): AuthTokens | null {
		try {
			if (typeof localStorage === 'undefined') return null;
			const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
			const csrfToken = localStorage.getItem(REFRESH_TOKEN_KEY);

			if (accessToken && csrfToken) {
				return { accessToken, csrfToken };
			}
			return null;
		} catch (error) {
			console.warn('Error accessing localStorage for tokens:', error);
			return null;
		}
	}

	public static setTokens(tokens: AuthTokens): void {
		try {
			if (typeof localStorage === 'undefined') return;
			localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
			// El refresh_token llega como cookie HttpOnly; se guarda el csrf_token que lo acompaña
			localStorage.setItem(REFRESH_TOKEN_KEY, tokens.csrfToken);
		} catch (error) {
			console.warn('Error saving tokens to localStorage:', error);
		}
	}

	getCurrentUser(): CurrentUser | null {
		try {
			if (typeof localStorage === 'undefined') return null;
			const data = localStorage.getItem(USER_DATA_KEY);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.warn('Error accessing localStorage for user data:', error);
			return null;
		}
	}

	setCurrentUser(user: CurrentUser): void {
		try {
			if (typeof localStorage === 'undefined') return;
			localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
		} catch (error) {
			console.warn('Error saving user data to localStorage:', error);
		}
	}

	public static clearAuth(): void {
		try {
			if (typeof localStorage === 'undefined') return;
			localStorage.removeItem(ACCESS_TOKEN_KEY);
			localStorage.removeItem(REFRESH_TOKEN_KEY);
			localStorage.removeItem(USER_DATA_KEY);
			localStorage.removeItem(TIENDA_DATA_KEY);
		} catch (error) {
			console.warn('Error clearing auth data:', error);
		}
	}

	public static isAuthenticated(): boolean {
		return !!this.getTokens()?.accessToken;
	}

	async login(credentials: LoginCredentials): Promise<LoginResponse> {
		try {
			// El endpoint espera application/x-www-form-urlencoded (OAuth2 password flow)
			const body = new URLSearchParams({
				grant_type: 'password',
				username: credentials.username,
				password: credentials.password
			});

			const response = await apiPinodo.postPublic<LoginResponse>('/auth/login', body, {
				withCredentials: true
			});

			AuthService.setTokens({
				accessToken: response.access_token,
				csrfToken: response.csrf_token
			});

			// Obtener la información completa del usuario inmediatamente después del login
			await this.getMe();

			return response;
		} catch (error) {
			AuthService.clearAuth();
			throw error;
		}
	}

	async getMe(): Promise<CurrentUser> {
		const currentUser = await apiPinodo.get<CurrentUser>('/usuarios/me', { requireAuth: true });
		this.setCurrentUser(currentUser);
		return currentUser;
	}

	async register(data: RegisterRequest): Promise<RegisterResponse> {
		return apiPinodo.postPublic<RegisterResponse>('/auth/register', data);
	}

	async forgotPassword(email: string): Promise<void> {
		await apiPinodo.postPublic('/auth/forgot-password', { email });
	}

	async resetPassword(token: string, password: string): Promise<void> {
		await apiPinodo.postPublic(`/auth/reset-password/${token}`, { password });
	}

	async logout(): Promise<void> {
		AuthService.clearAuth();
	}
	getToken(): string | null {
		return AuthService.getTokens()?.accessToken || null;
	}

	getCsrfToken(): string | null {
		return AuthService.getTokens()?.csrfToken || null;
	}

	/**
	 * Renueva el access token. Las llamadas simultáneas comparten una sola petición: la cookie
	 * refresh_token rota en cada refresh, así que un segundo refresh en paralelo usaría una ya invalidada.
	 * @param staleToken token con el que falló la petición; si ya cambió, otra pestaña renovó la sesión
	 */
	refreshToken(staleToken?: string | null): Promise<string> {
		this.refreshPromise ??= this.withRefreshLock(() => this.performRefresh(staleToken)).finally(
			() => {
				this.refreshPromise = null;
			}
		);
		return this.refreshPromise;
	}

	/** Cierra la sesión local porque el servidor la rechazó y avisa a los suscriptores (p. ej. el store) */
	expireSession(): void {
		AuthService.clearAuth();
		this.sessionExpiredListeners.forEach((listener) => listener());
	}

	/** Suscribe a la expiración de la sesión. Devuelve la función para desuscribirse */
	onSessionExpired(listener: () => void): () => void {
		this.sessionExpiredListeners.add(listener);
		return () => this.sessionExpiredListeners.delete(listener);
	}

	// Web Locks serializa el refresh entre pestañas, que comparten la cookie y el localStorage
	private withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
		if (typeof navigator === 'undefined' || !navigator.locks) return fn();
		return navigator.locks.request(REFRESH_LOCK_KEY, fn);
	}

	private async performRefresh(staleToken?: string | null): Promise<string> {
		// Otra pestaña ya renovó la sesión mientras se esperaba el lock: se reutiliza su token
		const currentToken = this.getToken();
		if (staleToken && currentToken && currentToken !== staleToken) return currentToken;

		const csrfToken = this.getCsrfToken();
		if (!csrfToken) {
			this.expireSession();
			throw new AppError({
				message: 'Tu sesión expiró. Inicia sesión nuevamente.',
				code: ErrorCode.REFRESH_FAILED,
				status: 401
			});
		}

		try {
			// postPublic no envía el access token, así que un 401 aquí no dispara otro refresh.
			// El refresh_token viaja en la cookie HttpOnly.
			const response = await apiPinodo.postPublic<LoginResponse>('/auth/refresh', undefined, {
				withCredentials: true,
				customHeaders: { 'X-CSRF-Token': csrfToken }
			});

			AuthService.setTokens({
				accessToken: response.access_token,
				csrfToken: response.csrf_token ?? csrfToken
			});
			return response.access_token;
		} catch (error) {
			// Solo el rechazo del servidor cierra la sesión; ante red caída o 5xx se conserva para reintentar
			if (error instanceof AppError && (error.status === 401 || error.status === 403)) {
				this.expireSession();
			}
			throw error;
		}
	}
}

export const authService = new AuthService();
