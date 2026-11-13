import { describe, expect, it } from 'vitest';
import { RANGO_FECHA } from '#lib/constants/index.ts';
import type { CostoSku, KardexFiltros } from '#lib/interfaces/index.ts';
import {
	esUuid,
	kardexFiltrosToParams,
	skuNombreDesdeCosto,
	valorMovimiento,
	varianteSku
} from './kardex.utils';

const FILTROS: KardexFiltros = {
	rango: RANGO_FECHA.TODO,
	desde: '',
	hasta: '',
	tipo: null,
	created_by: null,
	sku_id: null
};

describe('kardexFiltrosToParams', () => {
	it('sin filtros no envía nada', () => {
		expect(kardexFiltrosToParams(FILTROS, '2026-11-12')).toEqual({
			tipo: undefined,
			created_by: undefined,
			sku_id: undefined
		});
	});

	it('convierte el rango rápido en fechas de la tienda', () => {
		const params = kardexFiltrosToParams(
			{ ...FILTROS, rango: RANGO_FECHA.SIETE_DIAS },
			'2026-11-12'
		);
		expect(params).toMatchObject({ desde: '2026-11-06', hasta: '2026-11-12' });
	});

	it('el rango personalizado usa solo las fechas escritas', () => {
		const params = kardexFiltrosToParams(
			{ ...FILTROS, rango: RANGO_FECHA.PERSONALIZADO, desde: '2026-11-01', hasta: '' },
			'2026-11-12'
		);
		expect(params).toMatchObject({ desde: '2026-11-01', hasta: undefined });
	});

	it('envía el tipo, el usuario y el SKU elegidos', () => {
		const params = kardexFiltrosToParams(
			{ ...FILTROS, tipo: 'AJUSTE', created_by: 'u1', sku_id: 's1' },
			'2026-11-12'
		);
		expect(params).toMatchObject({ tipo: 'AJUSTE', created_by: 'u1', sku_id: 's1' });
	});
});

describe('valorMovimiento', () => {
	it('multiplica las unidades movidas (sin signo) por el costo unitario', () => {
		expect(valorMovimiento({ cantidad: -2, costo_unitario: 12.5 })).toBe(25);
		expect(valorMovimiento({ cantidad: 3, costo_unitario: 0.1 })).toBe(0.3);
	});

	it('es null sin costo', () => {
		expect(valorMovimiento({ cantidad: 5, costo_unitario: null })).toBeNull();
	});
});

describe('skuNombreDesdeCosto y varianteSku', () => {
	it('arma el nombre del SKU sin color en hex', () => {
		const costo: CostoSku = {
			sku_id: 's1',
			producto_id: 'p1',
			producto_nombre: 'Camisa Oxford',
			color_nombre: 'Azul marino',
			talla_etiqueta: 'M',
			codigo_barras: '8412345678905',
			cantidad: 12,
			costo: 12.5,
			valor: 150
		};
		const sku = skuNombreDesdeCosto(costo);
		expect(sku).toEqual({
			producto_id: 'p1',
			producto_nombre: 'Camisa Oxford',
			color_nombre: 'Azul marino',
			color_codigo_hex: null,
			talla_etiqueta: 'M',
			codigo_barras: '8412345678905'
		});
		expect(varianteSku(sku)).toBe('Azul marino · M');
	});
});

describe('esUuid', () => {
	it('acepta un UUID y rechaza lo demás', () => {
		expect(esUuid('11111111-1111-4111-8111-111111111111')).toBe(true);
		expect(esUuid('abc')).toBe(false);
		expect(esUuid('')).toBe(false);
		expect(esUuid(null)).toBe(false);
	});
});
