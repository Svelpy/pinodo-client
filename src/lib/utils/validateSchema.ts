import type { ZodType, ZodError } from 'zod';

export type ValidationResult<T> =
	{ success: true; data: T } | { success: false; errors: Record<string, string> };

export function validateSchema<T>(schema: ZodType<T>, data: unknown): ValidationResult<T> {
	const result = schema.safeParse(data);

	if (result.success) {
		return {
			success: true,
			data: result.data
		};
	}
	const errors = formatZodErrors(result.error);

	return {
		success: false,
		errors
	};
}

/**
 * Igual que `validateSchema`, pero con la ruta completa de cada campo como clave
 * (`colores.0.skus.1.precio.normal`), para mostrar los errores de formularios con listas anidadas.
 * Un error en un objeto o lista completa (ruta vacía) se guarda bajo la clave `''`.
 */
export function validateSchemaDeep<T>(schema: ZodType<T>, data: unknown): ValidationResult<T> {
	const result = schema.safeParse(data);
	if (result.success) return { success: true, data: result.data };

	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const key = issue.path.map(String).join('.');
		if (!(key in errors)) errors[key] = issue.message;
	}
	return { success: false, errors };
}

function formatZodErrors(error: ZodError): Record<string, string> {
	const formatted: Record<string, string> = {};

	for (const issue of error.issues) {
		const field = issue.path[0];
		if (field && !((field as string) in formatted)) {
			formatted[field as string] = issue.message;
		}
	}

	return formatted;
}
