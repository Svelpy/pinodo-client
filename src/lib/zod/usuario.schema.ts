import { z } from 'zod';
import { ASSIGNABLE_USER_ROLES } from '#lib/config/index.ts';

/** Límites de los campos de usuario: los mismos que valida la API (`UsuarioCreate`) */
export const USUARIO_LIMITS = {
	EMAIL_MAX: 255,
	PASSWORD_MIN: 6,
	PASSWORD_MAX: 20,
	NOMBRE_MIN: 2,
	NOMBRE_MAX: 100,
	APELLIDOS_MIN: 2,
	APELLIDOS_MAX: 150,
	TELEFONO_MIN: 6,
	TELEFONO_MAX: 30
} as const;

const requiredText = (min: number, max: number, label: string) =>
	z
		.string()
		.trim()
		.nonempty({ message: `${label} es requerido` })
		.min(min, { message: `${label} debe tener al menos ${min} caracteres.` })
		.max(max, { message: `${label} no puede exceder los ${max} caracteres.` });

// Campo opcional: vacío se envía como null; si se escribe algo debe cumplir el largo mínimo
const optionalText = (min: number, max: number, label: string) =>
	z
		.string()
		.trim()
		.refine((value) => value === '' || value.length >= min, {
			message: `${label} debe tener al menos ${min} caracteres.`
		})
		.refine((value) => value.length <= max, {
			message: `${label} no puede exceder los ${max} caracteres.`
		})
		.transform((value) => value || null);

// Sin trim: los espacios de una contraseña son intencionales
const passwordField = (requiredMessage: string) =>
	z
		.string()
		.nonempty({ message: requiredMessage })
		.min(USUARIO_LIMITS.PASSWORD_MIN, {
			message: `La contraseña debe tener al menos ${USUARIO_LIMITS.PASSWORD_MIN} caracteres.`
		})
		.max(USUARIO_LIMITS.PASSWORD_MAX, {
			message: `La contraseña no puede exceder los ${USUARIO_LIMITS.PASSWORD_MAX} caracteres.`
		});

const baseUsuarioFields = {
	email: z
		.string()
		.trim()
		.nonempty({ message: 'El correo es requerido' })
		.max(USUARIO_LIMITS.EMAIL_MAX, {
			message: `El correo no puede exceder los ${USUARIO_LIMITS.EMAIL_MAX} caracteres.`
		})
		.refine((value) => z.email().safeParse(value).success, {
			message: 'Ingresa un correo electrónico válido.'
		}),
	nombre: requiredText(USUARIO_LIMITS.NOMBRE_MIN, USUARIO_LIMITS.NOMBRE_MAX, 'El nombre'),
	apellidos: optionalText(
		USUARIO_LIMITS.APELLIDOS_MIN,
		USUARIO_LIMITS.APELLIDOS_MAX,
		'Los apellidos'
	),
	telefono: optionalText(USUARIO_LIMITS.TELEFONO_MIN, USUARIO_LIMITS.TELEFONO_MAX, 'El teléfono'),
	// El rol que se puede asignar depende del rol de quien crea: lo limita el select y lo valida la API
	rol: z.enum(ASSIGNABLE_USER_ROLES, { message: 'Selecciona un rol' })
};

export const createUsuarioSchema = z.object({
	...baseUsuarioFields,
	password: passwordField('La contraseña es requerida')
});

export const updateUsuarioSchema = z.object(baseUsuarioFields);

export const resetUsuarioPasswordSchema = z
	.object({
		new_password: passwordField('La nueva contraseña es requerida'),
		confirm_password: z.string().nonempty({ message: 'Confirma la nueva contraseña' })
	})
	.refine((value) => value.new_password === value.confirm_password, {
		message: 'Las contraseñas no coinciden.',
		path: ['confirm_password']
	});

export type CreateUsuarioInput = z.input<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.input<typeof updateUsuarioSchema>;
export type ResetUsuarioPasswordInput = z.input<typeof resetUsuarioPasswordSchema>;
