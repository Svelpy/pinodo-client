import { describe, expect, it } from 'vitest';
import { RANGO_FECHA } from '#lib/constants/index.ts';
import type { FinanzasFiltros } from '#lib/interfaces/index.ts';
import { finanzasFiltrosToParams, formatPeriodo, nombreArchivoReporte } from './finanzas.utils';
import { paginarLocal } from './pagination';

const TODAY = '2026-11-13';
const FILTROS: FinanzasFiltros = { rango: RANGO_FECHA.TODO, desde: '', hasta: '' };

describe('finanzasFiltrosToParams', () => {
	it('todas las fechas no envía rango', () => {
		expect(finanzasFiltrosToParams(FILTROS, TODAY)).toEqual({});
	});

	it('un rango rápido se resuelve con la fecha de hoy', () => {
		expect(finanzasFiltrosToParams({ ...FILTROS, rango: RANGO_FECHA.MES }, TODAY)).toEqual({
			desde: '2026-11-01',
			hasta: TODAY
		});
	});

	it('personalizado usa las fechas elegidas y omite las vacías', () => {
		const filtros = { rango: RANGO_FECHA.PERSONALIZADO, desde: '2026-10-01', hasta: '' };
		expect(finanzasFiltrosToParams(filtros, TODAY)).toEqual({ desde: '2026-10-01' });
	});
});

describe('nombreArchivoReporte', () => {
	it('lleva el reporte y el rango', () => {
		expect(
			nombreArchivoReporte('VENTAS', { desde: '2026-11-01', hasta: '2026-11-13' }, TODAY)
		).toBe('reporte-ventas_2026-11-01_2026-11-13.xlsx');
	});

	it('sin fechas es desde el inicio hasta hoy', () => {
		expect(nombreArchivoReporte('RENTABILIDAD', {}, TODAY)).toBe(
			'reporte-rentabilidad_inicio_2026-11-13.xlsx'
		);
	});
});

describe('formatPeriodo', () => {
	it('muestra las dos fechas, o una si es el mismo día', () => {
		expect(formatPeriodo({ desde: '2026-10-01', hasta: '2026-11-13' })).toMatch(
			/01.+oct.+2026 – 13.+nov.+2026/
		);
		expect(formatPeriodo({ desde: TODAY, hasta: TODAY })).not.toContain('–');
	});
});

describe('paginarLocal', () => {
	const items = Array.from({ length: 45 }, (_, i) => i + 1);

	it('devuelve la página pedida y el total de páginas', () => {
		expect(paginarLocal(items, 2, 20)).toEqual({
			items: items.slice(20, 40),
			page: 2,
			totalPages: 3
		});
		expect(paginarLocal(items, 3, 20).items).toEqual([41, 42, 43, 44, 45]);
	});

	it('ajusta una página fuera de rango', () => {
		expect(paginarLocal(items, 9, 20).page).toBe(3);
		expect(paginarLocal(items, 0, 20).page).toBe(1);
	});

	it('una lista vacía tiene una página', () => {
		expect(paginarLocal([], 1, 20)).toEqual({ items: [], page: 1, totalPages: 1 });
	});
});
