import { describe, expect, it } from 'vitest';
import type { ProductoColor, ProductoDetalle } from '#lib/interfaces/index.ts';
import { productoColorSchema, productoDatosSchema } from '#lib/zod/index.ts';
import {
	aplicarCostosActuales,
	buildProductoColorPatch,
	buildProductoPatch,
	costosActuales,
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

/**
 * Formulario del color → schema → PATCH, igual que hace el editor. `costos` simula los costos
 * cargados del kardex al abrirlo (`sku_id → costo`).
 */
function patchFor(
	edit: (form: ReturnType<typeof toProductoColorForm>) => void,
	costos?: ReadonlyMap<string, number | null>
) {
	const original = colorGuardado();
	const form = toProductoColorForm(original);
	if (costos) form.skus = aplicarCostosActuales(form.skus, costos);
	edit(form);
	const parsed = productoColorSchema.parse(toProductoColorInput(form));
	return buildProductoColorPatch(original, parsed, costosActuales(form.skus));
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

/** Precio de `skuGuardado` como lo envía el formulario: la API lo exige en cada fila con id */
const PRECIO_GUARDADO = { normal: 29.95, rebajado: 19.95, rebaja_hasta: '2026-12-31' };

describe('buildProductoColorPatch', () => {
	it('sin cambios devuelve un body vacío', () => {
		expect(patchFor(() => {})).toEqual({});
	});

	it('un SKU guardado que cambió va con su talla y precio completo, sin stock', () => {
		const patch = patchFor((form) => {
			form.skus[0].precio.rebajado = '';
			form.skus[0].stock.cantidad = '99';
		});
		expect(patch).toEqual({
			skus: [
				{
					id: SKU_1,
					talla_id: TALLA_S,
					precio: { normal: 29.95, rebajado: null, rebaja_hasta: '2026-12-31' }
				}
			]
		});
	});

	it('cambiar solo el código de barras o la visibilidad también envía talla y precio', () => {
		expect(patchFor((form) => (form.skus[0].codigo_barras = '222'))).toEqual({
			skus: [{ id: SKU_1, talla_id: TALLA_S, precio: PRECIO_GUARDADO, codigo_barras: '222' }]
		});
		expect(patchFor((form) => (form.skus[1].is_visible = false))).toEqual({
			skus: [{ id: SKU_2, talla_id: TALLA_M, precio: PRECIO_GUARDADO, is_visible: false }]
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
				costo: '4,5',
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
					costo: 4.5,
					stock: { cantidad: 5, minimo: 1 }
				}
			],
			sku_ids_eliminar: [SKU_1]
		});
	});

	it('sin costos cargados nunca envía el costo de un SKU guardado (lo pisaría a ciegas)', () => {
		expect(patchFor((form) => (form.skus[0].costo = '10'))).toEqual({});
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
			skus: [{ id: SKU_2, talla_id: TALLA_L, precio: PRECIO_GUARDADO }]
		});
	});
});

describe('costo de los SKUs guardados', () => {
	const COSTOS = new Map<string, number | null>([
		[SKU_1, 12.5],
		[SKU_2, null]
	]);

	it('aplicarCostosActuales completa el costo y no marca el formulario como modificado', () => {
		const form = toProductoColorForm(colorGuardado());
		const firma = productoColorFormSignature(form);
		form.skus = aplicarCostosActuales(form.skus, COSTOS);
		expect(form.skus[0]).toMatchObject({ costo: '12.5', costo_actual: 12.5 });
		expect(form.skus[1]).toMatchObject({ costo: '', costo_actual: null });
		expect(productoColorFormSignature(form)).toBe(firma);

		form.skus[0].costo = '13';
		expect(productoColorFormSignature(form)).not.toBe(firma);
	});

	it('solo envía el costo que cambió, con coma decimal', () => {
		expect(patchFor(() => {}, COSTOS)).toEqual({});
		expect(patchFor((form) => (form.skus[0].costo = '12,50'), COSTOS)).toEqual({});
		expect(patchFor((form) => (form.skus[0].costo = '13,75'), COSTOS)).toEqual({
			skus: [{ id: SKU_1, talla_id: TALLA_S, precio: PRECIO_GUARDADO, costo: 13.75 }]
		});
	});

	it('envía el costo de un SKU sin costo registrado y no envía un campo vaciado', () => {
		expect(patchFor((form) => (form.skus[1].costo = '8'), COSTOS)).toEqual({
			skus: [{ id: SKU_2, talla_id: TALLA_M, precio: PRECIO_GUARDADO, costo: 8 }]
		});
		expect(patchFor((form) => (form.skus[0].costo = ''), COSTOS)).toEqual({});
	});

	it('un SKU que no vino en los costos no se toca', () => {
		const soloUno = new Map([[SKU_1, 12.5]]);
		expect(patchFor((form) => (form.skus[1].costo = '8'), soloUno)).toEqual({});
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

	it('envía el costo escrito y lo omite si quedó vacío', () => {
		const form = toProductoColorForm(colorGuardado());
		form.skus[0].costo = '12.5';
		const conCosto = toAddProductoColorRequest(
			'p',
			productoColorSchema.parse(toProductoColorInput(form))
		);
		expect(conCosto.skus[0].costo).toBe(12.5);

		form.skus[0].costo = '';
		const sinCosto = toAddProductoColorRequest(
			'p',
			productoColorSchema.parse(toProductoColorInput(form))
		);
		expect(JSON.stringify(sinCosto.skus[0])).not.toContain('costo');
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
