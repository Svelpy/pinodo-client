import { z } from 'zod';

/** Límites de los campos de talla: los mismos que valida la API (etiqueta de 1 a 30 caracteres) */
export const TALLA_LIMITS = {
	ETIQUETA_MAX: 30
} as const;

export const tallaSchema = z.object({
	etiqueta: z
		.string()
		.trim()
		.nonempty({ message: 'La etiqueta es requerida' })
		.max(TALLA_LIMITS.ETIQUETA_MAX, {
			message: `La etiqueta no puede exceder los ${TALLA_LIMITS.ETIQUETA_MAX} caracteres.`
		})
});

export type TallaInput = z.input<typeof tallaSchema>;
