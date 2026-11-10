import { describe, expect, it } from 'vitest';
import type { Tienda, TiendaFormValues } from '#lib/interfaces/index.ts';
import { tiendaSchema } from '#lib/zod/index.ts';
import { buildTiendaPatch, tiendaFormSignature, toTiendaForm } from './negocio.utils';

const tienda = (overrides: Partial<Tienda> = {}): Tienda => ({
	nombre_tienda: 'Tienda Moda',
	descripcion: 'Ropa',
	logo_url: 'https://cdn/logo.png',
	favicon_url: null,
	email_contacto: 'contacto@tienda.com',
	telefono: null,
	whatsapp: '+59171234567',
	direccion: null,
	map_url: null,
	ciudad: 'Santa Cruz',
	horario: { lunes: '09:00-20:00', sábado: '10:00-14:00' },
	redes_sociales: { instagram: 'https://instagram.com/tiendamoda' },
	en_mantenimiento: false,
	updated_at: '2026-10-29T15:00:00Z',
	...overrides
});

const sinImagenes = {
	logo: { file: null, eliminar: false },
	favicon: { file: null, eliminar: false }
};

function patchDe(original: Tienda, edit: (values: TiendaFormValues) => void) {
	const values = toTiendaForm(original);
	edit(values);
	return buildTiendaPatch(original, tiendaSchema.parse(values), sinImagenes);
}

describe('toTiendaForm', () => {
	it('lista los 7 días en orden; los ausentes quedan cerrados con horas por defecto', () => {
		const { horario } = toTiendaForm(tienda());
		expect(horario.map((d) => d.dia)).toEqual([
			'lunes',
			'martes',
			'miércoles',
			'jueves',
			'viernes',
			'sábado',
			'domingo'
		]);
		expect(horario[0]).toEqual({ dia: 'lunes', abierto: true, apertura: '09:00', cierre: '20:00' });
		expect(horario[1]).toEqual({
			dia: 'martes',
			abierto: false,
			apertura: '09:00',
			cierre: '18:00'
		});
	});

	it('los nulos son textos vacíos y las redes una lista', () => {
		const values = toTiendaForm(tienda({ horario: null, redes_sociales: null }));
		expect(values.telefono).toBe('');
		expect(values.redes_sociales).toEqual([]);
		expect(values.horario.every((d) => !d.abierto)).toBe(true);
	});
});

describe('tiendaFormSignature', () => {
	it('ignora espacios, horas de días cerrados y filas de redes vacías', () => {
		const values = toTiendaForm(tienda());
		const inicial = tiendaFormSignature(values);

		values.ciudad = ' Santa Cruz ';
		values.horario[1].apertura = '07:00';
		values.redes_sociales.push({ red: '', url: '' });
		expect(tiendaFormSignature(values)).toBe(inicial);

		values.horario[1].abierto = true;
		expect(tiendaFormSignature(values)).not.toBe(inicial);
	});
});

describe('buildTiendaPatch', () => {
	it('sin cambios no envía nada', () => {
		expect(patchDe(tienda(), () => {})).toEqual({});
	});

	it('envía solo los textos modificados; vaciar uno lo borra (null)', () => {
		const patch = patchDe(tienda(), (values) => {
			values.ciudad = '';
			values.telefono = '71234567';
		});
		expect(patch).toEqual({ ciudad: null, telefono: '71234567' });
	});

	it('el horario y las redes se envían completos si cambian, sin importar el orden', () => {
		const original = tienda({ horario: { sábado: '10:00-14:00', lunes: '09:00-20:00' } });
		expect(patchDe(original, () => {})).toEqual({});

		const patch = patchDe(original, (values) => {
			values.horario[5].abierto = false;
			values.redes_sociales = [];
		});
		expect(patch).toEqual({ horario: { lunes: '09:00-20:00' }, redes_sociales: {} });
	});

	it('envía el modo mantenimiento si cambia', () => {
		const patch = patchDe(tienda(), (values) => {
			values.en_mantenimiento = true;
		});
		expect(patch).toEqual({ en_mantenimiento: true });
	});

	it('un archivo nuevo reemplaza la imagen; quitar solo se envía si hay una guardada', () => {
		const file = new File(['x'], 'logo.png', { type: 'image/png' });
		const original = tienda();
		const data = tiendaSchema.parse(toTiendaForm(original));

		expect(
			buildTiendaPatch(original, data, {
				logo: { file, eliminar: true },
				favicon: { file: null, eliminar: true }
			})
		).toEqual({ logo: file });

		expect(
			buildTiendaPatch(original, data, { ...sinImagenes, logo: { file: null, eliminar: true } })
		).toEqual({ eliminar_logo: true });
	});
});
