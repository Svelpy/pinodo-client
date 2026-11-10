<script lang="ts">
	import { ColorSwatch } from '#lib/components/ui/index.ts';
	import { MinusIcon, PlusIcon, TagIcon, XIcon } from '#lib/icons/outline/index.ts';
	import type { CarritoLinea } from '#lib/interfaces/index.ts';
	import {
		calcularLinea,
		formatCurrency,
		precioLinea,
		toCents,
		validarLinea
	} from '#lib/utils/index.ts';

	interface Props {
		linea: CarritoLinea;
		/** Se cobra con los precios de hoy (edición de un pedido) */
		recalcular?: boolean;
		/** Recién agregada: se resalta un momento */
		resaltada?: boolean;
		disabled?: boolean;
		onCantidadChange: (cantidad: number) => void;
		onDescuentoChange: (descuento: string) => void;
		onRemove: () => void;
	}

	let {
		linea,
		recalcular = false,
		resaltada = false,
		disabled = false,
		onCantidadChange,
		onDescuentoChange,
		onRemove
	}: Props = $props();

	const id = $props.id();

	const errores = $derived(validarLinea(linea, recalcular));
	const precio = $derived(precioLinea(linea, recalcular));
	const subtotal = $derived(calcularLinea(linea, recalcular));
	const enRebaja = $derived(toCents(precio) < toCents(linea.precio_normal));
	const maximo = $derived(linea.stock ?? Infinity);
	// El precio de hoy difiere del ofrecido (solo pasa al editar un pedido guardado)
	const precioCambio = $derived(
		!recalcular &&
			linea.precio_actual !== null &&
			toCents(linea.precio_actual) !== toCents(linea.precio_unitario)
	);

	// svelte-ignore state_referenced_locally
	let mostrarDescuento = $state(linea.descuento_unitario !== '');
	const hayDescuento = $derived(mostrarDescuento || linea.descuento_unitario !== '');

	function handleCantidadInput(event: Event & { currentTarget: HTMLInputElement }) {
		const value = Number.parseInt(event.currentTarget.value, 10);
		if (Number.isNaN(value)) return;
		onCantidadChange(value);
	}

	// Al salir del campo, un valor vacío o inválido vuelve a la cantidad actual
	function handleCantidadBlur(event: Event & { currentTarget: HTMLInputElement }) {
		const value = Number.parseInt(event.currentTarget.value, 10);
		if (Number.isNaN(value) || value < 1) event.currentTarget.value = String(linea.cantidad);
	}

	const stepClass =
		'inline-flex size-9 shrink-0 items-center justify-center text-light-two transition-colors hover:bg-light-one_d focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-dark-two dark:hover:bg-dark-one_d dark:focus-visible:ring-dark-three';
</script>

<li
	class={[
		'px-3 py-3 transition-colors duration-700 sm:px-4',
		errores.linea && 'bg-light-error/5 dark:bg-dark-error/10',
		resaltada && !errores.linea && 'bg-light-accent/10 duration-0 dark:bg-dark-accent/15'
	]}
>
	<div class="flex items-start gap-2.5">
		{#if linea.color_codigo_hex}
			<ColorSwatch hex={linea.color_codigo_hex} class="mt-0.5 size-5" />
		{/if}
		<div class="min-w-0 flex-1">
			<p
				class="truncate font-medium text-light-two dark:text-dark-two"
				title={linea.producto_nombre}
			>
				{linea.producto_nombre}
			</p>
			<p class="truncate text-sm text-light-two_d dark:text-dark-two_d">
				{linea.color_nombre} · Talla <span class="font-semibold">{linea.talla_etiqueta}</span>
			</p>
		</div>
		<button
			type="button"
			onclick={onRemove}
			{disabled}
			aria-label="Quitar {linea.producto_nombre} talla {linea.talla_etiqueta}"
			class="-mt-1.5 -mr-2 inline-flex size-9 shrink-0 items-center justify-center text-light-two_d transition-colors hover:bg-light-error/10 hover:text-light-error focus-visible:ring-2 focus-visible:ring-light-error focus-visible:outline-none disabled:opacity-40 dark:text-dark-two_d dark:hover:bg-dark-error/10 dark:hover:text-dark-error"
		>
			<XIcon class="size-4" />
		</button>
	</div>

	<div class="mt-2 flex items-center justify-between gap-3">
		<div
			class={[
				'flex items-center border',
				errores.cantidad
					? 'border-light-error dark:border-dark-error'
					: 'border-light-one_d dark:border-dark-one_d'
			]}
		>
			<button
				type="button"
				class={stepClass}
				disabled={disabled || linea.cantidad <= 1}
				onclick={() => onCantidadChange(linea.cantidad - 1)}
				aria-label="Quitar una unidad"
			>
				<MinusIcon class="size-4" />
			</button>
			<label for="{id}-cantidad" class="sr-only">Cantidad</label>
			<input
				id="{id}-cantidad"
				type="number"
				inputmode="numeric"
				min="1"
				max={linea.stock ?? undefined}
				value={linea.cantidad}
				{disabled}
				oninput={handleCantidadInput}
				onblur={handleCantidadBlur}
				aria-invalid={!!errores.cantidad}
				aria-describedby={errores.cantidad ? `${id}-cantidad-error` : undefined}
				class="h-9 w-12 [appearance:textfield] border-x border-light-one_d bg-transparent text-center text-base font-semibold text-light-two outline-none focus:bg-light-one_d dark:border-dark-one_d dark:text-dark-two dark:focus:bg-dark-one_d [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			/>
			<button
				type="button"
				class={stepClass}
				disabled={disabled || linea.cantidad >= maximo}
				onclick={() => onCantidadChange(linea.cantidad + 1)}
				aria-label={linea.cantidad >= maximo ? 'No hay más stock' : 'Agregar una unidad'}
			>
				<PlusIcon class="size-4" />
			</button>
		</div>

		<div class="min-w-0 text-right">
			<p class="font-semibold text-light-two tabular-nums dark:text-dark-two">
				{formatCurrency(subtotal)}
			</p>
			<p class="text-xs text-light-two_d tabular-nums dark:text-dark-two_d">
				{#if enRebaja}
					<span class="line-through">{formatCurrency(linea.precio_normal)}</span>
				{/if}
				<span class={enRebaja ? 'text-light-accent dark:text-dark-accent' : ''}>
					{formatCurrency(precio)}
				</span>
				c/u
			</p>
		</div>
	</div>

	{#if linea.stock !== null && !errores.cantidad && linea.cantidad >= linea.stock}
		<p class="mt-1 text-xs text-light-two_d dark:text-dark-two_d">
			Llegaste al stock disponible ({linea.stock}).
		</p>
	{/if}
	{#if errores.cantidad}
		<p
			id="{id}-cantidad-error"
			role="alert"
			class="mt-1 text-xs font-medium text-light-error dark:text-dark-error"
		>
			{errores.cantidad}
		</p>
	{/if}
	{#if precioCambio && linea.precio_actual !== null}
		<p class="mt-1 text-xs text-light-two_d dark:text-dark-two_d">
			Precio de hoy: <span class="font-semibold">{formatCurrency(linea.precio_actual)}</span> (se conserva
			el ofrecido)
		</p>
	{/if}
	{#if errores.linea}
		<p role="alert" class="mt-1 text-xs font-medium text-light-error dark:text-dark-error">
			{errores.linea}
		</p>
	{/if}

	{#if hayDescuento}
		<div class="mt-2 flex items-center gap-2">
			<label
				for="{id}-descuento"
				class="shrink-0 text-xs font-medium text-light-two_d dark:text-dark-two_d"
			>
				Descuento por unidad (Bs)
			</label>
			<input
				id="{id}-descuento"
				type="text"
				inputmode="decimal"
				placeholder="0,00"
				value={linea.descuento_unitario}
				{disabled}
				oninput={(event) => onDescuentoChange(event.currentTarget.value)}
				aria-invalid={!!errores.descuento}
				aria-describedby={errores.descuento ? `${id}-descuento-error` : undefined}
				class={[
					'h-9 w-24 border bg-transparent px-2 text-right text-base text-light-two outline-none focus:border-light-three dark:text-dark-two dark:focus:border-dark-three',
					errores.descuento
						? 'border-light-error dark:border-dark-error'
						: 'border-light-one_d dark:border-dark-one_d'
				]}
			/>
		</div>
		{#if errores.descuento}
			<p
				id="{id}-descuento-error"
				role="alert"
				class="mt-1 text-xs font-medium text-light-error dark:text-dark-error"
			>
				{errores.descuento}
			</p>
		{/if}
	{:else}
		<button
			type="button"
			{disabled}
			onclick={() => (mostrarDescuento = true)}
			class="mt-1.5 inline-flex h-8 items-center gap-1 text-xs font-medium text-light-accent hover:underline dark:text-dark-accent"
		>
			<TagIcon class="size-3.5" />
			Aplicar descuento
		</button>
	{/if}
</li>
