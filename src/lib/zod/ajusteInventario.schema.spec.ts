import { describe, expect, it } from 'vitest';
import { validateSchema } from '#lib/utils/index.ts';
import {
	AJUSTE_LIMITS,
	AJUSTE_MOTIVOS_MANUALES,
	ajusteStockSchema
} from './ajusteInventario.schema';

const base = {
	motivo: 'RECEPCION',
	sentido: 'entrada',
	cantidad: '',
	costo: '',
	nota: '',
	minimo: ''
};

const parse = (overrides: Record<string, string>) =>
	validateSchema(ajusteStockSchema, { ...base, ...overrides });

describe('ajusteStockSchema', () => {
	it('no ofrece INICIAL: lo registra el sistema', () => {
		expect(AJUSTE_MOTIVOS_MANUALES).not.toContain('INICIAL');
	});

	it('RECEPCION exige costo y lo envía con la cantidad, con coma decimal', () => {
		expect(parse({ cantidad: '24', costo: '12,50', nota: ' Factura 4521 ' })).toEqual({
			success: true,
			data: {
				ajuste: {
					motivo: 'RECEPCION',
					nota: 'Factura 4521',
					item: { cantidad: 24, costo_unitario: 12.5 }
				},
				minimo: null
			}
		});
		const sinCosto = parse({ cantidad: '24' });
		expect(!sinCosto.success && sinCosto.errors.costo).toMatch(/costó/);
		const costoMalo = parse({ cantidad: '24', costo: '1.234' });
		expect(costoMalo.success).toBe(false);
	});

	it('CONTEO envía cantidad_contada y admite 0', () => {
		const result = parse({ motivo: 'CONTEO', cantidad: '0' });
		expect(result.success && result.data.ajuste).toEqual({
			motivo: 'CONTEO',
			item: { cantidad_contada: 0 }
		});
	});

	it('MERMA y ROBO_PERDIDA envían una cantidad positiva mayor que 0, sin costo', () => {
		for (const motivo of ['MERMA', 'ROBO_PERDIDA']) {
			const result = parse({ motivo, cantidad: '3', costo: '9' });
			expect(result.success && result.data.ajuste?.item).toEqual({ cantidad: 3 });
			expect(parse({ motivo, cantidad: '0' }).success).toBe(false);
			expect(parse({ motivo, cantidad: '-3' }).success).toBe(false);
		}
	});

	it('CORRECCION exige nota y usa el sentido para el signo', () => {
		const sinNota = parse({ motivo: 'CORRECCION', cantidad: '2' });
		expect(!sinNota.success && sinNota.errors.nota).toMatch(/corrige/);

		const salida = parse({
			motivo: 'CORRECCION',
			sentido: 'salida',
			cantidad: '2',
			nota: 'Se cargó de más'
		});
		expect(salida.success && salida.data.ajuste).toEqual({
			motivo: 'CORRECCION',
			nota: 'Se cargó de más',
			item: { cantidad: -2 }
		});
		const entrada = parse({ motivo: 'CORRECCION', cantidad: '2', nota: 'Faltó cargar' });
		expect(entrada.success && entrada.data.ajuste?.item).toEqual({ cantidad: 2 });
	});

	it('sin cantidad no hay ajuste: solo el mínimo, si se escribió', () => {
		expect(parse({ minimo: '4' })).toEqual({ success: true, data: { ajuste: null, minimo: 4 } });
		expect(parse({ minimo: '-1' }).success).toBe(false);
		// Sin cantidad, el motivo no exige nada (ni costo ni nota)
		expect(parse({ motivo: 'CORRECCION' }).success).toBe(true);
	});

	it('valida cantidad entera y el largo de la nota', () => {
		expect(parse({ motivo: 'MERMA', cantidad: '1.5' }).success).toBe(false);
		expect(
			parse({ motivo: 'MERMA', cantidad: '1', nota: 'x'.repeat(AJUSTE_LIMITS.NOTA_MAX + 1) })
				.success
		).toBe(false);
	});
});
