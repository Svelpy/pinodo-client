import { z } from 'zod';

/** Límites de los campos de sección: los mismos que valida la API (nombre de 1 a 100 caracteres) */
export const SECCION_LIMITS = {
	NOMBRE_MAX: 100
} as const;

export const seccionSchema = z.object({
	nombre: z
		.string()
		.trim()
		.nonempty({ message: 'El nombre es requerido' })
		.max(SECCION_LIMITS.NOMBRE_MAX, {
			message: `El nombre no puede exceder los ${SECCION_LIMITS.NOMBRE_MAX} caracteres.`
		}),
	is_visible: z.boolean({ message: 'Selecciona la visibilidad' })
});

export type SeccionInput = z.input<typeof seccionSchema>;
