import { IMAGEN_TIPO_DEFAULT } from '#lib/constants/index.ts';
import type {
	AddProductoColorRequest,
	CreateProductoSkuRequest,
	ProductoColor,
	ProductoDetalle,
	ProductoFormColor,
	ProductoFormImagen,
	ProductoFormSku,
	ProductoFormValues,
	ProductoPrecio,
	UpdateProductoColorRequest,
	UpdateProductoColorSkuRow,
	UpdateProductoRequest
} from '#lib/interfaces/index.ts';
import type {
	ProductoColorInput,
	ProductoColorParsed,
	ProductoDatosParsed,
	ProductoInput
} from '#lib/zod/index.ts';

/**
 * Identificador local de una fila del formulario (para `{#each}`). `crypto.randomUUID` solo existe
 * en contextos seguros (HTTPS o localhost): por HTTP en la red local se usa un aleatorio simple.
 */
export function createKey(): string {
	return typeof crypto.randomUUID === 'function'
		? crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const newKey = createKey;

/** SKU en blanco para el formulario: visible y con stock en 0 */
export function createProductoSku(): ProductoFormSku {
	return {
		key: newKey(),
		talla_id: '',
		codigo_barras: '',
		is_visible: true,
		precio: { normal: '', rebajado: '', rebaja_hasta: '' },
		stock: { cantidad: '0', minimo: '0' }
	};
}

/** Color en blanco para el formulario, sin imágenes ni SKUs */
export function createProductoColor(colorId = ''): ProductoFormColor {
	return { key: newKey(), color_id: colorId, is_visible: true, imagenes: [], skus: [] };
}

/** Formulario de alta vacío; `seccionId` preselecciona la sección */
export function createProductoFormValues(seccionId = ''): ProductoFormValues {
	return {
		seccion_id: seccionId,
		nombre: '',
		descripcion: '',
		cuidados: '',
		composicion: '',
		is_visible: true,
		categoria_ids: [],
		colores: []
	};
}

type WithColores = Pick<ProductoFormValues, 'colores'>;

const allImagenes = (values: WithColores) => values.colores.flatMap((c) => c.imagenes);

/** true mientras alguna imagen sigue subiéndose (del producto o, con `{ colores: [c] }`, de un color) */
export function hasPendingUploads(values: WithColores): boolean {
	return allImagenes(values).some((imagen) => imagen.status === 'uploading');
}

/** true si alguna imagen no se pudo subir: no puede enviarse con el producto */
export function hasFailedUploads(values: WithColores): boolean {
	return allImagenes(values).some((imagen) => imagen.status === 'error');
}

/**
 * true si el usuario ya escribió o eligió algo (para avisar antes de salir). La sección y la
 * visibilidad no cuentan: vienen con un valor por defecto.
 */
export function isProductoFormDirty(values: ProductoFormValues): boolean {
	return (
		[values.nombre, values.descripcion, values.cuidados, values.composicion].some(
			(text) => text.trim() !== ''
		) ||
		values.categoria_ids.length > 0 ||
		values.colores.length > 0
	);
}

/**
 * Datos del formulario en la forma que valida `productoSchema`: de las imágenes solo viajan `url`
 * y `tipo`, y solo las ya subidas. El schema descarta el resto de campos de interfaz.
 */
export function toProductoInput(values: ProductoFormValues): ProductoInput {
	return { ...values, colores: values.colores.map(toProductoColorInput) };
}

/** Un color del formulario en la forma que valida `productoColorSchema` (solo imágenes subidas) */
export function toProductoColorInput(color: ProductoFormColor): ProductoColorInput {
	return {
		...color,
		imagenes: color.imagenes
			.filter((imagen) => imagen.status === 'ready')
			.map(({ url, tipo }) => ({ url, tipo: tipo ?? IMAGEN_TIPO_DEFAULT }))
	};
}

// ── Edición de un producto existente ──────────────────────────────────────────────────────────

const toText = (value: number | string | null | undefined) =>
	value === null || value === undefined ? '' : String(value);

/** Datos generales de la ficha como valores del formulario (los colores se editan aparte) */
export function toProductoDatosForm(producto: ProductoDetalle): ProductoFormValues {
	return {
		seccion_id: producto.seccion_id,
		nombre: producto.nombre,
		descripcion: producto.descripcion ?? '',
		cuidados: producto.cuidados ?? '',
		composicion: producto.composicion ?? '',
		is_visible: producto.is_visible,
		categoria_ids: producto.categorias.map((categoria) => categoria.id),
		colores: []
	};
}

/** Un color guardado como estado del formulario: imágenes ya subidas y SKUs con su id */
export function toProductoColorForm(color: ProductoColor): ProductoFormColor {
	return {
		key: newKey(),
		color_id: color.color_id,
		is_visible: color.is_visible,
		imagenes: color.imagenes.map((imagen): ProductoFormImagen => ({
			key: newKey(),
			file: null,
			preview: imagen.url,
			name: imagen.url.split('/').pop() || 'Imagen',
			status: 'ready',
			url: imagen.url,
			tipo: imagen.tipo,
			error: '',
			existing: true
		})),
		skus: color.skus.map((sku): ProductoFormSku => ({
			key: newKey(),
			id: sku.id,
			talla_id: sku.talla_id,
			codigo_barras: sku.codigo_barras ?? '',
			is_visible: sku.is_visible,
			precio: {
				normal: toText(sku.precio.normal),
				rebajado: toText(sku.precio.rebajado),
				rebaja_hasta: sku.precio.rebaja_hasta ?? ''
			},
			// Solo informativo: el stock de un SKU guardado se ajusta con PATCH /skus
			stock: { cantidad: toText(sku.stock.cantidad), minimo: toText(sku.stock.minimo) }
		}))
	};
}

/**
 * Huella de un color del formulario para saber si cambió: ignora lo que es solo de la interfaz
 * (claves, miniaturas, estado de la subida). Una imagen recién elegida cuenta como cambio.
 */
export function productoColorFormSignature(color: ProductoFormColor): string {
	return JSON.stringify({
		color_id: color.color_id,
		is_visible: color.is_visible,
		imagenes: color.imagenes.map((imagen) => [imagen.url || imagen.key, imagen.tipo]),
		skus: color.skus.map((sku) => [
			sku.id,
			sku.talla_id,
			sku.codigo_barras,
			sku.is_visible,
			sku.precio,
			sku.stock
		])
	});
}

/** Huella de los datos generales; las categorías se comparan sin importar el orden */
export function productoDatosFormSignature(values: ProductoFormValues): string {
	return JSON.stringify([
		values.seccion_id,
		values.nombre,
		values.descripcion,
		values.cuidados,
		values.composicion,
		values.is_visible,
		[...values.categoria_ids].sort()
	]);
}

const samePrecio = (a: ProductoPrecio, b: ProductoPrecio) =>
	a.normal === b.normal &&
	(a.rebajado ?? null) === (b.rebajado ?? null) &&
	(a.rebaja_hasta ?? null) === (b.rebaja_hasta ?? null);

/**
 * Body del `PATCH /producto-colores/{id}` con solo lo cambiado respecto al color guardado. Las
 * imágenes se envían completas si la galería cambió (la API la reemplaza); los SKUs guardados van
 * con sus campos cambiados (el precio completo y nunca el stock) y los nuevos completos.
 * Devuelve `{}` si no hay cambios.
 */
export function buildProductoColorPatch(
	original: ProductoColor,
	parsed: ProductoColorParsed
): UpdateProductoColorRequest {
	const patch: UpdateProductoColorRequest = {};
	if (parsed.color_id !== original.color_id) patch.color_id = parsed.color_id;
	if (parsed.is_visible !== original.is_visible) patch.is_visible = parsed.is_visible;

	const gallery = (list: readonly { url: string; tipo: string }[]) =>
		JSON.stringify(list.map(({ url, tipo }) => [url, tipo]));
	if (gallery(parsed.imagenes) !== gallery(original.imagenes)) {
		patch.imagenes = parsed.imagenes.map(({ url, tipo }) => ({ url, tipo }));
	}

	const originales = new Map(original.skus.map((sku) => [sku.id, sku]));
	const skus: (UpdateProductoColorSkuRow | CreateProductoSkuRequest)[] = [];

	for (const { id, ...sku } of parsed.skus) {
		const previo = id ? originales.get(id) : undefined;
		if (!id || !previo) {
			skus.push(sku);
			continue;
		}
		const fila: UpdateProductoColorSkuRow = { id };
		if (sku.talla_id !== previo.talla_id) fila.talla_id = sku.talla_id;
		if (sku.codigo_barras !== (previo.codigo_barras ?? null)) {
			fila.codigo_barras = sku.codigo_barras;
		}
		if (sku.is_visible !== previo.is_visible) fila.is_visible = sku.is_visible;
		if (!samePrecio(sku.precio, previo.precio)) fila.precio = sku.precio;
		if (Object.keys(fila).length > 1) skus.push(fila);
	}
	if (skus.length > 0) patch.skus = skus;

	const quedan = new Set(parsed.skus.map((sku) => sku.id).filter(Boolean));
	const eliminar = original.skus.filter((sku) => !quedan.has(sku.id)).map((sku) => sku.id);
	if (eliminar.length > 0) patch.sku_ids_eliminar = eliminar;

	return patch;
}

/** Body del `POST /producto-colores/`: el color validado sin ids de SKU (todos son nuevos) */
export function toAddProductoColorRequest(
	productoId: string,
	parsed: ProductoColorParsed
): AddProductoColorRequest {
	return {
		producto_id: productoId,
		color_id: parsed.color_id,
		is_visible: parsed.is_visible,
		imagenes: parsed.imagenes.map(({ url, tipo }) => ({ url, tipo })),
		skus: parsed.skus.map((sku) => ({
			talla_id: sku.talla_id,
			codigo_barras: sku.codigo_barras,
			is_visible: sku.is_visible,
			precio: sku.precio,
			stock: sku.stock
		}))
	};
}

/**
 * Body del `PATCH /productos/{id}` con solo lo cambiado. Si cambia la sección se envían siempre las
 * categorías (si no, la API las quitaría todas). Devuelve `{}` si no hay cambios.
 */
export function buildProductoPatch(
	original: ProductoDetalle,
	parsed: ProductoDatosParsed
): UpdateProductoRequest {
	const patch: UpdateProductoRequest = {};
	if (parsed.seccion_id !== original.seccion_id) patch.seccion_id = parsed.seccion_id;
	if (parsed.nombre !== original.nombre) patch.nombre = parsed.nombre;
	if (parsed.descripcion !== (original.descripcion ?? null)) patch.descripcion = parsed.descripcion;
	if (parsed.cuidados !== (original.cuidados ?? null)) patch.cuidados = parsed.cuidados;
	if (parsed.composicion !== (original.composicion ?? null)) {
		patch.composicion = parsed.composicion;
	}
	if (parsed.is_visible !== original.is_visible) patch.is_visible = parsed.is_visible;

	const antes = original.categorias.map((categoria) => categoria.id).sort();
	const despues = [...parsed.categoria_ids].sort();
	if (antes.join() !== despues.join() || patch.seccion_id) {
		patch.categoria_ids = parsed.categoria_ids;
	}

	return patch;
}
