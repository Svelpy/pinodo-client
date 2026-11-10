import { describe, expect, it } from 'vitest';
import type { ProductoColor, ProductoDetalle } from '#lib/interfaces/index.ts';
import { productoColorSchema, productoDatosSchema } from '#lib/zod/index.ts';
import {
	buildProductoColorPatch,
	buildProductoPatch,
	productoColorFormSignature,
	productoDatosFormSignature,
	toAddProductoColorRequest,
	toProductoColorForm,
	toProductoColorInput,
	toProductoDatosForm
} from './producto.utils';

// UUIDs válidos para que pasen las validaciones del schema
const U = (n: number) => {
	const d = String(n);
	return `${d.repeat(8)}-${d.repeat(4)}-4${d.repeat(3)}-8${d.repeat(3)}-${d.repeat(12)}`;
};
const [COLOR_A, COLOR_B, TALLA_S, TALLA_M, TALLA_L, SKU_1, SKU_2] = [1, 2, 3, 4, 5, 6, 7].map(U);

const skuGuardado = (id: string, talla_id: string, overrides = {}) => ({
	id,
	producto_color_id: 'pc',
	talla_id,
	talla: {
		id: talla_id,
		etiqueta: talla_id === TALLA_S ? 'S' : 'M',
		created_at: '',
		updated_at: ''
	},
	codigo_barras: '111',
	is_visible: true,
	precio: { normal: 29.95, rebajado: 19.95, rebaja_hasta: '2026-12-31' },
	precio_vigente: 19.95,
	stock: { cantidad: 12, minimo: 3, actualizado: '' },
	created_at: '',
	updated_at: '',
	...overrides
});

const colorGuardado = (): ProductoColor => ({
	id: 'pc',
	producto_id: 'p',
	color_id: COLOR_A,
	color: {
		id: COLOR_A,
		nombre: 'Azul',
		slug: 'azul',
		codigo_hex: '#1E3A8A',
		created_at: '',
		updated_at: ''
	},
	is_visible: true,
	imagenes: [
		{
			id: 'i1',
			producto_color_id: 'pc',
			tipo: 'MODELO',
			url: 'https://cdn.test/1.jpg',
			created_at: '',
			updated_at: ''
		},
		{
			id: 'i2',
			producto_color_id: 'pc',
			tipo: 'PRENDA',
			url: 'https://cdn.test/2.jpg',
			created_at: '',
			updated_at: ''
		}
	],
	skus: [skuGuardado(SKU_1, TALLA_S), skuGuardado(SKU_2, TALLA_M)],
	created_at: '',
	updated_at: ''
});

/** Formulario del color → schema → PATCH, igual que hace el editor */
function patchFor(edit: (form: ReturnType<typeof toProductoColorForm>) => void) {
	const original = colorGuardado();
	const form = toProductoColorForm(original);
	edit(form);
	const parsed = productoColorSchema.parse(toProductoColorInput(form));
	return buildProductoColorPatch(original, parsed);
}

describe('toProductoColorForm', () => {
	it('carga imágenes como ya subidas y SKUs con su id y valores en texto', () => {
		const form = toProductoColorForm(colorGuardado());
		expect(form.imagenes[0]).toMatchObject({
			status: 'ready',
			existing: true,
			url: 'https://cdn.test/1.jpg',
			preview: 'https://cdn.test/1.jpg',
			tipo: 'MODELO'
		});
		expect(form.skus[0]).toMatchObject({
			id: SKU_1,
			codigo_barras: '111',
			precio: { normal: '29.95', rebajado: '19.95', rebaja_hasta: '2026-12-31' },
			stock: { cantidad: '12', minimo: '3' }
		});
	});
});

describe('buildProductoColorPatch', () => {
	it('sin cambios devuelve un body vacío', () => {
		expect(patchFor(() => {})).toEqual({});
	});

	it('envía solo los campos cambiados de un SKU guardado, con el precio completo y sin stock', () => {
		const patch = patchFor((form) => {
			form.skus[0].precio.rebajado = '';
			form.skus[0].stock.cantidad = '99';
		});
		expect(patch).toEqual({
			skus: [{ id: SKU_1, precio: { normal: 29.95, rebajado: null, rebaja_hasta: '2026-12-31' } }]
		});
	});

	it('reenvía la galería completa si se quita, reordena o cambia el tipo de una imagen', () => {
		expect(patchFor((form) => form.imagenes.reverse()).imagenes).toEqual([
			{ url: 'https://cdn.test/2.jpg', tipo: 'PRENDA' },
			{ url: 'https://cdn.test/1.jpg', tipo: 'MODELO' }
		]);
		expect(patchFor((form) => form.imagenes.splice(0, 2)).imagenes).toEqual([]);
		expect(patchFor((form) => (form.imagenes[0].tipo = 'DETALLE')).imagenes?.[0].tipo).toBe(
			'DETALLE'
		);
	});

	it('un SKU quitado va en sku_ids_eliminar y uno nuevo con la misma talla se crea con stock', () => {
		const patch = patchFor((form) => {
			form.skus.splice(0, 1);
			form.skus.push({
				key: 'nuevo',
				talla_id: TALLA_S,
				codigo_barras: '',
				is_visible: true,
				precio: { normal: '10', rebajado: '', rebaja_hasta: '' },
				stock: { cantidad: '5', minimo: '1' }
			});
		});
		expect(patch).toEqual({
			skus: [
				{
					talla_id: TALLA_S,
					codigo_barras: null,
					is_visible: true,
					precio: { normal: 10, rebajado: null, rebaja_hasta: null },
					stock: { cantidad: 5, minimo: 1 }
				}
			],
			sku_ids_eliminar: [SKU_1]
		});
	});

	it('cambia la etiqueta del color y su visibilidad', () => {
		const patch = patchFor((form) => {
			form.color_id = COLOR_B;
			form.is_visible = false;
		});
		expect(patch).toEqual({ color_id: COLOR_B, is_visible: false });
	});

	it('una talla cambiada en un SKU guardado se envía en su fila', () => {
		expect(patchFor((form) => (form.skus[1].talla_id = TALLA_L))).toEqual({
			skus: [{ id: SKU_2, talla_id: TALLA_L }]
		});
	});
});

describe('toAddProductoColorRequest', () => {
	it('arma el body de un color nuevo, sin ids de SKU', () => {
		const form = toProductoColorForm(colorGuardado());
		const parsed = productoColorSchema.parse(toProductoColorInput(form));
		const body = toAddProductoColorRequest('p', parsed);
		expect(body.producto_id).toBe('p');
		expect(body.skus.every((sku) => !('id' in sku))).toBe(true);
		expect(body.skus[0].stock).toEqual({ cantidad: 12, minimo: 3 });
	});
});

describe('productoColorFormSignature', () => {
	it('no cambia por lo que es solo de interfaz y sí por los datos', () => {
		const form = toProductoColorForm(colorGuardado());
		const base = productoColorFormSignature(form);
		form.imagenes[0].preview = 'blob:otra';
		form.skus[0].key = 'otra-clave';
		expect(productoColorFormSignature(form)).toBe(base);
		form.skus[0].precio.normal = '30';
		expect(productoColorFormSignature(form)).not.toBe(base);
	});
});

const productoGuardado = (): ProductoDetalle =>
	({
		id: 'p',
		seccion_id: U(8),
		nombre: 'Camisa',
		descripcion: null,
		cuidados: 'Lavar',
		composicion: null,
		is_visible: true,
		categorias: [{ id: U(9) }, { id: U(1) }],
		colores: []
	}) as unknown as ProductoDetalle;

const datosPatch = (edit: (values: ReturnType<typeof toProductoDatosForm>) => void) => {
	const original = productoGuardado();
	const values = toProductoDatosForm(original);
	edit(values);
	return buildProductoPatch(original, productoDatosSchema.parse(values));
};

describe('buildProductoPatch', () => {
	it('sin cambios (aunque las categorías estén en otro orden) devuelve un body vacío', () => {
		expect(datosPatch((values) => values.categoria_ids.reverse())).toEqual({});
	});

	it('envía los textos cambiados y null al vaciarlos', () => {
		expect(
			datosPatch((values) => {
				values.nombre = 'Camisa slim';
				values.cuidados = '  ';
			})
		).toEqual({ nombre: 'Camisa slim', cuidados: null });
	});

	it('al cambiar de sección envía siempre las categorías, aunque sea []', () => {
		expect(
			datosPatch((values) => {
				values.seccion_id = U(2);
				values.categoria_ids = [];
			})
		).toEqual({ seccion_id: U(2), categoria_ids: [] });
	});

	it('las categorías cambiadas reemplazan a las anteriores', () => {
		expect(datosPatch((values) => (values.categoria_ids = [U(9)]))).toEqual({
			categoria_ids: [U(9)]
		});
	});
});

describe('productoDatosFormSignature', () => {
	it('ignora el orden de las categorías', () => {
		const values = toProductoDatosForm(productoGuardado());
		const base = productoDatosFormSignature(values);
		values.categoria_ids.reverse();
		expect(productoDatosFormSignature(values)).toBe(base);
	});
});
