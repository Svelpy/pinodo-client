import { MediaQuery } from 'svelte/reactivity';

/**
 * Preferencia del sistema "reducir movimiento". Las transiciones de Svelte no la respetan solas:
 * se pasa `duracion(ms)` como `duration` para que se vuelvan instantáneas.
 * En el servidor vale `false` (las intros no se reproducen al hidratar).
 */
const movimientoReducido = new MediaQuery('prefers-reduced-motion: reduce', false);

/** Duración de una transición; 0 si el usuario pidió reducir el movimiento */
export function duracion(ms: number): number {
	return movimientoReducido.current ? 0 : ms;
}

/** Retraso escalonado para listas (se reinicia cada `bloque` elementos, p. ej. por página) */
export function escalonado(index: number, paso = 45, bloque = 24, max = 12): number {
	return movimientoReducido.current ? 0 : Math.min(index % bloque, max) * paso;
}
