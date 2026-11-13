import { z } from 'zod';
import { AJUSTE_MOTIVO } from '#lib/constants/index.ts';
import type {
	AjusteInventarioItemRequest,
	AjusteMotivoManual,
	CreateAjusteInventarioRequest
} from '#lib/interfaces/index.ts';

/** Límites de `AjusteInventarioCreate` del backend */
export const AJUSTE_LIMITS = {
	NOTA_MAX: 200,
	/** SKUs por ajuste */
	ITEMS_MAX: 200
} as const;

/** Motivos que se registran a mano, en el orden en que se ofrecen (INICIAL lo genera el sistema) */
export const AJUSTE_MOTIVOS_MANUALES = [
	AJUSTE_MOTIVO.RECEPCION,
	AJUSTE_MOTIVO.CONTEO,
	AJUSTE_MOTIVO.MERMA,
	AJUSTE_MOTIVO.ROBO_PERDIDA,
	AJUSTE_MOTIVO.CORRECCION
] as const satisfies readonly AjusteMotivoManual[];

const INTEGER_REGEX = /^\d+$/;
const MONTO_REGEX = /^\d+([.,]\d{1,2})?$/;

/**
 * Ajuste de stock de un SKU tal como lo escribe el usuario (todo texto) → el ajuste listo para
 * `POST /ajustes-inventario/` (sin `sku_id`, que pone quien lo envía) y el mínimo nuevo.
 *
 * - `cantidad` vacía = no se ajusta el stock (solo el mínimo, si cambió). En un CONTEO es lo
 *   contado (≥ 0); en los demás, cuántas prendas entran o salen (> 0).
 * - CORRECCION usa `sentido` para el signo y exige `nota`; RECEPCION exige `costo` por prenda.
 * - `minimo` vacío = no cambia.
 */
export const ajusteStockSchema = z
	.object({
		motivo: z.enum(AJUSTE_MOTIVOS_MANUALES, { message: 'Elige el motivo del ajuste.' }),
		sentido: z.enum(['entrada', 'salida']),
		cantidad: z.string().trim(),
		costo: z.string().trim(),
		nota: z
			.string()
			.trim()
			.max(AJUSTE_LIMITS.NOTA_MAX, {
				message: `La nota no puede exceder los ${AJUSTE_LIMITS.NOTA_MAX} caracteres.`
			}),
		minimo: z
			.string()
			.trim()
			.refine((value) => value === '' || INTEGER_REGEX.test(value), {
				message: 'El mínimo debe ser un número entero mayor o igual a 0.'
			})
	})
	.superRefine((values, ctx) => {
		if (values.cantidad === '') return;
		const conteo = values.motivo === AJUSTE_MOTIVO.CONTEO;
		if (!INTEGER_REGEX.test(values.cantidad) || (!conteo && Number(values.cantidad) === 0)) {
			ctx.addIssue({
				code: 'custom',
				path: ['cantidad'],
				message: conteo
					? 'Escribe cuántas prendas contaste (0 o más).'
					: 'La cantidad debe ser un número entero mayor que 0.'
			});
		}
		if (values.motivo === AJUSTE_MOTIVO.RECEPCION && !MONTO_REGEX.test(values.costo)) {
			ctx.addIssue({
				code: 'custom',
				path: ['costo'],
				message:
					values.costo === ''
						? 'Indica cuánto costó cada prenda.'
						: 'El costo debe ser un número válido, con hasta 2 decimales.'
			});
		}
		if (values.motivo === AJUSTE_MOTIVO.CORRECCION && values.nota === '') {
			ctx.addIssue({
				code: 'custom',
				path: ['nota'],
				message: 'Explica qué se corrige.'
			});
		}
	})
	.transform(({ motivo, sentido, cantidad, costo, nota, minimo }) => ({
		ajuste: cantidad === '' ? null : toAjuste(motivo, sentido, Number(cantidad), costo, nota),
		minimo: minimo === '' ? null : Number(minimo)
	}));

/** Ajuste de un SKU sin `sku_id`: el modal lo completa con el SKU que ajusta */
export type AjusteStockSku = Omit<CreateAjusteInventarioRequest, 'items'> & {
	item: Omit<AjusteInventarioItemRequest, 'sku_id'>;
};

function toAjuste(
	motivo: AjusteMotivoManual,
	sentido: 'entrada' | 'salida',
	cantidad: number,
	costo: string,
	nota: string
): AjusteStockSku {
	const item: AjusteStockSku['item'] =
		motivo === AJUSTE_MOTIVO.CONTEO
			? { cantidad_contada: cantidad }
			: motivo === AJUSTE_MOTIVO.RECEPCION
				? { cantidad, costo_unitario: Number(costo.replace(',', '.')) }
				: motivo === AJUSTE_MOTIVO.CORRECCION && sentido === 'salida'
					? { cantidad: -cantidad }
					: { cantidad };
	return { motivo, ...(nota && { nota }), item };
}

export type AjusteStockInput = z.input<typeof ajusteStockSchema>;
export type AjusteStockOutput = z.output<typeof ajusteStockSchema>;
