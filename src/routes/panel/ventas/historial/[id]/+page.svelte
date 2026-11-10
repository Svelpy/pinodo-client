<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { VentaDetalleSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState } from '#lib/components/ui/index.ts';
	import {
		VentaCancelarModal,
		VentaComprobante,
		VentaConfirmarSheet,
		VentaDetalle
	} from '#lib/components/features/panel/ventas/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { VENTA_ESTADO } from '#lib/constants/index.ts';
	import {
		AlertTriangleIcon,
		ArrowLeftIcon,
		CheckCircleIcon,
		PencilIcon,
		PrinterIcon,
		RefreshIcon,
		WhatsappIcon,
		XIcon
	} from '#lib/icons/outline/index.ts';
	import { ErrorCode, type VentaDetalle as Detalle } from '#lib/interfaces/index.ts';
	import { AppError, errorService, usuarioService, ventaService } from '#lib/services/index.ts';
	import { currentRole, currentTiendaStore, currentUserStore } from '#lib/stores/index.ts';
	import {
		accionesVenta,
		buildWhatsappUrl,
		can,
		fetchAllPages,
		formatFullName,
		formatVentaNumero
	} from '#lib/utils/index.ts';

	const ventaId = $derived(page.params.id ?? '');

	let venta = $state<Detalle | null>(null);
	let isLoading = $state(true);
	let loadError = $state('');
	let notFound = $state(false);
	let vendedor = $state<string | null>(null);

	let cobrando = $state<Detalle | null>(null);
	let cancelando = $state<Detalle | null>(null);

	const acciones = $derived(
		venta ? accionesVenta(venta, $currentRole) : { editar: false, cobrar: false, cancelar: false }
	);
	const esPedido = $derived(venta?.estado === VENTA_ESTADO.PENDIENTE);

	async function load() {
		isLoading = true;
		loadError = '';
		notFound = false;
		try {
			venta = await ventaService.get(ventaId);
			resolverVendedor(venta.created_by);
		} catch (error) {
			if (error instanceof AppError && error.is(ErrorCode.RESOURCE_NOT_FOUND)) notFound = true;
			else loadError = errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}

	// Quién la registró: el propio usuario o, si puede consultar usuarios, cualquier otro
	async function resolverVendedor(userId: string) {
		const yo = $currentUserStore;
		if (yo?.id === userId) {
			vendedor = formatFullName(yo);
			return;
		}
		if (!can($currentRole, Module.USUARIO, Action.READ)) return;
		try {
			const usuarios = await fetchAllPages((params) => usuarioService.list(params));
			const usuario = usuarios.find((item) => item.id === userId);
			if (usuario) vendedor = formatFullName(usuario);
		} catch {
			// Usuario eliminado o sin acceso: no se muestra
		}
	}

	onMount(load);
</script>

<MainLayout
	title={venta ? `${esPedido ? 'Pedido' : 'Venta'} ${formatVentaNumero(venta.numero)}` : 'Venta'}
	noIndex
	class="container mx-auto space-y-4"
>
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-2">
			<Button
				variant="ghost"
				size="sm"
				href={resolve('/panel/ventas/historial')}
				aria-label="Volver al historial"
			>
				{#snippet leftIcon()}<ArrowLeftIcon class="size-4" />{/snippet}
			</Button>
			{#if venta}
				<h2 class="text-xl font-bold text-light-two tabular-nums dark:text-dark-two">
					{esPedido ? 'Pedido' : 'Venta'}
					{formatVentaNumero(venta.numero)}
				</h2>
			{/if}
		</div>

		{#if venta}
			<div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
				{#if acciones.cobrar}
					<Button onclick={() => (cobrando = venta)} class="col-span-2 sm:order-last">
						{#snippet leftIcon()}<CheckCircleIcon class="size-4" />{/snippet}
						Cobrar
					</Button>
				{/if}
				{#if acciones.editar}
					<Button
						variant="outline"
						href={resolve('/panel/ventas/historial/[id]/editar', { id: venta.id })}
					>
						{#snippet leftIcon()}<PencilIcon class="size-4" />{/snippet}
						Editar
					</Button>
				{/if}
				<Button
					variant="outline"
					href={buildWhatsappUrl(venta, $currentTiendaStore?.nombre_tienda)}
					target="_blank"
					rel="noopener noreferrer"
				>
					{#snippet leftIcon()}<WhatsappIcon class="size-4" />{/snippet}
					WhatsApp
				</Button>
				<Button variant="outline" onclick={() => window.print()}>
					{#snippet leftIcon()}<PrinterIcon class="size-4" />{/snippet}
					Imprimir
				</Button>
				{#if acciones.cancelar}
					<Button variant="ghost" onclick={() => (cancelando = venta)}>
						{#snippet leftIcon()}<XIcon class="size-4" />{/snippet}
						{venta.estado === VENTA_ESTADO.CONFIRMADA ? 'Anular' : 'Cancelar'}
					</Button>
				{/if}
			</div>
		{/if}
	</div>

	{#if isLoading && !venta}
		<VentaDetalleSkeleton />
	{:else if notFound}
		<div class="border border-light-one_d dark:border-dark-one_d">
			<EmptyState
				icon={AlertTriangleIcon}
				title="Venta no encontrada"
				description="No existe o no tienes acceso a ella."
			>
				<Button variant="outline" href={resolve('/panel/ventas/historial')}>Ir al historial</Button>
			</EmptyState>
		</div>
	{:else if loadError && !venta}
		<div class="border border-light-one_d dark:border-dark-one_d">
			<EmptyState
				icon={AlertTriangleIcon}
				title="No se pudo cargar la venta"
				description={loadError}
			>
				<Button variant="outline" size="sm" onclick={load}>
					{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
					Reintentar
				</Button>
			</EmptyState>
		</div>
	{:else if venta}
		<VentaDetalle {venta} {vendedor} />
		<VentaComprobante {venta} {vendedor} />
	{/if}

	<VentaConfirmarSheet
		venta={cobrando}
		onClose={() => (cobrando = null)}
		onSaved={(actualizada) => (venta = actualizada)}
	/>
	<VentaCancelarModal
		venta={cancelando}
		onClose={() => (cancelando = null)}
		onCancelled={(actualizada) => (venta = actualizada)}
	/>
</MainLayout>
