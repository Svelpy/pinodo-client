import { IMAGEN_TIPO_DEFAULT } from '#lib/constants/index.ts';
import type {
	ProductoFormColor,
	ProductoFormSku,
	ProductoFormValues
} from '#lib/interfaces/index.ts';
import type { ProductoInput } from '#lib/zod/index.ts';

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

const allImagenes = (values: ProductoFormValues) => values.colores.flatMap((c) => c.imagenes);

/** true mientras alguna imagen sigue subiéndose */
export function hasPendingUploads(values: ProductoFormValues): boolean {
	return allImagenes(values).some((imagen) => imagen.status === 'uploading');
}

/** true si alguna imagen no se pudo subir: no puede enviarse con el producto */
export function hasFailedUploads(values: ProductoFormValues): boolean {
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
	return {
		...values,
		colores: values.colores.map((color) => ({
			...color,
			imagenes: color.imagenes
				.filter((imagen) => imagen.status === 'ready')
				.map(({ url, tipo }) => ({ url, tipo: tipo ?? IMAGEN_TIPO_DEFAULT }))
		}))
	};
}
