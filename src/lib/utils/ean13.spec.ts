import { describe, expect, it } from 'vitest';
import { ean13CheckDigit, firstFreeEan13, isEan13, nextEan13 } from './ean13';

describe('ean13', () => {
	it('calcula el dígito de control (ejemplo de la API: 2001234567893)', () => {
		expect(ean13CheckDigit('200123456789')).toBe(3);
		expect(isEan13('2001234567893')).toBe(true);
		expect(isEan13('2001234567890')).toBe(false);
		expect(isEan13('123')).toBe(false);
	});

	it('el siguiente código suma 1 y sigue siendo un EAN-13 válido', () => {
		const next = nextEan13('2001234567893');
		expect(next.slice(0, 12)).toBe('200123456790');
		expect(isEan13(next)).toBe(true);
	});

	it('salta los códigos ya usados en el formulario', () => {
		const first = '2001234567893';
		const second = nextEan13(first);
		expect(firstFreeEan13(first, new Set())).toBe(first);
		expect(firstFreeEan13(first, new Set([first, second]))).toBe(nextEan13(second));
	});
});
