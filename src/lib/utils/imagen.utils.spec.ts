import { describe, expect, it } from 'vitest';
import { IMAGEN_LIMITS } from '#lib/constants/index.ts';
import { validateImagenFile } from './imagen.utils';

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

describe('validateImagenFile', () => {
	it('acepta imágenes comunes', () => {
		expect(validateImagenFile(file('a.jpg', 'image/jpeg'))).toBeNull();
		expect(validateImagenFile(file('a.webp', 'image/webp'))).toBeNull();
	});

	it('rechaza SVG por tipo o por extensión', () => {
		expect(validateImagenFile(file('a.svg', 'image/svg+xml'))).toMatch(/SVG/);
		expect(validateImagenFile(file('a.SVG', ''))).toMatch(/SVG/);
	});

	it('rechaza lo que no es una imagen', () => {
		expect(validateImagenFile(file('a.pdf', 'application/pdf'))).toMatch(/imagen/);
	});

	it('rechaza archivos de más de 5 MB y acepta los de exactamente 5 MB', () => {
		const ok = file('a.png', 'image/png', IMAGEN_LIMITS.MAX_BYTES);
		const big = file('a.png', 'image/png', IMAGEN_LIMITS.MAX_BYTES + 1);
		expect(validateImagenFile(ok)).toBeNull();
		expect(validateImagenFile(big)).toMatch(/5 MB/);
	});
});
