<script lang="ts">
	import { tick } from 'svelte';
	import { Input, SegmentedPicker } from '#lib/components/ui/index.ts';
	import { METODO_PAGO, type MetodoPago } from '#lib/constants/index.ts';
	import { PlusIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { PagoLinea } from '#lib/interfaces/index.ts';
	import {
		calcularCambio,
		estadoPagos,
		formatCurrency,
		fromCents,
		nuevoPago,
		parseMonto,
		toCents
	} from '#lib/utils/index.ts';
	import { VENTA_LIMITS } from '#lib/zod/index.ts';
	import { METODO_OPCIONES } from './ventaOpciones.ts';

	/**
	 * Cómo paga el cliente. Por defecto un solo pago que cubre el total (solo se elige el método);
	 * "Dividir el pago" pasa a pagos mixtos, cada uno con su monto, que deben sumar exactamente el
	 * total. Los errores llegan con la ruta completa (`pagos.0.monto`, `pagos`).
	 */
	interface Props {
		pagos: PagoLinea[];
		/** Lo que deben sumar los pagos */
		total: number;
		/** Monto con que paga en efectivo, solo para calcular el cambio */
		pagaCon?: string;
		errores?: Record<string, string>;
		disabled?: boolean;
		label?: string;
	}

	let {
		pagos = $bindable(),
		total,
		pagaCon = $bindable(''),
		errores = {},
		disabled = false,
		label = 'Método de pago'
	}: Props = $props();

	const id = $props.id();

	const dividido = $derived(pagos.length > 1);
	const unico = $derived(pagos[0] ?? null);
	const estado = $derived(estadoPagos(pagos, total));
	const cambio = $derived(
		!dividido && unico?.metodo === METODO_PAGO.EFECTIVO ? calcularCambio(total, pagaCon) : null
	);
	// Con un solo pago el monto no se escribe: cualquier error suyo se muestra en el método
	const errorUnico = $derived(
		errores['pagos.0.metodo'] ?? errores['pagos.0.monto'] ?? errores['pagos.0'] ?? errores.pagos
	);

	function setMetodo(index: number, metodo: MetodoPago) {
		if (pagos.length === 0) {
			pagos = [nuevoPago(metodo)];
			return;
		}
		pagos[index].metodo = metodo;
	}

	async function focusMonto(index: number) {
		await tick();
		document.getElementById(`${id}-monto-${index}`)?.focus();
	}

	function dividir() {
		const primero = unico ?? nuevoPago();
		pagos = [{ ...primero, monto: '' }, nuevoPago()];
		pagaCon = '';
		focusMonto(0);
	}

	function agregar() {
		// El pago nuevo arranca con lo que falta, que suele ser lo que se cobra con el otro método
		pagos = [...pagos, nuevoPago(null, estado.falta > 0 ? String(estado.falta) : '')];
	}

	function quitar(index: number) {
		pagos = pagos.filter((_, i) => i !== index);
	}

	function completar(index: number) {
		const actual = parseMonto(pagos[index].monto) ?? 0;
		pagos[index].monto = String(fromCents(toCents(actual) + toCents(estado.falta)));
	}

	const linkClass =
		'inline-flex h-9 items-center gap-1.5 text-sm font-medium text-light-accent hover:underline disabled:pointer-events-none disabled:opacity-50 dark:text-dark-accent';
</script>

{#if !dividido}
	<div class="space-y-3">
		<SegmentedPicker
			{label}
			options={METODO_OPCIONES.frecuentes}
			more={METODO_OPCIONES.mas}
			moreLabel="Más métodos"
			value={unico?.metodo ?? null}
			onChange={(metodo: MetodoPago) => setMetodo(0, metodo)}
			columns={2}
			{disabled}
			error={errorUnico}
		/>

		{#if unico?.metodo === METODO_PAGO.EFECTIVO}
			<div class="flex items-end gap-3">
				<Input
					id="{id}-paga-con"
					label="Paga con (Bs)"
					inputmode="decimal"
					placeholder="0,00"
					autocomplete="off"
					bind:value={pagaCon}
					class="w-36"
					{disabled}
				/>
				<p class="pb-2.5 text-sm text-light-two_d dark:text-dark-two_d" aria-live="polite">
					{#if cambio !== null}
						Cambio:
						<span class="text-base font-semibold text-light-two dark:text-dark-two">
							{formatCurrency(cambio)}
						</span>
					{:else if pagaCon.trim() && parseMonto(pagaCon) !== null}
						<span class="text-light-error dark:text-dark-error">Monto insuficiente</span>
					{/if}
				</p>
			</div>
		{:else if unico?.metodo}
			<Input
				id="{id}-referencia-0"
				label="Referencia (opcional)"
				placeholder="N.º de operación o recibo"
				autocomplete="off"
				maxlength={VENTA_LIMITS.PAGO_REFERENCIA_MAX}
				bind:value={pagos[0].referencia}
				error={errores['pagos.0.referencia']}
				{disabled}
			/>
		{/if}

		<button type="button" class={linkClass} onclick={dividir} {disabled}>
			<PlusIcon class="size-4" />
			Dividir el pago (p. ej. parte QR y parte efectivo)
		</button>
	</div>
{:else}
	<fieldset class="space-y-3" aria-describedby="{id}-estado">
		<legend class="mb-1.5 text-sm font-medium text-light-two dark:text-dark-two">
			Pagos ({pagos.length})
		</legend>

		{#each pagos as pago, index (pago.id)}
			<div class="space-y-3 border border-light-one_d p-3 dark:border-dark-one_d">
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm font-medium text-light-two dark:text-dark-two">
						Pago {index + 1}
					</span>
					<button
						type="button"
						onclick={() => quitar(index)}
						{disabled}
						aria-label="Quitar el pago {index + 1}"
						class="-my-1 -mr-1 inline-flex size-9 items-center justify-center text-light-two_d hover:bg-light-one_d hover:text-light-error disabled:opacity-50 dark:text-dark-two_d dark:hover:bg-dark-one_d dark:hover:text-dark-error"
					>
						<TrashIcon class="size-4" />
					</button>
				</div>

				<SegmentedPicker
					label="Método del pago {index + 1}"
					showLabel={false}
					options={METODO_OPCIONES.frecuentes}
					more={METODO_OPCIONES.mas}
					moreLabel="Más métodos"
					value={pago.metodo}
					onChange={(metodo: MetodoPago) => setMetodo(index, metodo)}
					columns={2}
					{disabled}
					error={errores[`pagos.${index}.metodo`]}
				/>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<Input
							id="{id}-monto-{index}"
							label="Monto (Bs)"
							inputmode="decimal"
							placeholder="0,00"
							autocomplete="off"
							bind:value={pago.monto}
							error={errores[`pagos.${index}.monto`]}
							{disabled}
						/>
						{#if estado.falta > 0 && !pago.monto.trim()}
							<button
								type="button"
								class="mt-1 text-xs font-medium text-light-accent hover:underline dark:text-dark-accent"
								onclick={() => completar(index)}
								{disabled}
							>
								Usar lo que falta ({formatCurrency(estado.falta)})
							</button>
						{/if}
					</div>
					<Input
						id="{id}-referencia-{index}"
						label="Referencia"
						placeholder="Opcional"
						autocomplete="off"
						maxlength={VENTA_LIMITS.PAGO_REFERENCIA_MAX}
						bind:value={pago.referencia}
						error={errores[`pagos.${index}.referencia`]}
						{disabled}
					/>
				</div>
			</div>
		{/each}

		<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
			{#if pagos.length < VENTA_LIMITS.PAGOS_MAX}
				<button type="button" class={linkClass} onclick={agregar} {disabled}>
					<PlusIcon class="size-4" />
					Agregar otro método
				</button>
			{/if}
			<p id="{id}-estado" class="text-sm tabular-nums" aria-live="polite">
				{#if estado.falta > 0}
					<span class="text-light-two_d dark:text-dark-two_d">
						Falta {formatCurrency(estado.falta)}
					</span>
				{:else if estado.sobra > 0}
					<span class="text-light-error dark:text-dark-error">
						Sobra {formatCurrency(estado.sobra)}
					</span>
				{:else}
					<span class="text-light-success dark:text-dark-success">Cubre el total</span>
				{/if}
			</p>
		</div>

		{#if errores.pagos}
			<p role="alert" class="text-sm text-light-error dark:text-dark-error">{errores.pagos}</p>
		{/if}
	</fieldset>
{/if}
