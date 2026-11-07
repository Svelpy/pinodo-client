import { describe, expect, it } from 'vitest';
import {
	createUsuarioSchema,
	resetUsuarioPasswordSchema,
	updateUsuarioSchema,
	USUARIO_LIMITS
} from './usuario.schema';

const valid = {
	email: 'ana@tienda.com',
	password: 'Clave123',
	nombre: 'Ana',
	apellidos: 'Pérez López',
	telefono: '71234567',
	rol: 'ADMIN'
};

const errorsOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
	result.error?.issues.map((issue) => String(issue.path[0])) ?? [];

describe('createUsuarioSchema', () => {
	it('acepta un usuario válido', () => {
		expect(createUsuarioSchema.safeParse(valid).success).toBe(true);
	});

	it('apellidos y teléfono vacíos se envían como null', () => {
		const result = createUsuarioSchema.parse({ ...valid, apellidos: '  ', telefono: '' });
		expect(result.apellidos).toBeNull();
		expect(result.telefono).toBeNull();
	});

	it('recorta los espacios de los textos pero no de la contraseña', () => {
		const result = createUsuarioSchema.parse({
			...valid,
			nombre: '  Ana ',
			email: ' ana@tienda.com ',
			password: ' Clave1 '
		});
		expect(result.nombre).toBe('Ana');
		expect(result.email).toBe('ana@tienda.com');
		expect(result.password).toBe(' Clave1 ');
	});

	it('exige email válido y nombre de al menos 2 caracteres', () => {
		const result = createUsuarioSchema.safeParse({ ...valid, email: 'no-es-email', nombre: 'A' });
		expect(errorsOf(result)).toEqual(expect.arrayContaining(['email', 'nombre']));
	});

	it('respeta el largo de la contraseña (6 a 20)', () => {
		expect(createUsuarioSchema.safeParse({ ...valid, password: '12345' }).success).toBe(false);
		expect(createUsuarioSchema.safeParse({ ...valid, password: '123456' }).success).toBe(true);
		expect(
			createUsuarioSchema.safeParse({
				...valid,
				password: 'a'.repeat(USUARIO_LIMITS.PASSWORD_MAX + 1)
			}).success
		).toBe(false);
	});

	it('si se escribe teléfono o apellidos, cumplen el largo mínimo', () => {
		const result = createUsuarioSchema.safeParse({ ...valid, apellidos: 'P', telefono: '123' });
		expect(errorsOf(result)).toEqual(expect.arrayContaining(['apellidos', 'telefono']));
	});

	it('rechaza el rol vacío y SUPERADMIN (no se asigna desde el panel)', () => {
		expect(createUsuarioSchema.safeParse({ ...valid, rol: '' }).success).toBe(false);
		expect(createUsuarioSchema.safeParse({ ...valid, rol: 'SUPERADMIN' }).success).toBe(false);
		expect(createUsuarioSchema.safeParse({ ...valid, rol: 'CAJERO' }).success).toBe(true);
	});
});

describe('updateUsuarioSchema', () => {
	it('no pide contraseña', () => {
		expect(updateUsuarioSchema.safeParse({ ...valid, password: undefined }).success).toBe(true);
	});
});

describe('resetUsuarioPasswordSchema', () => {
	it('exige que la confirmación coincida', () => {
		const result = resetUsuarioPasswordSchema.safeParse({
			new_password: 'NuevaClave1',
			confirm_password: 'Otra1234'
		});
		expect(errorsOf(result)).toEqual(['confirm_password']);
	});

	it('acepta contraseñas iguales dentro del largo permitido', () => {
		expect(
			resetUsuarioPasswordSchema.safeParse({
				new_password: 'NuevaClave1',
				confirm_password: 'NuevaClave1'
			}).success
		).toBe(true);
	});
});
