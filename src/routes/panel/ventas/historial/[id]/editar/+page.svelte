<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { VentaCajaSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState } from '#lib/components/ui/index.ts';
	import { VentaCaja } from '#lib/components/features/panel/ventas/index.ts';
	import { VENTA_ESTADO } from '#lib/constants/index.ts';
	import {
		AlertTriangleIcon,
		ArrowLeftIcon,
		LockIcon,
		RefreshIcon
	} from '#lib/icons/outline/index.ts';
	import { ErrorCode, type CarritoLinea, type VentaDetalle } from '#lib/interfaces/index.ts';
	import { AppError, errorService, skuService, ventaService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import {
		alert,
		formatVentaNumero,
		lineasDesdeVenta,
		puedeGestionarPendiente
	} from '#lib/utils/index.ts';

	const ventaId = $derived(page.params.id ?? '');
	const puedeEditar = $derived(puedeGestionarPendiente($currentRole));
	const detalleHref = $derived(resolve('/panel/ventas/historial/[id]', { id: ventaId }));

	let venta = $state<VentaDetalle | null>(null);
	let lineas = $state<CarritoLinea[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');
	let notFound = $state(false);

	/**
	 * Carga el pedido y, para cada producto, el inventario de hoy: aporta el stock disponible y el
	 * precio actual de cada prenda (la venta solo guarda el precio con que se ofreció).
	 */
	async function load() {
		isLoading = true;
		loadError = '';
		notFound = false;
		try {
			const detalle = await ventaService.get(ventaId);
			if (detalle.estado !== VENTA_ESTADO.PENDIENTE) {
				alert('info', 'Solo se pueden editar pedidos pendientes.');
				await goto(resolve('/panel/ventas/historial/[id]', { id: detalle.id }), {
					replaceState: true
				});
				return;
			}
			const nombres = [...new Set(detalle.items.map((item) => item.producto_nombre))];
			const inventarios = await Promise.all(
				nombres.map((nombre) => skuService.inventario({ nombre, per_page: 100 }))
			);
			lineas = lineasDesdeVenta(
				detalle,
				inventarios.flatMap((response) => response.data)
			);
			venta = detalle;
		} catch (error) {
			if (error instanceof AppError && error.is(ErrorCode.RESOURCE_NOT_FOUND)) notFound = true;
			else loadError = errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}

	function handleGuardado(actualizada: VentaDetalle, cobrada: boolean) {
		alert(
			'success',
			cobrada
				? `Venta ${formatVentaNumero(actualizada.numero)} cobrada.`
				: `Pedido ${formatVentaNumero(actualizada.numero)} actualizado.`
		);
		goto(resolve('/panel/ventas/historial/[id]', { id: actualizada.id }));
	}

	onMount(() => {
		if (puedeEditar) load();
		else isLoading = false;
	});
</script>

<MainLayout
	title={venta ? `Editar pedido ${formatVentaNumero(venta.numero)}` : 'Editar pedido'}
	noIndex
	class="mx-auto max-w-screen-2xl space-y-4"
>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<Button variant="ghost" size="sm" href={detalleHref}>
			{#snippet leftIcon()}<ArrowLeftIcon class="size-4" />{/snippet}
			Volver al pedido
		</Button>
		{#if venta}
			<p class="text-sm text-light-two_d dark:text-dark-two_d">
				Editando el pedido
				<span class="font-semibold text-light-two dark:text-dark-two">
					{formatVentaNumero(venta.numero)}
				</span>{venta.referencia ? ` de ${venta.referencia}` : ''}
			</p>
		{/if}
	</div>

	{#if !puedeEditar}
		<div class="border border-light-one_d dark:border-dark-one_d">
			<EmptyState icon={LockIcon} title="Tu rol no puede editar pedidos" />
		</div>
	{:else if isLoading}
		<VentaCajaSkeleton />
	{:else if notFound}
		<div class="border border-light-one_d dark:border-dark-one_d">
			<EmptyState
				icon={AlertTriangleIcon}
				title="Pedido no encontrado"
				description="No existe o no tienes acceso a él."
			>
				<Button variant="outline" href={resolve('/panel/ventas/historial')}>Ir al historial</Button>
			</EmptyState>
		</div>
	{:else if loadError}
		<div class="border border-light-one_d dark:border-dark-one_d">
			<EmptyState
				icon={AlertTriangleIcon}
				title="No se pudo cargar el pedido"
				description={loadError}
			>
				<Button variant="outline" size="sm" onclick={load}>
					{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
					Reintentar
				</Button>
			</EmptyState>
		</div>
	{:else if venta}
		<VentaCaja {venta} lineasIniciales={lineas} onGuardado={handleGuardado} />
	{/if}
</MainLayout>
