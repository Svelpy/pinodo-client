import { get, writable } from 'svelte/store';
import type { Tienda } from '#lib/interfaces/index.ts';
import { tiendaService } from '#lib/services/index.ts';

// Configuración de la tienda; null hasta que se carga (o sin sesión). Arranca con lo guardado en localStorage
export const currentTiendaStore = writable<Tienda | null>(tiendaService.getCached());

// Carga en curso, compartida: el login y el layout del panel pueden pedirla a la vez
let loading: Promise<Tienda | null> | null = null;
// Cambia al limpiar: una respuesta que llega después del logout no debe repoblar el store
let generation = 0;

function load(): Promise<Tienda | null> {
	loading ??= (async () => {
		const current = generation;
		try {
			const tienda = await tiendaService.get();
			if (current !== generation) return null;
			tiendaService.setCached(tienda);
			currentTiendaStore.set(tienda);
			return tienda;
		} catch {
			// La tienda es informativa (nombre y logo): si falla no se interrumpe el login ni el panel.
			// apiPinodo ya registró el error y se reintenta en la próxima navegación del panel.
			return null;
		} finally {
			if (current === generation) loading = null;
		}
	})();
	return loading;
}

export const tiendaStore = {
	/** Pide la tienda a la API solo si no está guardada (p. ej. al recargar o entrar directo a /panel) */
	ensure: (): Promise<Tienda | null> => {
		const cached = get(currentTiendaStore);
		return cached ? Promise.resolve(cached) : load();
	},

	/** Vuelve a pedir la tienda a la API (tras el login, o si cambió) */
	refresh: load,

	/** Actualiza la tienda con datos ya conocidos, p. ej. la respuesta al editar "Mi negocio" */
	set: (tienda: Tienda) => {
		tiendaService.setCached(tienda);
		currentTiendaStore.set(tienda);
	},

	clear: () => {
		generation++;
		loading = null;
		tiendaService.clearCached();
		currentTiendaStore.set(null);
	}
};
