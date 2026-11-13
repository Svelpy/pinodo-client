import { z } from 'zod';
import { METODO_PAGO, VENTA_CANAL } from '#lib/constants/index.ts';
import type { VentaPagoRequest } from '#lib/interfaces/index.ts';

/**
 * Límites de los datos de una venta. Referencia y teléfono, de `VentaCreate` del backend; la nota,
 * los pagos y su referencia son provisionales: la documentación de la API no los indica.
 */
export const VENTA_LIMITS = {
	REFERENCIA_MAX: 150,
	TELEFONO_MIN: 6,
	TELEFONO_MAX: 20,
	NOTA_MAX: 500,
	/** Métodos distintos en un mismo cobro (pago mixto) */
	PAGOS_MAX: 5,
	/** N.º de operación o recibo de un pago */
	PAGO_REFERENCIA_MAX: 100,
	/** Búsqueda por código de barras del inventario */
	CODIGO_BARRAS_MAX: 50,
	/** Búsqueda por nombre del inventario */
	NOMBRE_BUSQUEDA_MAX: 200
} as const;

const MONTO_REGEX = /^\d+([.,]\d{1,2})?$/;
// Dígitos con espacios, guiones o paréntesis y un + inicial opcional
const TELEFONO_REGEX = /^\+?[\d\s\-()]+$/;

const toCents = (value: number) => Math.round(value * 100);
// Igual que `formatCurrency`; no se importa de utils porque utils ya importa de este barrel
const formatBs = (value: number) =>
	new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(value);

const optionalText = (max: number, label: string) =>
	z
		.string()
		.trim()
		.max(max, { message: `${label} no puede exceder los ${max} caracteres.` })
		.transform((value) => value || null);

const pagoSchema = z
	.object({
		metodo: z.enum(METODO_PAGO, { message: 'Elige el método de pago.' }),
		monto: z
			.string()
			.trim()
			.refine((value) => value !== '', { message: 'Ingresa el monto.' })
			.refine((value) => value === '' || MONTO_REGEX.test(value), {
				message: 'Ingresa un monto válido, con hasta 2 decimales.'
			})
			.transform((value) => Number(value.replace(',', '.')))
			.refine((value) => value > 0, { message: 'El monto debe ser mayor que 0.' }),
		referencia: optionalText(VENTA_LIMITS.PAGO_REFERENCIA_MAX, 'La referencia')
	})
	.transform(({ metodo, monto, referencia }): VentaPagoRequest =>
		referencia ? { metodo, monto, referencia } : { metodo, monto }
	);

/**
 * Pagos de la caja (`PagoLinea[]`) → `pagos` de `POST /ventas/` y `/confirmar`. Con un solo pago su
 * monto es el total (no se escribe); con varios, deben sumar exactamente el total: no hay anticipos.
 */
export function createVentaPagosSchema(total: number) {
	const totalCents = toCents(total);
	return z.preprocess(
		(value) =>
			Array.isArray(value) && value.length === 1
				? [{ ...value[0], monto: (totalCents / 100).toFixed(2) }]
				: value,
		z
			.array(pagoSchema)
			.min(1, { message: 'Elige cómo paga el cliente.' })
			.max(VENTA_LIMITS.PAGOS_MAX, {
				message: `Puedes combinar hasta ${VENTA_LIMITS.PAGOS_MAX} pagos.`
			})
			.superRefine((pagos, ctx) => {
				const sumaCents = pagos.reduce((sum, pago) => sum + toCents(pago.monto), 0);
				if (sumaCents === totalCents) return;
				const diferencia = Math.abs(totalCents - sumaCents) / 100;
				ctx.addIssue({
					code: 'custom',
					message:
						sumaCents < totalCents
							? `Faltan ${formatBs(diferencia)}: los pagos deben sumar el total (${formatBs(total)}).`
							: `Sobran ${formatBs(diferencia)}: los pagos deben sumar el total (${formatBs(total)}).`
				});
			})
	);
}

interface VentaCheckoutContext {
	/** Se cobra ahora (queda CONFIRMADA): los pagos son obligatorios */
	cobrar: boolean;
	/** Subtotal de las líneas: el descuento global no puede superarlo */
	subtotal: number;
	/** Total a cobrar (con el descuento global): lo que deben sumar los pagos */
	total: number;
}

/**
 * Datos del cobro de la caja (lo que escribe el usuario) → campos de `POST /ventas/`. Un pedido
 * (`cobrar: false`) se guarda sin pagos aunque se haya elegido un método.
 */
export function createVentaCheckoutSchema({ cobrar, subtotal, total }: VentaCheckoutContext) {
	return z.object({
		canal: z.enum(VENTA_CANAL, { message: 'Selecciona el canal de la venta' }),
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
			.refine((value) => toCents(value) <= toCents(subtotal), {
				message: 'El descuento no puede superar el subtotal.'
			}),
		nota: optionalText(VENTA_LIMITS.NOTA_MAX, 'La nota'),
		pagos: cobrar
			? createVentaPagosSchema(total)
			: z.array(z.unknown()).transform((): VentaPagoRequest[] => [])
	});
}

/** Cobro de un pedido pendiente (`POST /ventas/{id}/confirmar`) */
export function createVentaConfirmarSchema(total: number) {
	return z.object({ pagos: createVentaPagosSchema(total) });
}

export type VentaCheckoutInput = z.input<ReturnType<typeof createVentaCheckoutSchema>>;
export type VentaCheckoutOutput = z.output<ReturnType<typeof createVentaCheckoutSchema>>;
