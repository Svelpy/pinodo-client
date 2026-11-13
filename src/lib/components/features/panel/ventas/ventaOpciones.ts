import {
	METODO_PAGO,
	METODO_PAGO_LABEL,
	VENTA_CANAL,
	VENTA_CANAL_LABEL,
	type MetodoPago,
	type VentaCanal
} from '#lib/constants/index.ts';
import { CANAL_ICON, METODO_PAGO_ICON } from './ventaIcons.ts';

/**
 * Opciones de canal y método de pago para `SegmentedPicker`: las frecuentes siempre a la vista y el
 * resto tras "Más", para no mostrar ocho canales o siete métodos de golpe.
 */

/** Mostrador y WhatsApp; redes sociales, web y otro, tras "Más" */
const CANALES_FRECUENTES: readonly VentaCanal[] = [VENTA_CANAL.TIENDA, VENTA_CANAL.WHATSAPP];

/** Lo habitual en Bolivia; tarjeta, cheque, vales y otro, tras "Más" */
const METODOS_FRECUENTES: readonly MetodoPago[] = [
	METODO_PAGO.EFECTIVO,
	METODO_PAGO.QR,
	METODO_PAGO.TRANSFERENCIA
];

const canalOption = (value: VentaCanal) => ({
	value,
	label: VENTA_CANAL_LABEL[value],
	icon: CANAL_ICON[value]
});

const metodoOption = (value: MetodoPago) => ({
	value,
	label: METODO_PAGO_LABEL[value],
	icon: METODO_PAGO_ICON[value]
});

export const CANAL_OPCIONES = {
	frecuentes: CANALES_FRECUENTES.map(canalOption),
	mas: Object.values(VENTA_CANAL)
		.filter((canal) => !CANALES_FRECUENTES.includes(canal))
		.map(canalOption)
};

export const METODO_OPCIONES = {
	frecuentes: METODOS_FRECUENTES.map(metodoOption),
	mas: Object.values(METODO_PAGO)
		.filter((metodo) => !METODOS_FRECUENTES.includes(metodo))
		.map(metodoOption)
};

/** Venta a distancia (redes, web…): lo normal es guardarla como pedido y cobrar cuando pague */
export function esCanalADistancia(canal: VentaCanal): boolean {
	return canal !== VENTA_CANAL.TIENDA;
}
