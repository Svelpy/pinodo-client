import { apiPinodo } from '#lib/config/index.ts';
import type {
	ChangePerfilPasswordRequest,
	CurrentUser,
	UpdatePerfilRequest
} from '#lib/interfaces/index.ts';

/** Perfil del usuario de la sesión: todo sobre `/usuarios/me`, sin ID en la URL */
class PerfilService {
	/** Siempre del servidor: el perfil no se lee de la sesión guardada en el navegador */
	async get(): Promise<CurrentUser> {
		return apiPinodo.get<CurrentUser>('/usuarios/me', { requireAuth: true });
	}

	async update(data: UpdatePerfilRequest): Promise<CurrentUser> {
		return apiPinodo.patch<CurrentUser>('/usuarios/me', data, { requireAuth: true });
	}

	async changePassword(data: ChangePerfilPasswordRequest): Promise<CurrentUser> {
		return apiPinodo.patch<CurrentUser>('/usuarios/me/password', data, { requireAuth: true });
	}
}

export const perfilService = new PerfilService();
