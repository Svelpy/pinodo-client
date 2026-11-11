<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge, Button, ColorSwatch, Sheet } from '#lib/components/ui/index.ts';
	import { IMAGEN_TIPO_LABEL } from '#lib/constants/index.ts';
	import { ArrowUpRightIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { Archivo } from '#lib/interfaces/index.ts';
	import { formatDateTime } from '#lib/utils/index.ts';
	import ArchivoImagen from './archivoImagen.svelte';

	interface Props {
		/** Imagen a mostrar; null = cerrado */
		archivo: Archivo | null;
		onClose: () => void;
		/** Si no se pasa (sin permiso) no se muestra el botón */
		onDelete?: (archivo: Archivo) => void;
	}

	let { archivo, onClose, onDelete }: Props = $props();

	const labelClass = 'text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
	const valueClass = 'text-sm text-light-two dark:text-dark-two';
</script>

<Sheet
	open={!!archivo}
	{onClose}
	title="Detalle de la imagen"
	description={archivo ? `${archivo.producto_nombre} · ${archivo.color_nombre}` : undefined}
>
	{#if archivo}
		<div class="space-y-5">
			<ArchivoImagen
				url={archivo.url}
				alt="{archivo.producto_nombre}, {archivo.color_nombre}"
				width={1000}
				fit="contain"
				class="max-h-[60dvh] min-h-48 w-full"
			/>

			<dl class="grid grid-cols-2 gap-x-4 gap-y-4">
				<div class="col-span-2">
					<dt class={labelClass}>Producto</dt>
					<dd class={valueClass}>
						<a
							href={resolve('/panel/productos/[id]', { id: archivo.producto_id })}
							class="font-medium underline-offset-2 hover:underline"
						>
							{archivo.producto_nombre}
						</a>
					</dd>
				</div>
				<div>
					<dt class={labelClass}>Color</dt>
					<dd class="{valueClass} flex items-center gap-2">
						<ColorSwatch hex={archivo.color_codigo_hex} class="size-4" />
						{archivo.color_nombre}
					</dd>
				</div>
				<div>
					<dt class={labelClass}>Tipo</dt>
					<dd class={valueClass}>
						<Badge variant="secondary" size="sm">{IMAGEN_TIPO_LABEL[archivo.tipo]}</Badge>
					</dd>
				</div>
				<div>
					<dt class={labelClass}>Subida</dt>
					<dd class={valueClass}>{formatDateTime(archivo.created_at)}</dd>
				</div>
				<div>
					<dt class={labelClass}>Actualizada</dt>
					<dd class={valueClass}>{formatDateTime(archivo.updated_at)}</dd>
				</div>
			</dl>
		</div>
	{/if}

	{#snippet footer()}
		{#if archivo}
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
				{#if onDelete}
					<Button
						variant="outline"
						onclick={() => onDelete(archivo)}
						class="w-full sm:mr-auto sm:w-auto"
					>
						{#snippet leftIcon()}<TrashIcon class="size-4" />{/snippet}
						Eliminar
					</Button>
				{/if}
				<Button
					variant="outline"
					href={archivo.url}
					target="_blank"
					rel="noopener noreferrer"
					class="w-full sm:w-auto"
				>
					Abrir original
					{#snippet rightIcon()}<ArrowUpRightIcon class="size-4" />{/snippet}
				</Button>
				<Button
					href={resolve('/panel/productos/[id]', { id: archivo.producto_id })}
					class="w-full sm:w-auto"
				>
					Ver producto
				</Button>
			</div>
		{/if}
	{/snippet}
</Sheet>
