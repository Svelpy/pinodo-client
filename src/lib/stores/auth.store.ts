import { writable, derived, get } from 'svelte/store';
import type { LoginCredentials, CurrentUser } from '#lib/interfaces/index.ts';
import { AppError, authService } from '#lib/services/index.ts';
import { isRole } from '#lib/utils/rbac.utils.ts';
import { tiendaStore } from './tienda.store';

// Store for current user data
export const currentUserStore = writable<CurrentUser | null>(authService.getCurrentUser());

// Derived store to check authentication status
export const isAuthenticated = derived(currentUserStore, ($user) => $user !== null);

// Rol del usuario actual; null sin sesión o si el rol no es uno conocido por el frontend
export const currentRole = derived(currentUserStore, ($user) => {
	const role = $user?.rol;
	return isRole(role) ? role : null;
});

// Store for loading states
export const isLoading = writable<boolean>(false);

// true cuando ensureSession ya resolvió el usuario en esta carga de la app (desde localStorage o /usuarios/me)
let isSessionVerified = false;

// El servidor rechazó la sesión (refresh fallido): se sincroniza el store con el localStorage ya limpio
authService.onSessionExpired(() => {
	isSessionVerified = false;
	currentUserStore.set(null);
	tiendaStore.clear();
});

export const authStore = {
	/**
	 * Performs login and updates the store with user data
	 */
	login: async (credentials: LoginCredentials) => {
		isLoading.set(true);
		try {
			const loginResponse = await authService.login(credentials);
			// login() internally calls getMe() which saves to localStorage
			// Now sync the store with what was saved
			const userData = authService.getCurrentUser();
			if (userData) {
				currentUserStore.set(userData);
				isSessionVerified = true;
				// Sin await: el login no espera a la tienda; el panel reutiliza la petición si sigue en curso
				void tiendaStore.refresh();
			}
			return loginResponse;
		} finally {
			isLoading.set(false);
		}
	},

	/**
	 * Devuelve la sesión actual, o null si no hay sesión.
	 * Usa el usuario guardado en localStorage; solo consulta /usuarios/me si hay token y falta ese dato.
	 */
	ensureSession: async (): Promise<CurrentUser | null> => {
		// Sin token (logout o 401 de la API, que lo borra) no hay sesión
		if (!authService.getToken()) {
			isSessionVerified = false;
			currentUserStore.set(null);
			tiendaStore.clear();
			return null;
		}

		if (isSessionVerified) return get(currentUserStore);

		// Usuario ya guardado (login o carga anterior): se usa tal cual, sin pedir /usuarios/me.
		// Solo se consulta al servidor si falta. Si el token ya no sirve, la API responde 401 en
		// la primera petición real y apiPinodo cierra la sesión.
		const storedUser = authService.getCurrentUser();
		if (storedUser) {
			currentUserStore.set(storedUser);
			isSessionVerified = true;
			return storedUser;
		}

		try {
			const userData = await authService.getMe();
			currentUserStore.set(userData);
			isSessionVerified = true;
			return userData;
		} catch (error) {
			// Token vencido o inválido: se cierra la sesión. Otros errores (red, 5xx) no la cierran
			if (error instanceof AppError && (error.status === 401 || error.status === 403)) {
				authStore.logout();
				return null;
			}
			throw error;
		}
	},

	/**
	 * Refreshes user data from the server
	 */
	refreshUser: async () => {
		try {
			const userData = await authService.getMe();
			currentUserStore.set(userData);
		} catch (error) {
			console.error('Error refreshing user data:', error);
			// Optional: logout if me() fails?
		}
	},

	/**
	 * Directly sets the user data in the store and service
	 */
	setUser: (userData: CurrentUser) => {
		currentUserStore.set(userData);
		authService.setCurrentUser(userData);
	},

	/**
	 * Clears auth data and redirects to login
	 */
	logout: () => {
		isSessionVerified = false;
		currentUserStore.set(null);
		tiendaStore.clear();
		authService.logout();
	},

	setLoading: (loading: boolean) => {
		isLoading.set(loading);
	}
};
