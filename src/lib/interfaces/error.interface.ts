/**
 * Códigos de error estables.
 * Los del backend son un espejo de `ErrorCode` en la API (FastAPI);
 * los de cliente se generan en el frontend cuando no hay respuesta del servidor.
 */
export enum ErrorCode {
	// Backend
	APP_ERROR = 'APP_ERROR',
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	INTERNAL_ERROR = 'INTERNAL_ERROR',
	AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
	PERMISSION_DENIED = 'PERMISSION_DENIED',
	TOKEN_REQUIRED = 'TOKEN_REQUIRED',
	TOKEN_INVALID = 'TOKEN_INVALID',
	CSRF_INVALID = 'CSRF_INVALID',
	REFRESH_FAILED = 'REFRESH_FAILED',
	RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
	CONFLICT = 'CONFLICT',

	// Cliente
	NETWORK_ERROR = 'NETWORK_ERROR',
	TIMEOUT = 'TIMEOUT',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/** Admite códigos nuevos del backend sin romper el tipado */
export type AnyErrorCode = ErrorCode | (string & {});

/** Cuerpo de error que devuelve la API */
export interface ApiErrorResponse {
	/** `fail` = error del cliente (4xx), `error` = error del servidor (5xx) */
	status: 'fail' | 'error';
	code: AnyErrorCode;
	message: string;
	details: Record<string, unknown>;
}
