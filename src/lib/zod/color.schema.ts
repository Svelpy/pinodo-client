import { z } from 'zod';

/** Límites de los campos de color: los mismos que valida la API (nombre de 1 a 60 caracteres) */
export const COLOR_LIMITS = {
	NOMBRE_MAX: 60,
	/** Código hexadecimal de exactamente 7 caracteres: "#" + 6 dígitos */
	HEX_LENGTH: 7
} as const;

const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i;

/** Deja el código como lo espera la API: sin espacios, con almohadilla y en mayúsculas */
export function normalizeHexColor(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '';
	return (trimmed.startsWith('#') ? trimmed : `#${trimmed}`).toUpperCase();
}

/** true si el valor (ya normalizado o no) es un color de 6 dígitos hexadecimales */
export function isHexColor(value: string): boolean {
	return HEX_COLOR_REGEX.test(normalizeHexColor(value));
}

export const colorSchema = z.object({
	nombre: z
		.string()
		.trim()
		.nonempty({ message: 'El nombre es requerido' })
		.max(COLOR_LIMITS.NOMBRE_MAX, {
			message: `El nombre no puede exceder los ${COLOR_LIMITS.NOMBRE_MAX} caracteres.`
		}),
	codigo_hex: z
		.string()
		.trim()
		.nonempty({ message: 'El código de color es requerido' })
		.refine(isHexColor, { message: 'Ingresa un color hexadecimal válido, p. ej. #1E3A8A.' })
		.transform(normalizeHexColor)
});

export type ColorInput = z.input<typeof colorSchema>;
