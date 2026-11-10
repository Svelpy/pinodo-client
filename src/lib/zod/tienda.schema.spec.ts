import { describe, expect, it } from 'vitest';
import { DIAS_SEMANA } from '#lib/constants/index.ts';
import type { TiendaFormValues } from '#lib/interfaces/index.ts';
import { validateSchemaDeep } from '#lib/utils/index.ts';
import { isHttpUrl, tiendaSchema } from './tienda.schema';

const valores = (overrides: Partial<TiendaFormValues> = {}): TiendaFormValues => ({
	nombre_tienda: 'Tienda Moda',
	descripcion: '',
	email_contacto: '',
	telefono: '',
	whatsapp: '',
	direccion: '',
	map_url: '',
	ciudad: '',
	horario: DIAS_SEMANA.map((dia) => ({ dia, abierto: false, apertura: '09:00', cierre: '18:00' })),
	redes_sociales: [],
	en_mantenimiento: false,
	...overrides
});

const errores = (values: TiendaFormValues) => {
	const result = validateSchemaDeep(tiendaSchema, values);
	return result.success ? {} : result.errors;
};

describe('tiendaSchema', () => {
	it('los textos opcionales vacíos se envían como null y se recortan', () => {
		const result = tiendaSchema.parse(
			valores({ nombre_tienda: '  Tienda  ', ciudad: '  ', email_contacto: ' A@B.CO ' })
		);
		expect(result.nombre_tienda).toBe('Tienda');
		expect(result.ciudad).toBeNull();
		expect(result.descripcion).toBeNull();
		expect(result.email_contacto).toBe('a@b.co');
	});

	it('exige el nombre de la tienda', () => {
		expect(errores(valores({ nombre_tienda: '   ' }))).toHaveProperty('nombre_tienda');
	});

	it('valida teléfono y WhatsApp como la API', () => {
		expect(errores(valores({ telefono: '71234567', whatsapp: '+59171234567' }))).toEqual({});
		expect(errores(valores({ telefono: '7123 4567' }))).toHaveProperty('telefono');
		expect(errores(valores({ whatsapp: '12345' }))).toHaveProperty('whatsapp');
		expect(errores(valores({ whatsapp: '+' + '1'.repeat(20) }))).toHaveProperty('whatsapp');
	});

	it('exige una URL http(s) en el mapa', () => {
		expect(errores(valores({ map_url: 'maps.google.com' }))).toHaveProperty('map_url');
		expect(errores(valores({ map_url: 'ftp://x.com' }))).toHaveProperty('map_url');
		expect(errores(valores({ map_url: 'https://maps.google.com/?q=1' }))).toEqual({});
	});

	it('el horario envía solo los días abiertos como HH:MM-HH:MM', () => {
		const horario = valores().horario;
		horario[0] = { dia: 'lunes', abierto: true, apertura: '09:00', cierre: '20:00' };
		horario[5] = { dia: 'sábado', abierto: true, apertura: '10:00', cierre: '14:00' };
		expect(tiendaSchema.parse(valores({ horario })).horario).toEqual({
			lunes: '09:00-20:00',
			sábado: '10:00-14:00'
		});
	});

	it('el cierre debe ser posterior a la apertura; un día cerrado no se valida', () => {
		const horario = valores().horario;
		horario[1] = { dia: 'martes', abierto: true, apertura: '18:00', cierre: '09:00' };
		horario[2] = { dia: 'miércoles', abierto: false, apertura: '', cierre: '' };
		horario[3] = { dia: 'jueves', abierto: true, apertura: '', cierre: '12:00' };
		expect(errores(valores({ horario }))).toEqual({
			'horario.1.cierre': 'El cierre debe ser posterior a la apertura.',
			'horario.3.apertura': 'Indica la hora de apertura.'
		});
	});

	it('las redes se envían en minúsculas e ignoran las filas vacías', () => {
		const result = tiendaSchema.parse(
			valores({
				redes_sociales: [
					{ red: ' Instagram ', url: ' https://instagram.com/tienda ' },
					{ red: '', url: '' }
				]
			})
		);
		expect(result.redes_sociales).toEqual({ instagram: 'https://instagram.com/tienda' });
	});

	it('marca la fila con la red repetida, inválida o sin URL', () => {
		const redes_sociales = [
			{ red: 'instagram', url: 'https://instagram.com/a' },
			{ red: '', url: '' },
			{ red: 'INSTAGRAM', url: 'https://instagram.com/b' },
			{ red: 'mi red', url: 'https://x.com' },
			{ red: 'tiktok', url: 'tiktok.com/@a' },
			{ red: '', url: 'https://facebook.com' }
		];
		expect(errores(valores({ redes_sociales }))).toEqual({
			'redes_sociales.2.red': 'Esta red ya está.',
			'redes_sociales.3.red': expect.stringMatching(/letras sin tildes/),
			'redes_sociales.4.url': 'Ingresa una URL completa (https://…).',
			'redes_sociales.5.red': 'Indica la red social.'
		});
	});
});

describe('isHttpUrl', () => {
	it('acepta solo URLs absolutas http o https', () => {
		expect(isHttpUrl('https://a.com')).toBe(true);
		expect(isHttpUrl('http://a.com/x?y=1')).toBe(true);
		expect(isHttpUrl('a.com')).toBe(false);
		expect(isHttpUrl('mailto:a@b.co')).toBe(false);
		expect(isHttpUrl('')).toBe(false);
	});
});
