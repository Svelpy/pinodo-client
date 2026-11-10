import { describe, expect, it } from 'vitest';
import { validateSchema } from '#lib/utils/index.ts';
import { changePerfilPasswordSchema, perfilSchema } from './perfil.schema';

const errores = <T>(schema: Parameters<typeof validateSchema<T>>[0], values: unknown) => {
	const result = validateSchema(schema, values);
	return result.success ? {} : result.errors;
};

describe('perfilSchema', () => {
	const datos = { nombre: 'Ana', apellidos: '', email: 'ana@tienda.com', telefono: '' };

	it('acepta datos válidos; los opcionales vacíos son null', () => {
		expect(perfilSchema.parse(datos)).toEqual({
			nombre: 'Ana',
			apellidos: null,
			email: 'ana@tienda.com',
			telefono: null
		});
	});

	it('no incluye el rol', () => {
		expect(perfilSchema.parse({ ...datos, rol: 'OWNER' })).not.toHaveProperty('rol');
	});

	it('exige nombre y un correo válido', () => {
		expect(errores(perfilSchema, { ...datos, nombre: '', email: 'ana' })).toEqual({
			nombre: expect.any(String),
			email: 'Ingresa un correo electrónico válido.'
		});
	});
});

describe('changePerfilPasswordSchema', () => {
	const valores = {
		current_password: 'Actual123',
		new_password: 'Nueva123',
		confirm_password: 'Nueva123'
	};

	it('acepta un cambio válido', () => {
		expect(errores(changePerfilPasswordSchema, valores)).toEqual({});
	});

	it('exige la contraseña actual y una nueva entre 6 y 20 caracteres', () => {
		expect(
			errores(changePerfilPasswordSchema, {
				current_password: '',
				new_password: '123',
				confirm_password: '123'
			})
		).toEqual({
			current_password: 'Ingresa tu contraseña actual',
			new_password: expect.stringMatching(/al menos 6/)
		});
	});

	it('la nueva debe ser distinta de la actual', () => {
		expect(
			errores(changePerfilPasswordSchema, {
				current_password: 'Nueva123',
				new_password: 'Nueva123',
				confirm_password: 'Nueva123'
			})
		).toEqual({ new_password: 'La nueva contraseña debe ser distinta de la actual.' });
	});

	it('la confirmación debe coincidir', () => {
		expect(
			errores(changePerfilPasswordSchema, { ...valores, confirm_password: 'Otra123' })
		).toEqual({ confirm_password: 'Las contraseñas no coinciden.' });
	});
});
