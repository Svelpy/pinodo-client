<script lang="ts">
	import { resolve } from '$app/paths';
	import { AJUSTE_MOTIVO_LABEL } from '#lib/constants/index.ts';
	import type { MovimientoOrigen } from '#lib/interfaces/index.ts';
	import { formatOrigen } from '#lib/utils/index.ts';

	/** Documento que causó el movimiento ("Ajuste #12 · Recepción"); puede enlazar a su detalle */
	interface Props {
		origen: MovimientoOrigen;
		/** false dentro de una fila o tarjeta que ya es clicable: solo texto */
		enlace?: boolean;
		class?: string;
	}

	let { origen, enlace = false, class: className }: Props = $props();

	const href = $derived(
		origen.tipo === 'VENTA'
			? resolve('/panel/ventas/historial/[id]', { id: origen.id })
			: resolve('/panel/kardex/ajustes/[id]', { id: origen.id })
	);
</script>

<span class={['min-w-0', className]}>
	{#if enlace}
		<a
			{href}
			class="font-medium text-light-two underline-offset-2 hover:underline dark:text-dark-two"
		>
			{formatOrigen(origen)}
		</a>
	{:else}
		{formatOrigen(origen)}
	{/if}
	{#if origen.motivo}
		· {AJUSTE_MOTIVO_LABEL[origen.motivo]}
	{/if}
</span>
