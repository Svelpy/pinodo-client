<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, Input, Select, Sheet } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { AjustarStockRequest, ProductoSku } from '#lib/interfaces/index.ts';
	import { AppError, errorService, skuService } from '#lib/services/index.ts';
	import { alert, formatDateTime, formatNumber, validateSchema } from '#lib/utils/index.ts';
	import { skuStockSchema } from '#lib/zod/index.ts';

	interface Props {
		/** SKU a ajustar; null = cerrado */
		sku: ProductoSku | null;
		/** Para el título (p. ej. "Azul marino · talla M") */
		colorNombre?: string;
		onClose: () => void;
		onSaved: (sku: ProductoSku) => void;
	}

	let { sku, colorNombre = '', onClose, onSaved }: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	let movimiento = $state<'entrada' | 'salida'>('entrada');
	let cantidad = $state('');
	let minimo = $state('');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	const parsed = $derived(skuStockSchema.safeParse({ movimiento, cantidad, minimo }));
	// El mínimo vacío o igual al actual no se envía; sin ajuste ni mínimo nuevo no hay nada que guardar
	const body = $derived.by((): AjustarStockRequest => {
		if (!sku || !parsed.success) return {};
		const request: AjustarStockRequest = {};
		if (parsed.data.ajuste !== null) request.ajuste = parsed.data.ajuste;
		if (parsed.data.minimo !== null && parsed.data.minimo !== sku.stock.minimo) {
			request.minimo = parsed.data.minimo;
		}
		return request;
	});
	const hasChanges = $derived(Object.keys(body).length > 0);

	// Stock que quedaría tras el ajuste (el servidor lo suma al que tenga en ese momento)
	const resultante = $derived(sku && body.ajuste ? sku.stock.cantidad + body.ajuste : null);
	const quedaNegativo = $derived(resultante !== null && resultante < 0);

	// Empezar de cero cada vez que se abre
	$effect(() => {
		if (!sku) return;
		untrack(() => {
			movimiento = 'entrada';
			cantidad = '';
			minimo = '';
			fieldErrors = {};
			formError = '';
		});
	});

	function handleClose() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!sku) return;
		formError = '';

		const result = validateSchema(skuStockSchema, { movimiento, cantidad, minimo });
		if (!result.success) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};
		if (!hasChanges) {
			fieldErrors = { minimo: 'El mínimo es el mismo que ya tiene el SKU.' };
			return;
		}
		if (quedaNegativo) return;

		isLoading = true;
		let saved: ProductoSku | null = null;
		try {
			saved = await skuService.ajustarStock(sku.id, body);
			alert('success', `Stock de la talla ${saved.talla.etiqueta} actualizado.`);
			onSaved(saved);
		} catch (error) {
			// 409: salió más de lo que había (las ventas pudieron mover el stock mientras se editaba)
			const stockActual =
				error instanceof AppError && error.is(ErrorCode.CONFLICT)
					? error.details.stock_actual
					: undefined;
			if (typeof stockActual === 'number') {
				formError = `El stock actual es ${formatNumber(stockActual)}: no alcanza para esta salida.`;
			} else {
				const apiErrors = errorService.getFieldErrors(error);
				fieldErrors = apiErrors;
				formError = Object.keys(apiErrors).length > 0 ? '' : errorService.getMessage(error);
			}
		} finally {
			isLoading = false;
		}

		if (saved) handleClose();
	}
</script>

<Sheet
	open={!!sku}
	onClose={handleClose}
	dismissible={!isLoading}
	title="Ajustar stock"
	description={sku
		? `${colorNombre ? `${colorNombre} · ` : ''}Talla ${sku.talla.etiqueta}. Última actualización: ${formatDateTime(sku.stock.actualizado)}.`
		: ''}
>
	<form id={FORM_ID} onsubmit={handleSubmit} novalidate class="space-y-4">
		{#if formError}
			<AlertBox>{formError}</AlertBox>
		{/if}

		{#if sku}
			<p class="text-sm text-light-two_d dark:text-dark-two_d">
				Stock actual:
				<span class="font-semibold text-light-two dark:text-dark-two">
					{formatNumber(sku.stock.cantidad)}
				</span>
				· mínimo {formatNumber(sku.stock.minimo)}
			</p>
		{/if}

		<fieldset class="grid gap-4 sm:grid-cols-2" disabled={isLoading}>
			<Select id="{id}-movimiento" label="Movimiento" bind:value={movimiento}>
				<option value="entrada">Entrada (llegan prendas)</option>
				<option value="salida">Salida (merma, pérdida)</option>
			</Select>
			<Input
				id="{id}-cantidad"
				label="Cantidad"
				bind:value={cantidad}
				error={fieldErrors.cantidad}
				aria-invalid={!!fieldErrors.cantidad}
				inputmode="numeric"
				autocomplete="off"
				placeholder="Ej. 5"
			/>
		</fieldset>

		{#if resultante !== null}
			<p
				role="status"
				class={[
					'text-sm',
					quedaNegativo
						? 'text-light-error dark:text-dark-error'
						: 'text-light-two dark:text-dark-two'
				]}
			>
				{#if quedaNegativo}
					No hay suficiente stock: la salida dejaría {formatNumber(resultante)}.
				{:else}
					El stock quedará en <strong>{formatNumber(resultante)}</strong>.
				{/if}
			</p>
		{/if}

		<fieldset disabled={isLoading}>
			<Input
				id="{id}-minimo"
				label="Nuevo stock mínimo (opcional)"
				bind:value={minimo}
				error={fieldErrors.minimo}
				aria-invalid={!!fieldErrors.minimo}
				inputmode="numeric"
				autocomplete="off"
				placeholder={sku ? String(sku.stock.minimo) : ''}
			/>
		</fieldset>
		<p class="text-xs text-light-two_d dark:text-dark-two_d">
			La cantidad se suma o resta al stock que tenga el SKU en ese momento, así no pisa las ventas
			que ocurran mientras tanto. Por debajo del mínimo la talla se marca con stock bajo.
		</p>
	</form>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
			<Button variant="outline" onclick={handleClose} disabled={isLoading} class="w-full sm:w-auto">
				Cancelar
			</Button>
			<Button
				type="submit"
				form={FORM_ID}
				loading={isLoading}
				disabled={!hasChanges || quedaNegativo}
				class="w-full sm:w-auto"
			>
				Guardar stock
			</Button>
		</div>
	{/snippet}
</Sheet>
