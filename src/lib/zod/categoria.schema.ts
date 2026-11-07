import { z } from 'zod';

/** Límites de los campos de categoría: los mismos que valida la API (nombre de 1 a 100 caracteres) */
export const CATEGORIA_LIMITS = {
	NOMBRE_MAX: 100
} as const;

const isUuid = (value: string) => z.uuid().safeParse(value).success;

export const categoriaSchema = z.object({
	nombre: z
		.string()
		.trim()
		.nonempty({ message: 'El nombre es requerido' })
		.max(CATEGORIA_LIMITS.NOMBRE_MAX, {
			message: `El nombre no puede exceder los ${CATEGORIA_LIMITS.NOMBRE_MAX} caracteres.`
		}),
	seccion_id: z
		.string()
		.nonempty({ message: 'Selecciona una sección' })
		.refine(isUuid, { message: 'La sección seleccionada no es válida.' }),
	// Vacío = categoría raíz, se envía como null; si se indica debe ser un UUID
	parent_id: z
		.string()
		.refine((value) => value === '' || isUuid(value), {
			message: 'La categoría padre seleccionada no es válida.'
		})
		.transform((value) => value || null),
	is_visible: z.boolean({ message: 'Selecciona la visibilidad' })
});

export type CategoriaInput = z.input<typeof categoriaSchema>;
