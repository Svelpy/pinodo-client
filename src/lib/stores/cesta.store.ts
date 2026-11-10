import { derived, get, writable } from 'svelte/store';
import { CESTA_KEY } from '#lib/constants/index.ts';
import type { CestaItem, TiendaProductoDetalle } from '#lib/interfaces/index.ts';
import {
	agregarACesta,
	cambiarCantidadCesta,
	cantidadCesta,
	esCestaItem,
	quitarDeCesta,
	sincronizarCesta,
	totalCesta
} from '#lib/utils/index.ts';

/**
 * Cesta de la tienda pública. Arranca vacía (igual en el servidor y en el primer render del
 * navegador) y se hidrata desde localStorage con `cestaStore.init()`.
 */
export const cestaItems = writable<CestaItem[]>([]);
export const cestaAbierta = writable(false);
export const cestaCantidad = derived(cestaItems, cantidadCesta);
export const cestaTotal = derived(cestaItems, totalCesta);

function leer(): CestaItem[] {
	try {
		const raw = localStorage.getItem(CESTA_KEY);
		if (!raw) return [];
		const value: unknown = JSON.parse(raw);
		return Array.isArray(value) ? value.filter(esCestaItem) : [];
	} catch {
		return [];
	}
}

function guardar(items: CestaItem[]): void {
	try {
		if (items.length === 0) localStorage.removeItem(CESTA_KEY);
		else localStorage.setItem(CESTA_KEY, JSON.stringify(items));
	} catch {
		// Sin almacenamiento (modo privado) la cesta funciona igual, solo no sobrevive a la recarga
	}
}

function actualizar(fn: (items: CestaItem[]) => CestaItem[]): void {
	const actuales = get(cestaItems);
	const nuevos = fn(actuales);
	if (nuevos === actuales) return;
	cestaItems.set(nuevos);
	guardar(nuevos);
}

let iniciada = false;

export const cestaStore = {
	/** Carga la cesta guardada y la mantiene sincronizada entre pestañas. Solo en el navegador */
	init(): void {
		if (iniciada || typeof window === 'undefined') return;
		iniciada = true;
		cestaItems.set(leer());
		window.addEventListener('storage', (event) => {
			if (event.key === CESTA_KEY || event.key === null) cestaItems.set(leer());
		});
	},
	agregar(item: CestaItem): void {
		actualizar((items) => agregarACesta(items, item));
		cestaAbierta.set(true);
	},
	cambiarCantidad(skuId: string, cantidad: number): void {
		actualizar((items) => cambiarCantidadCesta(items, skuId, cantidad));
	},
	quitar(skuId: string): void {
		actualizar((items) => quitarDeCesta(items, skuId));
	},
	vaciar(): void {
		actualizar((items) => (items.length ? [] : items));
	},
	/** Refresca precios y stock de las líneas del producto con su ficha recién cargada */
	sincronizar(producto: TiendaProductoDetalle): void {
		actualizar((items) => sincronizarCesta(items, producto));
	},
	abrir: () => cestaAbierta.set(true),
	cerrar: () => cestaAbierta.set(false)
};
