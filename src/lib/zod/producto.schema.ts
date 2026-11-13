import { z } from 'zod';
import { IMAGEN_TIPO } from '#lib/constants/index.ts';

/**
 * Límites de los campos de producto. Provisionales: la API solo documenta que `nombre` admite
 * búsquedas de hasta 200 caracteres; confirmar el resto contra `ProductoCreate` y actualizar aquí.
 */
export const PRODUCTO_LIMITS = {
	NOMBRE_MAX: 200,
	DESCRIPCION_MAX: 2000,
	CUIDADOS_MAX: 500,
	COMPOSICION_MAX: 255,
	CODIGO_BARRAS_MAX: 50,
	/** Decimales de un precio */
	PRECIO_DECIMALES: 2
} as const;

const DECIMAL_REGEX = new RegExp(`^\\d+([.,]\\d{1,${PRODUCTO_LIMITS.PRECIO_DECIMALES}})?$`);
const INTEGER_REGEX = /^\d+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isUuid = (value: string) => z.uuid().safeParse(value).success;
const toNumber = (value: string) => Number(value.replace(',', '.'));

// El formulario trabaja con texto (lo que escribe el usuario); el schema lo convierte al tipo de la API
const requiredText = (max: number, label: string) =>
	z
		.string()
		.trim()
		.nonempty({ message: `${label} es requerido` })
		.max(max, { message: `${label} no puede exceder los ${max} caracteres.` });

// Vacío se envía como null
const optionalText = (max: number, label: string) =>
	z
		.string()
		.trim()
		.max(max, { message: `${label} no puede exceder los ${max} caracteres.` })
		.transform((value) => value || null);

const priceMessage = (label: string) =>
	`${label} debe ser un número válido, con hasta ${PRODUCTO_LIMITS.PRECIO_DECIMALES} decimales.`;

const requiredPrice = (label: string) =>
	z
		.string()
		.trim()
		.nonempty({ message: `${label} es requerido` })
		.regex(DECIMAL_REGEX, { message: priceMessage(label) })
		.transform(toNumber);

const optionalPrice = (label: string) =>
	z
		.string()
		.trim()
		.refine((value) => value === '' || DECIMAL_REGEX.test(value), { message: priceMessage(label) })
		.transform((value) => (value === '' ? null : toNumber(value)));

// Vacío no se envía (undefined desaparece del JSON): la API usa su valor por defecto
const omittablePrice = (label: string) =>
	z
		.string()
		.trim()
		.refine((value) => value === '' || DECIMAL_REGEX.test(value), { message: priceMessage(label) })
		.transform((value) => (value === '' ? undefined : toNumber(value)));

const requiredInteger = (label: string) =>
	z
		.string()
		.trim()
		.nonempty({ message: `${label} es requerido` })
		.regex(INTEGER_REGEX, { message: `${label} debe ser un número entero.` })
		.transform(Number);

const optionalDate = z
	.string()
	.trim()
	.refine((value) => value === '' || (DATE_REGEX.test(value) && !Number.isNaN(Date.parse(value))), {
		message: 'Ingresa una fecha válida.'
	})
	.transform((value) => value || null);

export const productoImagenSchema = z.object({
	url: z.string().nonempty({ message: 'La imagen aún no se ha subido.' }),
	tipo: z.enum(IMAGEN_TIPO, { message: 'Selecciona el tipo de imagen' })
});

export const productoSkuSchema = z.object({
	/** SKU ya guardado (al editar un color). Su stock no se envía con el color */
	id: z.string().optional(),
	talla_id: z
		.string()
		.nonempty({ message: 'Selecciona una talla' })
		.refine(isUuid, { message: 'La talla seleccionada no es válida.' }),
	codigo_barras: optionalText(PRODUCTO_LIMITS.CODIGO_BARRAS_MAX, 'El código de barras'),
	is_visible: z.boolean(),
	precio: z
		.object({
			normal: requiredPrice('El precio normal'),
			rebajado: optionalPrice('El precio rebajado'),
			rebaja_hasta: optionalDate
		})
		.refine(({ normal, rebajado }) => rebajado === null || rebajado <= normal, {
			path: ['rebajado'],
			message: 'El precio rebajado no puede superar al normal.'
		}),
	/**
	 * Costo por prenda, solo en SKUs nuevos (≥ 0; vacío = la API usa 0). El stock inicial entra al
	 * kardex a este costo. En uno guardado no se envía: corregiría el costo promedio a ciegas.
	 */
	costo: omittablePrice('El costo'),
	stock: z.object({
		cantidad: requiredInteger('La cantidad'),
		minimo: requiredInteger('El mínimo')
	})
});

export const productoColorSchema = z
	.object({
		color_id: z
			.string()
			.nonempty({ message: 'Selecciona un color' })
			.refine(isUuid, { message: 'El color seleccionado no es válido.' }),
		is_visible: z.boolean(),
		imagenes: z.array(productoImagenSchema),
		skus: z.array(productoSkuSchema)
	})
	.superRefine((color, ctx) => {
		const tallas = new Set<string>();
		color.skus.forEach((sku, index) => {
			if (tallas.has(sku.talla_id)) {
				ctx.addIssue({
					code: 'custom',
					path: ['skus', index, 'talla_id'],
					message: 'Esta talla ya está agregada en este color.'
				});
			}
			tallas.add(sku.talla_id);
		});
	});

/** Datos generales y categorías: los mismos al crear y al editar (`PATCH /productos/{id}`) */
export const productoDatosSchema = z.object({
	seccion_id: z
		.string()
		.nonempty({ message: 'Selecciona una sección' })
		.refine(isUuid, { message: 'La sección seleccionada no es válida.' }),
	nombre: requiredText(PRODUCTO_LIMITS.NOMBRE_MAX, 'El nombre'),
	descripcion: optionalText(PRODUCTO_LIMITS.DESCRIPCION_MAX, 'La descripción'),
	cuidados: optionalText(PRODUCTO_LIMITS.CUIDADOS_MAX, 'Los cuidados'),
	composicion: optionalText(PRODUCTO_LIMITS.COMPOSICION_MAX, 'La composición'),
	is_visible: z.boolean(),
	categoria_ids: z.array(z.string().refine(isUuid, { message: 'Categoría no válida.' }))
});

export const productoSchema = productoDatosSchema
	.extend({ colores: z.array(productoColorSchema) })
	.superRefine((producto, ctx) => {
		const colores = new Set<string>();
		producto.colores.forEach((color, index) => {
			if (colores.has(color.color_id)) {
				ctx.addIssue({
					code: 'custom',
					path: ['colores', index, 'color_id'],
					message: 'Este color ya está agregado al producto.'
				});
			}
			colores.add(color.color_id);
		});
	});

/** Lo que maneja el formulario: texto en los números y fechas, antes de convertirlo */
export type ProductoInput = z.input<typeof productoSchema>;
export type ProductoColorInput = z.input<typeof productoColorSchema>;
/** Ya validado y convertido a los tipos de la API */
export type ProductoColorParsed = z.output<typeof productoColorSchema>;
export type ProductoDatosParsed = z.output<typeof productoDatosSchema>;
