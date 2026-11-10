import { z } from 'zod';
import { DIAS_SEMANA } from '#lib/constants/index.ts';

/** Límites de la configuración de la tienda: los mismos que valida la API (`ConfigUpdate`) */
export const TIENDA_LIMITS = {
	NOMBRE_MAX: 150,
	EMAIL_MAX: 255,
	TELEFONO_MIN: 6,
	TELEFONO_MAX: 20,
	DIRECCION_MAX: 255,
	MAP_URL_MAX: 500,
	CIUDAD_MAX: 100,
	RED_MAX: 30
} as const;

// Igual que la API: 6 a 20 dígitos, o "+" seguido de 6 a 19 dígitos
const TELEFONO_REGEX = /^(?:\d{6,20}|\+\d{6,19})$/;
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const RED_REGEX = /^[a-z0-9_-]{1,30}$/;

/** URL absoluta http o https (lo que acepta la API en `map_url` y en las redes sociales) */
export function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname;
	} catch {
		return false;
	}
}

// Texto opcional: vacío se envía como null
const optionalText = (max: number | null, label: string) =>
	z
		.string()
		.trim()
		.refine((value) => max === null || value.length <= max, {
			message: `${label} no puede exceder los ${max} caracteres.`
		})
		.transform((value) => value || null);

const optionalTelefono = (label: string) =>
	z
		.string()
		.trim()
		.refine((value) => value === '' || TELEFONO_REGEX.test(value), {
			message: `${label} debe tener entre ${TIENDA_LIMITS.TELEFONO_MIN} y ${TIENDA_LIMITS.TELEFONO_MAX} dígitos, sin espacios; puede empezar con +.`
		})
		.transform((value) => value || null);

const horarioDiaSchema = z
	.object({
		dia: z.enum(DIAS_SEMANA),
		abierto: z.boolean(),
		apertura: z.string(),
		cierre: z.string()
	})
	.superRefine((dia, ctx) => {
		if (!dia.abierto) return;
		const aperturaOk = HORA_REGEX.test(dia.apertura);
		const cierreOk = HORA_REGEX.test(dia.cierre);
		if (!aperturaOk) {
			ctx.addIssue({ code: 'custom', path: ['apertura'], message: 'Indica la hora de apertura.' });
		}
		if (!cierreOk) {
			ctx.addIssue({ code: 'custom', path: ['cierre'], message: 'Indica la hora de cierre.' });
		}
		// "HH:MM" se ordena igual como texto que como hora
		if (aperturaOk && cierreOk && dia.apertura >= dia.cierre) {
			ctx.addIssue({
				code: 'custom',
				path: ['cierre'],
				message: 'El cierre debe ser posterior a la apertura.'
			});
		}
	});

// Los días cerrados no se envían: la API los considera cerrados
const horarioSchema = z
	.array(horarioDiaSchema)
	.transform((dias) =>
		Object.fromEntries(
			dias.filter((dia) => dia.abierto).map((dia) => [dia.dia, `${dia.apertura}-${dia.cierre}`])
		)
	);

const redesSchema = z
	.array(z.object({ red: z.string(), url: z.string() }))
	// Una fila sin red ni URL se ignora (p. ej. la que se añadió y no se llenó)
	.transform((redes) =>
		redes
			.map((item) => ({ red: item.red.trim().toLowerCase(), url: item.url.trim() }))
			.map((item, index) => ({ ...item, index }))
			.filter((item) => item.red !== '' || item.url !== '')
	)
	.superRefine((redes, ctx) => {
		const vistas = new Set<string>();
		for (const { red, url, index } of redes) {
			if (red === '') {
				ctx.addIssue({ code: 'custom', path: [index, 'red'], message: 'Indica la red social.' });
			} else if (!RED_REGEX.test(red)) {
				ctx.addIssue({
					code: 'custom',
					path: [index, 'red'],
					message: `Usa letras sin tildes, números, «_» o «-» (máximo ${TIENDA_LIMITS.RED_MAX}).`
				});
			} else if (vistas.has(red)) {
				ctx.addIssue({ code: 'custom', path: [index, 'red'], message: 'Esta red ya está.' });
			}
			vistas.add(red);

			if (!isHttpUrl(url)) {
				ctx.addIssue({
					code: 'custom',
					path: [index, 'url'],
					message: 'Ingresa una URL completa (https://…).'
				});
			}
		}
	})
	.transform((redes) => Object.fromEntries(redes.map(({ red, url }) => [red, url])));

export const tiendaSchema = z.object({
	nombre_tienda: z
		.string()
		.trim()
		.nonempty({ message: 'El nombre de la tienda es requerido' })
		.max(TIENDA_LIMITS.NOMBRE_MAX, {
			message: `El nombre no puede exceder los ${TIENDA_LIMITS.NOMBRE_MAX} caracteres.`
		}),
	descripcion: optionalText(null, 'La descripción'),
	email_contacto: z
		.string()
		.trim()
		.max(TIENDA_LIMITS.EMAIL_MAX, {
			message: `El correo no puede exceder los ${TIENDA_LIMITS.EMAIL_MAX} caracteres.`
		})
		.refine((value) => value === '' || z.email().safeParse(value).success, {
			message: 'Ingresa un correo electrónico válido.'
		})
		.transform((value) => value.toLowerCase() || null),
	telefono: optionalTelefono('El teléfono'),
	whatsapp: optionalTelefono('El WhatsApp'),
	direccion: optionalText(TIENDA_LIMITS.DIRECCION_MAX, 'La dirección'),
	map_url: optionalText(TIENDA_LIMITS.MAP_URL_MAX, 'El enlace del mapa').refine(
		(value) => value === null || isHttpUrl(value),
		{ message: 'Ingresa una URL completa (https://…).' }
	),
	ciudad: optionalText(TIENDA_LIMITS.CIUDAD_MAX, 'La ciudad'),
	horario: horarioSchema,
	redes_sociales: redesSchema,
	en_mantenimiento: z.boolean()
});

export type TiendaFormData = z.output<typeof tiendaSchema>;
