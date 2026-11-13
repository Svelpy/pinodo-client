import { describe, expect, it } from 'vitest';
import type { ProductoFormImagen } from '#lib/interfaces/index.ts';
import {
	createProductoColor,
	createProductoFormValues,
	createProductoSku,
	hasFailedUploads,
	hasPendingUploads,
	isProductoFormDirty,
	toProductoInput
} from './producto.utils';

type Values = ReturnType<typeof createProductoFormValues>;

const imagen = (overrides: Partial<ProductoFormImagen> = {}): ProductoFormImagen => ({
	key: crypto.randomUUID(),
	file: null,
	preview: 'blob:x',
	name: 'a.jpg',
	status: 'ready',
	url: 'https://cdn.test/a.jpg',
	tipo: 'MODELO',
	error: '',
	...overrides
});

describe('creadores del formulario', () => {
	it('cada SKU y color nuevos traen una clave propia y valores por defecto', () => {
		const [a, b] = [createProductoSku(), createProductoSku()];
		expect(a.key).not.toBe(b.key);
		expect(a).toMatchObject({
			talla_id: '',
			is_visible: true,
			costo: '',
			stock: { cantidad: '0', minimo: '0' }
		});
		expect(createProductoColor('c1')).toMatchObject({ color_id: 'c1', imagenes: [], skus: [] });
		expect(createProductoFormValues('s1')).toMatchObject({ seccion_id: 's1', colores: [] });
	});
});

describe('subidas de imágenes', () => {
	it('detecta las que están subiendo o fallaron en cualquier color', () => {
		const values = createProductoFormValues();
		values.colores = [
			{ ...createProductoColor('a'), imagenes: [imagen()] },
			{ ...createProductoColor('b'), imagenes: [imagen({ status: 'uploading', url: '' })] }
		];
		expect(hasPendingUploads(values)).toBe(true);
		expect(hasFailedUploads(values)).toBe(false);

		values.colores[1].imagenes[0].status = 'error';
		expect(hasPendingUploads(values)).toBe(false);
		expect(hasFailedUploads(values)).toBe(true);
	});
});

describe('isProductoFormDirty', () => {
	it('un formulario recién abierto no tiene cambios', () => {
		expect(isProductoFormDirty(createProductoFormValues('s1'))).toBe(false);
	});

	it.each([
		['nombre', (v: Values) => (v.nombre = 'Camisa')],
		['categorías', (v: Values) => v.categoria_ids.push('c')],
		['colores', (v: Values) => v.colores.push(createProductoColor())]
	])('con %s ya hay cambios', (_name, change) => {
		const values = createProductoFormValues();
		change(values);
		expect(isProductoFormDirty(values)).toBe(true);
	});

	it('los espacios sueltos no cuentan como cambios', () => {
		const values = createProductoFormValues();
		values.nombre = '   ';
		expect(isProductoFormDirty(values)).toBe(false);
	});
});

describe('toProductoInput', () => {
	it('envía solo url y tipo de las imágenes ya subidas', () => {
		const values = createProductoFormValues();
		values.colores = [
			{
				...createProductoColor('c1'),
				imagenes: [
					imagen({ url: 'https://cdn.test/ok.jpg' }),
					imagen({ status: 'uploading', url: '' }),
					imagen({ status: 'error', url: '' })
				]
			}
		];
		expect(toProductoInput(values).colores[0].imagenes).toEqual([
			{ url: 'https://cdn.test/ok.jpg', tipo: 'MODELO' }
		]);
	});
});
