<script lang="ts">
	import { AlertBox, Badge, Button } from '#lib/components/ui/index.ts';
	import { PencilIcon, PlusIcon } from '#lib/icons/outline/index.ts';
	import type {
		CategoriaItem,
		Color,
		ProductoColor,
		ProductoDetalle,
		ProductoFichaEdicion,
		ProductoSku,
		Seccion,
		Talla
	} from '#lib/interfaces/index.ts';
	import {
		formatBoolean,
		formatDate,
		formatNumber,
		formatPriceRange,
		formatValue
	} from '#lib/utils/index.ts';
	import ProductoColorEditor from './productoColorEditor.svelte';
	import ProductoColores from './productoColores.svelte';
	import ProductoDatosEditor from './productoDatosEditor.svelte';
	import ProductoFichaColor from './productoFichaColor.svelte';
	import ProductoPortada from './productoPortada.svelte';

	/** Catálogos que necesitan los editores; se cargan al abrir el primero */
	interface Catalogos {
		secciones: readonly Seccion[];
		categorias: readonly CategoriaItem[];
		colores: readonly Color[];
		tallas: readonly Talla[];
	}

	interface Props {
		producto: ProductoDetalle;
		/** Editor abierto; null = solo lectura */
		editing?: ProductoFichaEdicion | null;
		catalogos?: Catalogos | null;
		catalogosError?: string;
		onRetryCatalogos?: () => void;
		/** El editor abierto pasó a tener (o dejó de tener) cambios sin guardar */
		onDirtyChange?: (dirty: boolean) => void;
		/** Acciones según permisos: sin handler no se muestran */
		onEdit?: (edicion: ProductoFichaEdicion) => void;
		onDeleteColor?: (color: ProductoColor) => void;
		onAdjustStock?: (sku: ProductoSku, color: ProductoColor) => void;
		onCancelEdit?: () => void;
		onDatosSaved?: (producto: ProductoDetalle) => void;
		onColorSaved?: (color: ProductoColor) => void;
	}

	let {
		producto,
		editing = null,
		catalogos = null,
		catalogosError = '',
		onRetryCatalogos,
		onDirtyChange,
		onEdit,
		onDeleteColor,
		onAdjustStock,
		onCancelEdit = () => {},
		onDatosSaved = () => {},
		onColorSaved = () => {}
	}: Props = $props();

	const isEditing = $derived(editing !== null);
	const editingDatos = $derived(editing?.tipo === 'datos');
	const editingColorId = $derived(editing?.tipo === 'color' ? editing.colorId : undefined);

	// Colores que ya tiene el producto, salvo el que se edita: no se pueden repetir
	function usedColorIds(exceptId: string | null): string[] {
		return producto.colores.filter((c) => c.id !== exceptId).map((c) => c.color_id);
	}

	const BASE =
		'border border-light-one_d bg-light-one p-4 sm:p-6 dark:border-dark-one_d dark:bg-dark-one';
	const LABEL = 'text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';

	const details = $derived([
		{ label: 'Descripción', value: producto.descripcion },
		{ label: 'Cuidados', value: producto.cuidados },
		{ label: 'Composición', value: producto.composicion }
	]);
</script>

<div class="space-y-4">
	<section class={BASE} aria-labelledby="ficha-resumen">
		<div class="flex flex-col gap-4 md:flex-row">
			<ProductoPortada
				url={producto.resumen.portada_url}
				alt="Portada de {producto.nombre}"
				class="size-28 self-start sm:size-36"
			/>
			<div class="min-w-0 flex-1 space-y-3">
				<div>
					<h2
						id="ficha-resumen"
						class="text-lg font-semibold text-light-two sm:text-xl dark:text-dark-two"
					>
						{producto.nombre}
					</h2>
					<p class="text-sm text-light-two_d dark:text-dark-two_d">{producto.seccion.nombre}</p>
				</div>

				<dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
					<div>
						<dt class={LABEL}>Visibilidad</dt>
						<dd class="mt-1">
							<Badge variant={producto.is_visible ? 'success' : 'secondary'} dot>
								{formatBoolean(producto.is_visible, { trueLabel: 'Visible', falseLabel: 'Oculto' })}
							</Badge>
						</dd>
					</div>
					<div>
						<dt class={LABEL}>Precio</dt>
						<dd class="mt-1 text-light-two dark:text-dark-two">
							{formatPriceRange(producto.resumen.precio_desde, producto.resumen.precio_hasta)}
						</dd>
					</div>
					<div>
						<dt class={LABEL}>Stock total</dt>
						<dd class="mt-1 text-light-two dark:text-dark-two">
							{formatNumber(producto.resumen.stock_total)}
						</dd>
					</div>
					<div>
						<dt class={LABEL}>Colores</dt>
						<dd class="mt-1">
							<ProductoColores colores={producto.resumen.colores} />
						</dd>
					</div>
				</dl>

				<p class="text-xs text-light-two_d dark:text-dark-two_d">
					Creado el {formatDate(producto.created_at)} · Actualizado el {formatDate(
						producto.updated_at
					)}
				</p>
			</div>
		</div>
	</section>

	{#snippet catalogosPendientes()}
		<!-- Los editores necesitan secciones, categorías, colores y tallas -->
		<div class={BASE}>
			{#if catalogosError}
				<AlertBox>
					No se pudieron cargar los datos para editar: {catalogosError}
					{#snippet action()}
						<button
							type="button"
							onclick={onRetryCatalogos}
							class="font-medium underline underline-offset-2"
						>
							Reintentar
						</button>
					{/snippet}
				</AlertBox>
				<Button variant="outline" size="sm" onclick={onCancelEdit} class="mt-3">Cancelar</Button>
			{:else}
				<p role="status" class="text-sm text-light-two_d dark:text-dark-two_d">
					Preparando el editor…
				</p>
			{/if}
		</div>
	{/snippet}

	{#if editingDatos}
		{#if catalogos}
			<ProductoDatosEditor
				{producto}
				secciones={catalogos.secciones}
				categorias={catalogos.categorias}
				{onDirtyChange}
				onSaved={onDatosSaved}
				onCancel={onCancelEdit}
			/>
		{:else}
			{@render catalogosPendientes()}
		{/if}
	{:else}
		<section class={BASE} aria-labelledby="ficha-detalles">
			<div class="mb-4 flex items-center justify-between gap-3">
				<h2 id="ficha-detalles" class="text-base font-semibold text-light-two dark:text-dark-two">
					Datos generales
				</h2>
				{#if onEdit}
					<Button
						variant="outline"
						size="sm"
						onclick={() => onEdit({ tipo: 'datos' })}
						disabled={isEditing}
					>
						{#snippet leftIcon()}<PencilIcon class="size-4" />{/snippet}
						Editar
					</Button>
				{/if}
			</div>
			<dl class="space-y-4 text-sm">
				{#each details as detail (detail.label)}
					<div>
						<dt class={LABEL}>{detail.label}</dt>
						<dd class="mt-1 whitespace-pre-line text-light-two dark:text-dark-two">
							{formatValue(detail.value)}
						</dd>
					</div>
				{/each}
				<div>
					<dt class={LABEL}>Categorías</dt>
					<dd class="mt-1">
						{#if producto.categorias.length === 0}
							<span class="text-light-two_d dark:text-dark-two_d">Sin categorías</span>
						{:else}
							<ul class="flex flex-wrap gap-2">
								{#each producto.categorias as categoria (categoria.id)}
									<li><Badge variant="secondary">{categoria.nombre}</Badge></li>
								{/each}
							</ul>
						{/if}
					</dd>
				</div>
			</dl>
		</section>
	{/if}

	<section aria-labelledby="ficha-colores" class="space-y-3">
		<div class="flex items-center justify-between gap-3">
			<h2 id="ficha-colores" class="text-base font-semibold text-light-two dark:text-dark-two">
				Colores y tallas
			</h2>
			{#if onEdit}
				<Button
					variant="outline"
					size="sm"
					onclick={() => onEdit({ tipo: 'color', colorId: null })}
					disabled={isEditing}
				>
					{#snippet leftIcon()}<PlusIcon class="size-4" />{/snippet}
					Agregar color
				</Button>
			{/if}
		</div>
		{#if producto.colores.length === 0 && editingColorId !== null}
			<p
				class="border border-light-one_d bg-light-one p-4 text-sm text-light-two_d dark:border-dark-one_d dark:bg-dark-one dark:text-dark-two_d"
			>
				Este producto no tiene colores.
			</p>
		{:else}
			{#each producto.colores as color (color.id)}
				{#if editingColorId === color.id}
					{#if catalogos}
						<ProductoColorEditor
							productoId={producto.id}
							{color}
							colores={catalogos.colores}
							tallas={catalogos.tallas}
							usedColorIds={usedColorIds(color.id)}
							{onDirtyChange}
							onSaved={onColorSaved}
							onCancel={onCancelEdit}
						/>
					{:else}
						{@render catalogosPendientes()}
					{/if}
				{:else}
					<ProductoFichaColor
						{color}
						disabled={isEditing}
						onEdit={onEdit && (() => onEdit({ tipo: 'color', colorId: color.id }))}
						onDelete={onDeleteColor && (() => onDeleteColor(color))}
						onAdjustStock={onAdjustStock && ((sku) => onAdjustStock(sku, color))}
					/>
				{/if}
			{/each}
		{/if}

		<!-- Color nuevo: el editor aparece al final de la lista -->
		{#if editingColorId === null}
			{#if catalogos}
				<ProductoColorEditor
					productoId={producto.id}
					color={null}
					colores={catalogos.colores}
					tallas={catalogos.tallas}
					usedColorIds={usedColorIds(null)}
					{onDirtyChange}
					onSaved={onColorSaved}
					onCancel={onCancelEdit}
				/>
			{:else}
				{@render catalogosPendientes()}
			{/if}
		{/if}
	</section>
</div>
