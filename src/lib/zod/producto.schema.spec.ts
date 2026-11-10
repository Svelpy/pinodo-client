import { describe, expect, it } from 'vitest';
import { validateSchemaDeep } from '#lib/utils/index.ts';
import {
	PRODUCTO_LIMITS,
	productoColorSchema,
	productoDatosSchema,
	productoSchema,
	skuStockSchema,
	type ProductoInput
} from './producto.schema';

const UUID = (n: number) =>
	`${String(n).repeat(8)}-${String(n).repeat(4)}-4${String(n).repeat(3)}-8${String(n).repeat(3)}-${String(n).repeat(12)}`;

const sku = (overrides: Record<string, unknown> = {}) => ({
	talla_id: UUID(9),
	codigo_barras: '8412345678905',
	is_visible: true,
	precio: { normal: '29,95', rebajado: '19.95', rebaja_hasta: '2026-12-31' },
	stock: { cantidad: '12', minimo: '3' },
	...overrides
});

const color = (overrides: Record<string, unknown> = {}) => ({
	color_id: UUID(7),
	is_visible: true,
	imagenes: [{ url: 'https://cdn.test/a.jpg', tipo: 'MODELO' }],
	skus: [sku()],
	...overrides
});

const valid = (overrides: Record<string, unknown> = {}): ProductoInput =>
	({
		seccion_id: UUID(3),
		nombre: 'Camisa Oxford',
		descripcion: 'Camisa de corte regular',
		cuidados: '',
		composicion: '100 % algodón',
		is_visible: false,
		categoria_ids: [UUID(4)],
		colores: [color()],
		...overrides
	}) as ProductoInput;

describe('PRODUCTO_LIMITS', () => {
	it('el nombre admite hasta 200 caracteres (el mismo máximo de la búsqueda de la API)', () => {
		expect(PRODUCTO_LIMITS.NOMBRE_MAX).toBe(200);
	});
});

describe('productoSchema', () => {
	it('acepta un producto completo y convierte texto a los tipos de la API', () => {
		const result = productoSchema.parse(valid());
		expect(result.cuidados).toBeNull();
		expect(result.colores[0].skus[0]).toEqual({
			talla_id: UUID(9),
			codigo_barras: '8412345678905',
			is_visible: true,
			precio: { normal: 29.95, rebajado: 19.95, rebaja_hasta: '2026-12-31' },
			stock: { cantidad: 12, minimo: 3 }
		});
	});

	it('acepta un producto solo con los datos generales (sin categorías ni colores)', () => {
		expect(productoSchema.safeParse(valid({ categoria_ids: [], colores: [] })).success).toBe(true);
	});

	it('los textos opcionales vacíos, el código de barras y el precio rebajado vacíos van como null', () => {
		const result = productoSchema.parse(
			valid({
				descripcion: '  ',
				colores: [
					color({
						skus: [
							sku({ codigo_barras: '', precio: { normal: '10', rebajado: '', rebaja_hasta: '' } })
						]
					})
				]
			})
		);
		expect(result.descripcion).toBeNull();
		expect(result.colores[0].skus[0].codigo_barras).toBeNull();
		expect(result.colores[0].skus[0].precio).toEqual({
			normal: 10,
			rebajado: null,
			rebaja_hasta: null
		});
	});

	it('exige sección y nombre', () => {
		const result = validateSchemaDeep(productoSchema, valid({ seccion_id: '', nombre: '  ' }));
		expect(result.success).toBe(false);
		if (!result.success) expect(Object.keys(result.errors)).toEqual(['seccion_id', 'nombre']);
	});

	it('valida los precios y el stock con la ruta exacta del campo con error', () => {
		const bad = valid({
			colores: [
				color({
					skus: [
						sku({
							precio: { normal: 'abc', rebajado: '1,234', rebaja_hasta: '' },
							stock: { cantidad: '1.5', minimo: '' }
						})
					]
				})
			]
		});
		const result = validateSchemaDeep(productoSchema, bad);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(Object.keys(result.errors)).toEqual(
				expect.arrayContaining([
					'colores.0.skus.0.precio.normal',
					'colores.0.skus.0.precio.rebajado',
					'colores.0.skus.0.stock.cantidad',
					'colores.0.skus.0.stock.minimo'
				])
			);
		}
	});

	it('el precio rebajado no puede superar al normal', () => {
		const bad = valid({
			colores: [
				color({ skus: [sku({ precio: { normal: '10', rebajado: '12', rebaja_hasta: '' } })] })
			]
		});
		const result = validateSchemaDeep(productoSchema, bad);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors).toHaveProperty('colores.0.skus.0.precio.rebajado');
	});

	it('no repite el mismo color en el producto ni la misma talla en un color', () => {
		const dupColor = validateSchemaDeep(productoSchema, valid({ colores: [color(), color()] }));
		expect(dupColor.success).toBe(false);
		if (!dupColor.success) expect(dupColor.errors).toHaveProperty('colores.1.color_id');

		const dupTalla = validateSchemaDeep(
			productoSchema,
			valid({ colores: [color({ skus: [sku(), sku()] })] })
		);
		expect(dupTalla.success).toBe(false);
		if (!dupTalla.success) expect(dupTalla.errors).toHaveProperty('colores.0.skus.1.talla_id');
	});

	it('acepta los tres tipos de imagen de la API: MODELO, PRENDA y DETALLE', () => {
		const imagenes = ['MODELO', 'PRENDA', 'DETALLE'].map((tipo) => ({
			url: `https://cdn.test/${tipo}.jpg`,
			tipo
		}));
		const result = productoSchema.parse(valid({ colores: [color({ imagenes })] }));
		expect(result.colores[0].imagenes.map((imagen) => imagen.tipo)).toEqual([
			'MODELO',
			'PRENDA',
			'DETALLE'
		]);
	});

	it('rechaza imágenes sin subir, tipos desconocidos, ids que no son UUID y fechas inválidas', () => {
		const bad = valid({
			categoria_ids: ['abc'],
			colores: [
				color({
					imagenes: [{ url: '', tipo: 'OTRO' }],
					skus: [
						sku({
							talla_id: 'x',
							precio: { normal: '5', rebajado: '', rebaja_hasta: '31/12/2026' }
						})
					]
				})
			]
		});
		const result = validateSchemaDeep(productoSchema, bad);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(Object.keys(result.errors)).toEqual(
				expect.arrayContaining([
					'categoria_ids.0',
					'colores.0.imagenes.0.url',
					'colores.0.imagenes.0.tipo',
					'colores.0.skus.0.talla_id',
					'colores.0.skus.0.precio.rebaja_hasta'
				])
			);
		}
	});

	it('respeta el largo máximo del nombre', () => {
		const nombre = 'a'.repeat(PRODUCTO_LIMITS.NOMBRE_MAX);
		expect(productoSchema.safeParse(valid({ nombre })).success).toBe(true);
		expect(productoSchema.safeParse(valid({ nombre: `${nombre}a` })).success).toBe(false);
	});
});

describe('productoDatosSchema', () => {
	it('valida solo los datos generales (sin colores), como al editar', () => {
		const datos = { ...valid(), colores: undefined };
		expect(productoDatosSchema.safeParse(datos).success).toBe(true);
		expect(productoDatosSchema.parse(datos)).not.toHaveProperty('colores');
		expect(productoDatosSchema.safeParse({ ...datos, nombre: '' }).success).toBe(false);
	});
});

describe('productoColorSchema', () => {
	it('conserva el id de un SKU ya guardado', () => {
		const result = productoColorSchema.parse(color({ skus: [sku({ id: UUID(6) })] }));
		expect(result.skus[0].id).toBe(UUID(6));
	});
});

describe('skuStockSchema', () => {
	it('una entrada da un ajuste positivo y una salida uno negativo', () => {
		expect(skuStockSchema.parse({ movimiento: 'entrada', cantidad: ' 5 ', minimo: '' })).toEqual({
			ajuste: 5,
			minimo: null
		});
		expect(skuStockSchema.parse({ movimiento: 'salida', cantidad: '3', minimo: '2' })).toEqual({
			ajuste: -3,
			minimo: 2
		});
	});

	it('se puede cambiar solo el mínimo (incluso a 0)', () => {
		expect(skuStockSchema.parse({ movimiento: 'entrada', cantidad: '', minimo: '0' })).toEqual({
			ajuste: null,
			minimo: 0
		});
	});

	it('exige una cantidad o un mínimo', () => {
		const result = skuStockSchema.safeParse({ movimiento: 'entrada', cantidad: '', minimo: '' });
		expect(result.error?.issues[0].path).toEqual(['cantidad']);
	});

	it('rechaza cantidad 0, decimales, negativos y mínimos inválidos', () => {
		for (const cantidad of ['0', '1.5', '-1', 'abc']) {
			expect(
				skuStockSchema.safeParse({ movimiento: 'entrada', cantidad, minimo: '' }).success
			).toBe(false);
		}
		expect(
			skuStockSchema.safeParse({ movimiento: 'entrada', cantidad: '1', minimo: '-1' }).success
		).toBe(false);
	});
});
