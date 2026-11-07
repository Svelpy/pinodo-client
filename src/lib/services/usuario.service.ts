import { apiPinodo } from '#lib/config/index.ts';
import type {
	CreateUsuarioRequest,
	ListUsuariosParams,
	PaginatedResponse,
	ResetUsuarioPasswordRequest,
	UpdateUsuarioRequest,
	Usuario
} from '#lib/interfaces/index.ts';
import { buildPaginationQuery } from '#lib/utils/index.ts';

/**
 * Gestión de usuarios del panel (`/usuarios/`). A diferencia de `/usuarios/me` (perfilService),
 * aquí la API solo permite actuar sobre usuarios de un rol inferior al del usuario de la sesión.
 */
class UsuarioService {
	async list({ rol, ...pagination }: ListUsuariosParams = {}): Promise<PaginatedResponse<Usuario>> {
		const query = buildPaginationQuery(pagination);
		if (rol) query.set('rol', rol);
		return apiPinodo.get<PaginatedResponse<Usuario>>(`/usuarios/?${query}`, { requireAuth: true });
	}

	async create(data: CreateUsuarioRequest): Promise<Usuario> {
		return apiPinodo.post<Usuario>('/usuarios/', data, { requireAuth: true });
	}

	async update(id: string, data: UpdateUsuarioRequest): Promise<Usuario> {
		return apiPinodo.patch<Usuario>(`/usuarios/${id}`, data, { requireAuth: true });
	}

	/** Eliminación lógica: la API revoca todas las sesiones activas del usuario */
	async remove(id: string): Promise<void> {
		await apiPinodo.delete(`/usuarios/${id}`, undefined, { requireAuth: true });
	}

	/** La API revoca todas las sesiones activas del usuario afectado */
	async resetPassword(id: string, data: ResetUsuarioPasswordRequest): Promise<Usuario> {
		return apiPinodo.patch<Usuario>(`/usuarios/${id}/password`, data, { requireAuth: true });
	}
}

export const usuarioService = new UsuarioService();
