import { dev } from '$app/env';
import { ErrorCode, type AnyErrorCode, type ApiErrorResponse } from '#lib/interfaces/index.ts';

interface AppErrorOptions {
	message: string;
	code?: AnyErrorCode;
	/** Status HTTP; undefined si no hubo respuesta del servidor */
	status?: number;
	details?: Record<string, unknown>;
	cause?: unknown;
}

/** Error normalizado de la aplicación. Todo error que llega a la UI debe ser un AppError. */
export class AppError extends Error {
	readonly code: AnyErrorCode;
	readonly status?: number;
	readonly details: Record<string, unknown>;

	constructor({
		message,
		code = ErrorCode.UNKNOWN_ERROR,
		status,
		details = {},
		cause
	}: AppErrorOptions) {
		super(message, { cause });
		this.name = 'AppError';
		this.code = code;
		this.status = status;
		this.details = details;
	}

	/** true si el código del error es alguno de los indicados */
	is(...codes: AnyErrorCode[]): boolean {
		return codes.includes(this.code);
	}

	/** Errores esperados del negocio (4xx): su mensaje está pensado para el usuario */
	get isOperational(): boolean {
		return this.status !== undefined && this.status >= 400 && this.status < 500;
	}
}

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
	[ErrorCode.APP_ERROR]: 'No se pudo completar la operación.',
	[ErrorCode.VALIDATION_ERROR]: 'Revisa los datos ingresados.',
	[ErrorCode.INTERNAL_ERROR]: 'Error interno del servidor. Inténtalo más tarde.',
	[ErrorCode.AUTHENTICATION_FAILED]: 'No se pudo verificar tu identidad.',
	[ErrorCode.PERMISSION_DENIED]: 'No tienes permisos para realizar esta acción.',
	[ErrorCode.TOKEN_REQUIRED]: 'Debes iniciar sesión para continuar.',
	[ErrorCode.TOKEN_INVALID]: 'Tu sesión expiró. Inicia sesión nuevamente.',
	[ErrorCode.CSRF_INVALID]: 'Tu sesión expiró. Inicia sesión nuevamente.',
	[ErrorCode.REFRESH_FAILED]: 'Tu sesión expiró. Inicia sesión nuevamente.',
	[ErrorCode.RESOURCE_NOT_FOUND]: 'El recurso solicitado no existe.',
	[ErrorCode.CONFLICT]: 'El registro ya existe o entra en conflicto con otro.',
	[ErrorCode.NETWORK_ERROR]: 'Problema de conexión. Verifica tu internet.',
	[ErrorCode.TIMEOUT]: 'El servidor tardó demasiado en responder. Inténtalo nuevamente.',
	[ErrorCode.UNKNOWN_ERROR]: 'Ocurrió un error inesperado. Inténtalo más tarde.'
};

/** Códigos de los que nunca se muestra el mensaje crudo del servidor */
const UNSAFE_MESSAGE_CODES: AnyErrorCode[] = [
	ErrorCode.INTERNAL_ERROR,
	ErrorCode.NETWORK_ERROR,
	ErrorCode.TIMEOUT,
	ErrorCode.UNKNOWN_ERROR
];

// Respaldo cuando la respuesta no trae el formato estándar (proxy, gateway, ruta inexistente)
function codeFromStatus(status: number): ErrorCode {
	if (status >= 500) return ErrorCode.INTERNAL_ERROR;
	switch (status) {
		case 401:
			return ErrorCode.AUTHENTICATION_FAILED;
		case 403:
			return ErrorCode.PERMISSION_DENIED;
		case 404:
			return ErrorCode.RESOURCE_NOT_FOUND;
		case 409:
			return ErrorCode.CONFLICT;
		case 422:
			return ErrorCode.VALIDATION_ERROR;
		default:
			return ErrorCode.APP_ERROR;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isApiErrorResponse(body: unknown): body is ApiErrorResponse {
	return isRecord(body) && typeof body.code === 'string' && typeof body.message === 'string';
}

function isDefaultCode(code: AnyErrorCode): code is ErrorCode {
	return code in DEFAULT_MESSAGES;
}

class ErrorService {
	/** Construye un AppError a partir de una respuesta HTTP no exitosa */
	async fromResponse(response: Response): Promise<AppError> {
		const body: unknown = await response.json().catch(() => null);

		if (isApiErrorResponse(body)) {
			return new AppError({
				message: body.message,
				code: body.code,
				status: response.status,
				details: isRecord(body.details) ? body.details : {}
			});
		}

		// Formato por defecto de FastAPI ({ detail }) u otra respuesta sin el formato estándar
		const detail = isRecord(body) ? body.detail : undefined;
		const code = codeFromStatus(response.status);
		return new AppError({
			message: typeof detail === 'string' ? detail : DEFAULT_MESSAGES[code],
			code,
			status: response.status,
			details: Array.isArray(detail) ? { detail } : {}
		});
	}

	/** Normaliza cualquier valor lanzado (fetch, timeout, bug) a AppError */
	fromUnknown(error: unknown): AppError {
		if (error instanceof AppError) return error;

		if (error instanceof DOMException && error.name === 'AbortError') {
			return new AppError({
				message: DEFAULT_MESSAGES[ErrorCode.TIMEOUT],
				code: ErrorCode.TIMEOUT,
				cause: error
			});
		}

		// fetch lanza TypeError cuando no hay conexión o el servidor no responde
		if (error instanceof TypeError) {
			return new AppError({
				message: DEFAULT_MESSAGES[ErrorCode.NETWORK_ERROR],
				code: ErrorCode.NETWORK_ERROR,
				cause: error
			});
		}

		return new AppError({
			message: error instanceof Error ? error.message : String(error),
			code: ErrorCode.UNKNOWN_ERROR,
			cause: error
		});
	}

	/**
	 * Mensaje listo para mostrar al usuario.
	 * - Errores 4xx: usa el mensaje del backend (está pensado para el usuario).
	 * - Errores 5xx, de red o inesperados: mensaje genérico, nunca el detalle técnico.
	 * @param overrides mensajes propios de la pantalla para códigos puntuales
	 */
	getMessage(error: unknown, overrides: Partial<Record<AnyErrorCode, string>> = {}): string {
		const appError = this.fromUnknown(error);

		const override = overrides[appError.code];
		if (override) return override;

		const fallback = isDefaultCode(appError.code)
			? DEFAULT_MESSAGES[appError.code]
			: DEFAULT_MESSAGES[ErrorCode.APP_ERROR];

		if (appError.is(...UNSAFE_MESSAGE_CODES) || !appError.isOperational) return fallback;
		return appError.message || fallback;
	}

	/**
	 * Errores por campo que la API envía en `details` (p. ej. `{ total_compra: "..." }`), para
	 * mostrarlos debajo de cada input. Los objetos anidados se aplanan (`receptor_data.nombre` → `nombre`).
	 */
	getFieldErrors(error: unknown): Record<string, string> {
		const errors: Record<string, string> = {};
		const collect = (source: Record<string, unknown>) => {
			for (const [field, value] of Object.entries(source)) {
				if (typeof value === 'string') errors[field] ??= value;
				else if (isRecord(value)) collect(value);
			}
		};
		collect(this.fromUnknown(error).details);
		return errors;
	}

	/** Registra el error. Los errores esperados (4xx) solo se registran en desarrollo. */
	log(error: unknown): void {
		const appError = this.fromUnknown(error);
		const payload = {
			code: appError.code,
			status: appError.status,
			message: appError.message,
			details: appError.details,
			cause: appError.cause
		};

		if (!appError.isOperational) {
			// Punto único para conectar un servicio de monitoreo (Sentry, etc.)
			console.error('[AppError]', payload);
		} else if (dev) {
			console.warn('[AppError]', payload);
		}
	}
}

export const errorService = new ErrorService();
