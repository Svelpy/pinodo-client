import { z } from 'zod';
import { METODO_PAGO, VENTA_CANAL } from '#lib/constants/index.ts';

/**
 * Límites de los datos de una venta. Provisionales: la documentación de la API no los indica;
 * confirmar contra `VentaCreate` del backend y actualizar aquí.
 */
export const VENTA_LIMITS = {
	REFERENCIA_MAX: 100,
	TELEFONO_MIN: 6,
	TELEFONO_MAX: 30,
	NOTA_MAX: 500,
	/** Búsqueda por código de barras del inventario */
	CODIGO_BARRAS_MAX: 50,
	/** Búsqueda por nombre del inventario */
	NOMBRE_BUSQUEDA_MAX: 200
} as const;

const MONTO_REGEX = /^\d+([.,]\d{1,2})?$/;
// Dígitos con espacios, guiones o paréntesis y un + inicial opcional
const TELEFONO_REGEX = /^\+?[\d\s\-()]+$/;

const optionalText = (max: number, label: string) =>
	z
		.string()
		.trim()
		.max(max, { message: `${label} no puede exceder los ${max} caracteres.` })
		.transform((value) => value || null);

interface VentaCheckoutContext {
	/** Se cobra ahora (CONFIRMADA): el método de pago es obligatorio */
	cobrar: boolean;
	/** Subtotal de las líneas: el descuento global no puede superarlo */
	subtotal: number;
}

/** Datos del cobro de la caja (lo que escribe el usuario) → campos de `POST /ventas/` */
export function createVentaCheckoutSchema({ cobrar, subtotal }: VentaCheckoutContext) {
	return z
		.object({
			canal: z.enum(VENTA_CANAL, { message: 'Selecciona el canal de la venta' }),
			metodo_pago: z.enum(METODO_PAGO).nullable(),
			referencia: optionalText(VENTA_LIMITS.REFERENCIA_MAX, 'El cliente'),
			cliente_telefono: z
				.string()
				.trim()
				.refine((value) => value === '' || TELEFONO_REGEX.test(value), {
					message: 'Ingresa solo números, espacios o guiones (con + opcional).'
				})
				.refine(
					(value) => {
						const digits = value.replace(/\D/g, '').length;
						return value === '' || digits >= VENTA_LIMITS.TELEFONO_MIN;
					},
					{ message: `El teléfono debe tener al menos ${VENTA_LIMITS.TELEFONO_MIN} dígitos.` }
				)
				.refine((value) => value.length <= VENTA_LIMITS.TELEFONO_MAX, {
					message: `El teléfono no puede exceder los ${VENTA_LIMITS.TELEFONO_MAX} caracteres.`
				})
				.transform((value) => value || null),
			descuento: z
				.string()
				.trim()
				.refine((value) => value === '' || MONTO_REGEX.test(value), {
					message: 'Ingresa un monto válido, con hasta 2 decimales.'
				})
				.transform((value) => (value === '' ? 0 : Number(value.replace(',', '.'))))
				.refine((value) => Math.round(value * 100) <= Math.round(subtotal * 100), {
					message: 'El descuento no puede superar el subtotal.'
				}),
			nota: optionalText(VENTA_LIMITS.NOTA_MAX, 'La nota')
		})
		.refine((value) => !cobrar || value.metodo_pago !== null, {
			message: 'Selecciona el método de pago para cobrar.',
			path: ['metodo_pago']
		});
}

export type VentaCheckoutInput = z.input<ReturnType<typeof createVentaCheckoutSchema>>;
export type VentaCheckoutOutput = z.output<ReturnType<typeof createVentaCheckoutSchema>>;
