import { describe, expect, it } from 'vitest';
import { RANGO_FECHA } from '#lib/constants/index.ts';
import type { AjusteFiltros, CostoSku, KardexFiltros } from '#lib/interfaces/index.ts';
import {
	admiteMotivo,
	ajusteFiltrosToParams,
	esUuid,
	formatOrigen,
	kardexFiltrosToParams,
	skuNombreDesdeCosto,
	varianteSku
} from './kardex.utils';

const FILTROS: KardexFiltros = {
	rango: RANGO_FECHA.TODO,
	desde: '',
	hasta: '',
	tipo: null,
	motivo: null,
	user_id: null,
	sku_id: null
};

describe('kardexFiltrosToParams', () => {
	it('sin filtros no envía nada', () => {
		expect(kardexFiltrosToParams(FILTROS, '2026-11-12')).toEqual({
			tipo: undefined,
			motivo: undefined,
			user_id: undefined,
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

	it('envía el tipo, el motivo, el responsable y el SKU elegidos', () => {
		const params = kardexFiltrosToParams(
			{ ...FILTROS, tipo: 'AJUSTE', motivo: 'MERMA', user_id: 'u1', sku_id: 's1' },
			'2026-11-12'
		);
		expect(params).toMatchObject({
			tipo: 'AJUSTE',
			motivo: 'MERMA',
			user_id: 'u1',
			sku_id: 's1'
		});
	});

	it('ignora el motivo con un tipo que no es ajuste', () => {
		const params = kardexFiltrosToParams(
			{ ...FILTROS, tipo: 'VENTA', motivo: 'MERMA' },
			'2026-11-12'
		);
		expect(params.motivo).toBeUndefined();
	});
});

describe('ajusteFiltrosToParams', () => {
	const AJUSTES: AjusteFiltros = {
		rango: RANGO_FECHA.TODO,
		desde: '',
		hasta: '',
		motivo: null,
		created_by: null
	};

	it('sin filtros no envía nada', () => {
		expect(ajusteFiltrosToParams(AJUSTES, '2026-11-12')).toEqual({
			motivo: undefined,
			created_by: undefined
		});
	});

	it('envía el rango, el motivo y quién lo registró', () => {
		const params = ajusteFiltrosToParams(
			{ ...AJUSTES, rango: RANGO_FECHA.HOY, motivo: 'CONTEO', created_by: 'u1' },
			'2026-11-12'
		);
		expect(params).toEqual({
			desde: '2026-11-12',
			hasta: '2026-11-12',
			motivo: 'CONTEO',
			created_by: 'u1'
		});
	});
});

describe('admiteMotivo', () => {
	it('solo con todos los tipos o con ajustes', () => {
		expect(admiteMotivo(null)).toBe(true);
		expect(admiteMotivo('AJUSTE')).toBe(true);
		expect(admiteMotivo('VENTA')).toBe(false);
		expect(admiteMotivo('ANULACION')).toBe(false);
	});
});

describe('formatOrigen', () => {
	it('nombra el documento de origen', () => {
		expect(formatOrigen({ tipo: 'AJUSTE', numero: 12 })).toBe('Ajuste #12');
		expect(formatOrigen({ tipo: 'VENTA', numero: 9 })).toBe('Venta #000009');
	});
});

describe('skuNombreDesdeCosto y varianteSku', () => {
	it('arma el nombre del SKU', () => {
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
