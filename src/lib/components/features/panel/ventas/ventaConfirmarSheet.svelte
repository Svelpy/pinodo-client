<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { AlertBox, Button, Sheet } from '#lib/components/ui/index.ts';
	import type { PagoLinea, Venta, VentaDetalle } from '#lib/interfaces/index.ts';
	import { errorService, ventaService } from '#lib/services/index.ts';
	import {
		alert,
		formatCurrency,
		formatVentaNumero,
		nuevoPago,
		validateSchemaDeep
	} from '#lib/utils/index.ts';
	import { createVentaConfirmarSchema } from '#lib/zod/index.ts';
	import VentaPagos from './ventaPagos.svelte';

	interface Props {
		/** Pedido pendiente a cobrar; null = cerrado */
		venta: Venta | VentaDetalle | null;
		onClose: () => void;
		/** Venta ya cobrada */
		onSaved: (venta: VentaDetalle) => void;
	}

	let { venta, onClose, onSaved }: Props = $props();

	let pagos = $state<PagoLinea[]>([nuevoPago()]);
	let pagaCon = $state('');
	let errores = $state<Record<string, string>>({});
	let submitError = $state('');
	let isLoading = $state(false);

	// Cada apertura parte de un cobro vacío
	$effect(() => {
		void venta;
		untrack(() => {
			pagos = [nuevoPago()];
			pagaCon = '';
			errores = {};
			submitError = '';
		});
	});

	// Los errores se borran al corregir los pagos
	$effect(() => {
		JSON.stringify(pagos);
		untrack(() => {
			if (Object.keys(errores).length > 0) errores = {};
		});
	});

	function handleClose() {
		if (!isLoading) onClose();
	}

	async function handleConfirm() {
		if (!venta || isLoading) return;
		const target = venta;
		const result = validateSchemaDeep(createVentaConfirmarSchema(target.total), {
			pagos: $state.snapshot(pagos)
		});
		if (!result.success) {
			errores = result.errors;
			return;
		}

		isLoading = true;
		submitError = '';
		try {
			// Se cobra tal como se ofreció: los pagos suman el total del pedido
			const cobrada = await ventaService.confirmar(target.id, { pagos: result.data.pagos });
			alert('success', `Venta ${formatVentaNumero(cobrada.numero)} cobrada.`);
			onSaved(cobrada);
			onClose();
		} catch (error) {
			submitError = errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}
</script>

<Sheet
	open={!!venta}
	title="Cobrar pedido"
	description={venta
		? `${formatVentaNumero(venta.numero)}${venta.referencia ? ` · ${venta.referencia}` : ''}`
		: undefined}
	onClose={handleClose}
	dismissible={!isLoading}
>
	{#if venta}
		<div class="space-y-4">
			<div
				class="flex items-baseline justify-between border border-light-one_d px-4 py-3 dark:border-dark-one_d"
			>
				<span class="text-sm text-light-two_d dark:text-dark-two_d">Total a cobrar</span>
				<span class="text-2xl font-bold text-light-two tabular-nums dark:text-dark-two">
					{formatCurrency(venta.total)}
				</span>
			</div>

			<VentaPagos bind:pagos bind:pagaCon total={venta.total} {errores} disabled={isLoading} />

			<p class="text-sm text-light-two_d dark:text-dark-two_d">
				Al cobrar se descuenta el stock; si alguna prenda ya no alcanza, no se cobrará. Se cobra con
				los precios con que se ofreció; para usar los de hoy,
				<a
					href={resolve('/panel/ventas/historial/[id]/editar', { id: venta.id })}
					class="font-medium text-light-accent underline underline-offset-2 dark:text-dark-accent"
				>
					edita el pedido</a
				>.
			</p>

			{#if submitError}
				<AlertBox>{submitError}</AlertBox>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" onclick={handleClose} disabled={isLoading}>Cancelar</Button>
			<Button onclick={handleConfirm} loading={isLoading}>
				Cobrar {venta ? formatCurrency(venta.total) : ''}
			</Button>
		</div>
	{/snippet}
</Sheet>
