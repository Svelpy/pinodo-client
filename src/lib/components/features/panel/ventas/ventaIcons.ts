import type { Component } from 'svelte';
import type { MetodoPago, VentaCanal } from '#lib/constants/index.ts';
import {
	BuildindStoreIcon,
	CreditCardIcon,
	DotsVerticalIcon,
	FacebookIcon,
	FileDescriptionIcon,
	InstagramIcon,
	ScanBarcodeIcon,
	ArrowsLeftRightIcon,
	TicketIcon,
	TikTokIcon,
	WalletIcon,
	WhatsappIcon,
	WorldIcon
} from '#lib/icons/outline/index.ts';

type Icon = Component<{ class?: string }>;

/** Icono de cada canal de venta */
export const CANAL_ICON: Record<VentaCanal, Icon> = {
	TIENDA: BuildindStoreIcon,
	WHATSAPP: WhatsappIcon,
	TIKTOK_LIVE: TikTokIcon,
	TIKTOK: TikTokIcon,
	INSTAGRAM: InstagramIcon,
	FACEBOOK: FacebookIcon,
	PAGINA_WEB: WorldIcon,
	OTROS: DotsVerticalIcon
};

/** Icono de cada método de pago */
export const METODO_PAGO_ICON: Record<MetodoPago, Icon> = {
	EFECTIVO: WalletIcon,
	QR: ScanBarcodeIcon,
	TRANSFERENCIA: ArrowsLeftRightIcon,
	TARJETA: CreditCardIcon,
	CHEQUE: FileDescriptionIcon,
	VALES: TicketIcon,
	OTROS: DotsVerticalIcon
};
