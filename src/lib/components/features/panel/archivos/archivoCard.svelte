<script lang="ts">
	import { Badge, ColorSwatch } from '#lib/components/ui/index.ts';
	import { IMAGEN_TIPO_LABEL } from '#lib/constants/index.ts';
	import type { Archivo } from '#lib/interfaces/index.ts';
	import { formatDate, formatDateTime } from '#lib/utils/index.ts';
	import ArchivoActions from './archivoActions.svelte';
	import ArchivoImagen from './archivoImagen.svelte';

	interface Props {
		archivo: Archivo;
		onView?: (archivo: Archivo) => void;
		onDelete?: (archivo: Archivo) => void;
	}

	let { archivo, onView, onDelete }: Props = $props();

	const alt = $derived(`${archivo.producto_nombre}, ${archivo.color_nombre}`);
</script>

<article
	class="flex flex-col border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
	aria-label={alt}
>
	<div class="relative">
		<!-- Abrir el detalle: la miniatura es el objetivo principal; las acciones quedan en el menú -->
		{#if onView}
			<button
				type="button"
				onclick={() => onView(archivo)}
				aria-label="Ver imagen de {alt}"
				class="block w-full focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none focus-visible:ring-inset dark:focus-visible:ring-dark-three"
			>
				<ArchivoImagen url={archivo.url} alt="" class="aspect-square w-full" />
			</button>
		{:else}
			<ArchivoImagen url={archivo.url} {alt} class="aspect-square w-full" />
		{/if}
		<Badge
			variant="secondary"
			size="sm"
			class="pointer-events-none absolute top-2 left-2 bg-light-one dark:bg-dark-one"
		>
			{IMAGEN_TIPO_LABEL[archivo.tipo]}
		</Badge>
	</div>

	<div class="flex items-start gap-1 p-3">
		<div class="min-w-0 flex-1">
			<h3
				class="truncate text-sm font-semibold text-light-two dark:text-dark-two"
				title={archivo.producto_nombre}
			>
				{archivo.producto_nombre}
			</h3>
			<p class="mt-1 flex items-center gap-1.5 text-xs text-light-two_d dark:text-dark-two_d">
				<ColorSwatch hex={archivo.color_codigo_hex} class="size-3.5" />
				<span class="truncate">{archivo.color_nombre}</span>
			</p>
			<p
				class="mt-1 text-xs text-light-two_d dark:text-dark-two_d"
				title={formatDateTime(archivo.created_at)}
			>
				{formatDate(archivo.created_at)}
			</p>
		</div>
		<div class="-mt-1 -mr-2 shrink-0">
			<ArchivoActions {archivo} {onView} {onDelete} />
		</div>
	</div>
</article>
