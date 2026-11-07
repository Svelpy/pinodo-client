import { z } from 'zod';

export const signInSchema = z.object({
	username: z
		.string()
		.nonempty({ message: 'Usuario es requerido' })
		.min(6, { message: 'El usuario debe tener al menos 6 caracteres.' })
		.max(80, { message: 'El usuario no puede exceder los 80 caracteres.' }),
	password: z
		.string()
		.nonempty({ message: 'Password es requerido' })
		.min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
});
