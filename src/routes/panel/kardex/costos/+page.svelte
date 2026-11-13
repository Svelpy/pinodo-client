<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import {
		KardexCostoFilters,
		KardexCostoList
	} from '#lib/components/features/panel/kardex/index.ts';
	import { PAGINATION } from '#lib/constants/index.ts';
	import type { CostoFiltros, CostoSku } from '#lib/interfaces/index.ts';
	import { errorService, kardexService } from '#lib/services/index.ts';

	let costos = $state<CostoSku[]>([]);
	let currentPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let perPage = $state<number>(PAGINATION.DEFAULT_PER_PAGE);
	let totalPages = $state(1);
	let total = $state(0);
	let filtros = $state<CostoFiltros>({ nombre: '', codigo_barras: '' });
	let isLoading = $state(false);
	let loadError = $state('');

	const filtrada = $derived(!!filtros.nombre.trim() || !!filtros.codigo_barras.trim());

	let lastRequestId = 0;

	async function loadCostos(pageNumber: number) {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await kardexService.costos({
				...filtros,
				page: pageNumber,
				per_page: perPage
			});
			if (requestId !== lastRequestId) return;
			costos = response.data;
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

	function applyFiltros(next: CostoFiltros) {
		filtros = next;
		// Se limpia para mostrar el esqueleto y no resultados del filtro anterior
		costos = [];
		loadCostos(PAGINATION.DEFAULT_PAGE);
	}

	function handlePerPageChange(value: number) {
		perPage = value;
		loadCostos(PAGINATION.DEFAULT_PAGE);
	}

	onMount(() => loadCostos(PAGINATION.DEFAULT_PAGE));
</script>

<MainLayout title="Valor del stock" noIndex class="container mx-auto space-y-4">
	<KardexCostoFilters {filtros} onChange={applyFiltros} />

	<KardexCostoList
		{costos}
		{filtrada}
		{currentPage}
		{totalPages}
		{perPage}
		{total}
		{isLoading}
		error={loadError}
		onPageChange={loadCostos}
		onPerPageChange={handlePerPageChange}
		onRetry={() => loadCostos(currentPage)}
	/>

	<p class="text-xs text-light-two_d dark:text-dark-two_d">
		Valor = stock × costo promedio de cada SKU activo. El costo se corrige editando el SKU.
	</p>
</MainLayout>
