import { describe, expect, it } from 'vitest';
import { NO_DATA_LABEL } from '#lib/constants/index.ts';
import {
	formatDateTimeParts,
	formatInitials,
	formatMesAnio,
	formatPercent,
	formatPriceRange,
	formatSignedNumber
} from './format';

describe('formatInitials', () => {
	it('toma la inicial de las dos primeras palabras en mayúsculas', () => {
		expect(formatInitials('ana pérez lópez')).toBe('AP');
		expect(formatInitials('Brandon Gonsales Coronado')).toBe('BG');
	});

	it('con una sola palabra devuelve una inicial y ignora espacios sobrantes', () => {
		expect(formatInitials('  Tienda ')).toBe('T');
	});

	it('sin nombre devuelve el texto de respaldo', () => {
		expect(formatInitials(null)).toBe(NO_DATA_LABEL);
		expect(formatInitials('   ', { fallback: '' })).toBe('');
	});
});

describe('formatPriceRange', () => {
	it('muestra desde y hasta cuando difieren', () => {
		const text = formatPriceRange(19.95, 29.95);
		expect(text).toContain('–');
		expect(text).toContain('19,95');
		expect(text).toContain('29,95');
	});

	it('con el mismo precio en ambos extremos muestra uno solo', () => {
		expect(formatPriceRange(10, 10)).not.toContain('–');
	});

	it('si falta un extremo muestra el otro; sin ninguno, el respaldo', () => {
		expect(formatPriceRange(null, 15)).toContain('15');
		expect(formatPriceRange(null, undefined)).toBe(NO_DATA_LABEL);
		expect(formatPriceRange(null, null, 'BOB', { fallback: 'Sin precio' })).toBe('Sin precio');
	});
});

describe('formatSignedNumber', () => {
	it('antepone + a las entradas y − a las salidas', () => {
		expect(formatSignedNumber(5)).toBe('+5');
		expect(formatSignedNumber(-2)).toBe('−2');
		expect(formatSignedNumber(0)).toBe('0');
	});

	it('usa el fallback sin valor', () => {
		expect(formatSignedNumber(null)).toBe(NO_DATA_LABEL);
		expect(formatSignedNumber(undefined, { fallback: '' })).toBe('');
	});
});

describe('formatDateTimeParts', () => {
	it('separa fecha y hora en hora local', () => {
		// Sin "Z": hora local, para no depender de la zona horaria de la máquina
		const { fecha, hora } = formatDateTimeParts('2026-11-13T13:10:00');
		expect(fecha).toMatch(/13.+nov.+2026/);
		expect(hora).toMatch(/^01:10/);
		expect(hora).toMatch(/p/);
	});

	it('sin fecha o inválida usa el texto por defecto', () => {
		expect(formatDateTimeParts(null)).toEqual({ fecha: NO_DATA_LABEL, hora: '' });
		expect(formatDateTimeParts('no-es-fecha')).toEqual({ fecha: NO_DATA_LABEL, hora: '' });
	});
});

describe('formatPercent', () => {
	// Intl separa el número del signo con un espacio duro
	const plain = (text: string) => text.replace(/\s/g, ' ');

	it('convierte una proporción en porcentaje con un decimal', () => {
		expect(plain(formatPercent(0.395))).toBe('39,5 %');
		expect(plain(formatPercent(0.4867))).toBe('48,7 %');
		expect(plain(formatPercent(1))).toBe('100 %');
		expect(plain(formatPercent(0))).toBe('0 %');
		expect(plain(formatPercent(-0.12))).toMatch(/^-12 %$/);
	});

	it('las partes mínimas no se muestran como cero', () => {
		expect(plain(formatPercent(0.0004))).toBe('<0,1 %');
	});

	it('sin valor usa el texto por defecto', () => {
		expect(formatPercent(null)).toBe(NO_DATA_LABEL);
		expect(formatPercent(Number.NaN)).toBe(NO_DATA_LABEL);
	});
});

describe('formatMesAnio', () => {
	it('nombra el mes con su año', () => {
		expect(formatMesAnio(2026, 10)).toBe('octubre 2026');
		expect(formatMesAnio(2027, 1)).toBe('enero 2027');
	});

	it('un mes inválido usa el texto por defecto', () => {
		expect(formatMesAnio(2026, 13)).toBe(NO_DATA_LABEL);
	});
});
