import { z } from 'zod';
import { updateUsuarioSchema, usuarioPasswordField } from './usuario.schema';

/** Datos del propio perfil: los mismos campos y límites que un usuario, sin el rol (`UsuarioUpdateMe`) */
export const perfilSchema = updateUsuarioSchema.omit({ rol: true });

export const changePerfilPasswordSchema = z
	.object({
		// La actual solo se exige: si no coincide, la API responde AUTHENTICATION_FAILED
		current_password: z.string().nonempty({ message: 'Ingresa tu contraseña actual' }),
		new_password: usuarioPasswordField('La nueva contraseña es requerida'),
		confirm_password: z.string().nonempty({ message: 'Confirma la nueva contraseña' })
	})
	.refine((value) => value.new_password !== value.current_password, {
		message: 'La nueva contraseña debe ser distinta de la actual.',
		path: ['new_password']
	})
	.refine((value) => value.new_password === value.confirm_password, {
		message: 'Las contraseñas no coinciden.',
		path: ['confirm_password']
	});

export type PerfilInput = z.input<typeof perfilSchema>;
export type ChangePerfilPasswordInput = z.input<typeof changePerfilPasswordSchema>;
