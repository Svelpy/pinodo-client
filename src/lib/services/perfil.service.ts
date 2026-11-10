import { apiPinodo } from '#lib/config/index.ts';
import type {
	ChangePerfilPasswordRequest,
	CurrentUser,
	UpdatePerfilRequest
} from '#lib/interfaces/index.ts';

/**
 * Perfil del usuario de la sesión: todo sobre `/usuarios/me`, sin ID en la URL. Para leerlo se usa
 * la sesión guardada (`currentUserStore`) o `authService.getMe()`, que además la actualiza.
 */
class PerfilService {
	async update(data: UpdatePerfilRequest): Promise<CurrentUser> {
		return apiPinodo.patch<CurrentUser>('/usuarios/me', data, { requireAuth: true });
	}

	/** Revoca todas las sesiones del usuario (también la actual): hay que volver a iniciar sesión */
	async changePassword(data: ChangePerfilPasswordRequest): Promise<CurrentUser> {
		return apiPinodo.patch<CurrentUser>('/usuarios/me/password', data, { requireAuth: true });
	}
}

export const perfilService = new PerfilService();
