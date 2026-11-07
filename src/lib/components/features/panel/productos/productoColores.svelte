<script lang="ts">
	import { ColorSwatch } from '#lib/components/ui/index.ts';
	import type { ProductoResumenColor } from '#lib/interfaces/index.ts';

	interface Props {
		colores: readonly ProductoResumenColor[];
		/** Cuántas muestras se dibujan; el resto se resume en "+N" */
		max?: number;
	}

	let { colores, max = 5 }: Props = $props();

	const visibles = $derived(colores.slice(0, max));
	const restantes = $derived(Math.max(0, colores.length - max));
</script>

{#if colores.length === 0}
	<span class="text-light-two_d dark:text-dark-two_d">—</span>
{:else}
	<!-- Las muestras son decorativas: los nombres van como texto para lectores de pantalla -->
	<span class="sr-only">{colores.map((color) => color.nombre).join(', ')}</span>
	<span class="flex items-center gap-1" aria-hidden="true">
		{#each visibles as color (color.codigo_hex + color.nombre)}
			<span title={color.nombre} class="inline-flex">
				<ColorSwatch hex={color.codigo_hex} class="size-5" />
			</span>
		{/each}
		{#if restantes > 0}
			<span class="ml-1 text-xs text-light-two_d dark:text-dark-two_d">+{restantes}</span>
		{/if}
	</span>
{/if}
