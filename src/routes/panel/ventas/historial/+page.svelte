<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { Button, Tabs } from '#lib/components/ui/index.ts';
	import {
		VentaCancelarModal,
		VentaConfirmarSheet,
		VentaFilters,
		VentaList,
		VentaResumen
	} from '#lib/components/features/panel/ventas/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import {
		PAGINATION,
		RANGO_FECHA,
		RANGO_FECHA_LABEL,
		VENTA_ESTADO,
		type VentaEstado
	} from '#lib/constants/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type {
		Venta,
		VentaDetalle,
		VentaFiltros,
		VentaResumen as Resumen
	} from '#lib/interfaces/index.ts';
	import { errorService, usuarioService, ventaService } from '#lib/services/index.ts';
	import { currentRole, currentUserStore } from '#lib/stores/index.ts';
	import {
		can,
		fetchAllPages,
		formatDate,
		formatFullName,
		puedeRegistrarVenta,
		ventaDesdeDetalle,
		ventaFiltrosToParams
	} from '#lib/utils/index.ts';

	type EstadoTab = VentaEstado | 'TODAS';

	const ESTADO_TABS: { value: EstadoTab; label: string }[] = [
		{ value: 'TODAS', label: 'Todas' },
		{ value: VENTA_ESTADO.PENDIENTE, label: 'Pendientes' },
		{ value: VENTA_ESTADO.CONFIRMADA, label: 'Cobradas' },
		{ value: VENTA_ESTADO.CANCELADA, label: 'Canceladas' }
	];

	const FILTROS_INICIALES: VentaFiltros = {
		rango: RANGO_FECHA.HOY,
		desde: '',
		hasta: '',
		estado: null,
		canal: null,
		metodo_pago: null,
		numero: '',
		created_by: null
	};

	const puedeVender = $derived(puedeRegistrarVenta($currentRole));
	// Solo quien puede listar usuarios ve (y filtra por) quién registró cada venta
	const puedeVerVendedores = $derived(can($currentRole, Module.USUARIO, Action.READ));

	let ventas = $state<Venta[]>([]);
	let resumen = $state<Resumen | null>(null);
	let currentPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let perPage = $state<number>(PAGINATION.DEFAULT_PER_PAGE);
	let totalPages = $state(1);
	let total = $state(0);
	let filtros = $state<VentaFiltros>({ ...FILTROS_INICIALES });
	let isLoading = $state(false);
	let loadError = $state('');

	let vendedores = $state<{ id: string; nombre: string }[] | null>(null);
	const vendedoresMap = $derived(
		vendedores ? new Map(vendedores.map((vendedor) => [vendedor.id, vendedor.nombre])) : null
	);

	let cobrando = $state<Venta | null>(null);
	let cancelando = $state<Venta | null>(null);

	const filtrada = $derived(
		filtros.rango !== RANGO_FECHA.TODO ||
			!!filtros.estado ||
			!!filtros.canal ||
			!!filtros.metodo_pago ||
			!!filtros.numero ||
			!!filtros.created_by
	);

	const periodo = $derived.by(() => {
		if (filtros.rango !== RANGO_FECHA.PERSONALIZADO) return RANGO_FECHA_LABEL[filtros.rango];
		if (filtros.desde && filtros.hasta) {
			return filtros.desde === filtros.hasta
				? formatDate(filtros.desde)
				: `${formatDate(filtros.desde)} – ${formatDate(filtros.hasta)}`;
		}
		return filtros.desde
			? `Desde ${formatDate(filtros.desde)}`
			: 'Hasta ' + formatDate(filtros.hasta);
	});

	let lastRequestId = 0;

	async function loadVentas(page: number) {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await ventaService.list({
				...ventaFiltrosToParams(filtros),
				page,
				per_page: perPage
			});
			if (requestId !== lastRequestId) return;
			ventas = response.data;
			resumen = response.resumen;
			currentPage = response.page;
			perPage = response.per_page;
			totalPages = Math.max(1, response.total_pages);
			total = response.total;
		} catch (error) {
			if (requestId !== lastRequestId) return;
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	async function loadVendedores() {
		try {
			const usuarios = await fetchAllPages((params) => usuarioService.list(params));
			vendedores = usuarios
				.map((usuario) => ({ id: usuario.id, nombre: formatFullName(usuario) }))
				.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
		} catch {
			// Es solo informativo: sin la lista no se muestra la columna ni el filtro
			vendedores = null;
		}
	}

	function applyFiltros(next: VentaFiltros) {
		filtros = next;
		// Se limpia para mostrar el esqueleto y no resultados del filtro anterior
		ventas = [];
		loadVentas(PAGINATION.DEFAULT_PAGE);
	}

	function handlePerPageChange(value: number) {
		perPage = value;
		loadVentas(PAGINATION.DEFAULT_PAGE);
	}

	// Cobrar o cancelar cambia la fila y el resumen de caja (que calcula la API): se actualiza la
	// fila al instante y se vuelve a pedir la página para refrescar los totales
	function handleActualizada(detalle: VentaDetalle) {
		const actualizada = ventaDesdeDetalle(detalle);
		if (filtros.estado && actualizada.estado !== filtros.estado) {
			ventas = ventas.filter((venta) => venta.id !== actualizada.id);
		} else {
			ventas = ventas.map((venta) => (venta.id === actualizada.id ? actualizada : venta));
		}
		loadVentas(currentPage);
	}

	onMount(() => {
		loadVentas(PAGINATION.DEFAULT_PAGE);
		if (puedeVerVendedores) loadVendedores();
	});

	const currentUserName = $derived($currentUserStore ? formatFullName($currentUserStore) : null);
</script>

<MainLayout title="Historial de ventas" noIndex class="container mx-auto space-y-4">
	<div class="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
		<VentaFilters {filtros} {vendedores} onChange={applyFiltros} />
		{#if puedeVender}
			<Button href={resolve('/panel/ventas')} class="w-full shrink-0 sm:w-auto">
				{#snippet leftIcon()}<PlusIcon class="size-5" />{/snippet}
				Nueva venta
			</Button>
		{/if}
	</div>

	<VentaResumen {resumen} {periodo} />

	<Tabs
		id="ventas-estado"
		label="Estado de las ventas"
		options={ESTADO_TABS}
		value={filtros.estado ?? 'TODAS'}
		onChange={(value) => applyFiltros({ ...filtros, estado: value === 'TODAS' ? null : value })}
		count={isLoading && ventas.length === 0 ? null : total}
	>
		<VentaList
			{ventas}
			vendedores={vendedoresMap}
			{filtrada}
			{currentPage}
			{totalPages}
			{perPage}
			{total}
			{isLoading}
			error={loadError}
			onPageChange={loadVentas}
			onPerPageChange={handlePerPageChange}
			onRetry={() => loadVentas(currentPage)}
			onCobrar={(venta) => (cobrando = venta)}
			onCancelar={(venta) => (cancelando = venta)}
		/>
	</Tabs>

	<!-- Un cajero solo accede a las ventas que registró -->
	{#if currentUserName && !puedeVerVendedores}
		<p class="text-xs text-light-two_d dark:text-dark-two_d">
			Ves las ventas registradas por ti ({currentUserName}).
		</p>
	{/if}

	<VentaConfirmarSheet
		venta={cobrando}
		onClose={() => (cobrando = null)}
		onSaved={handleActualizada}
	/>
	<VentaCancelarModal
		venta={cancelando}
		onClose={() => (cancelando = null)}
		onCancelled={handleActualizada}
	/>
</MainLayout>
