<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import {
		KardexFilters,
		KardexList,
		KardexSkuResumen
	} from '#lib/components/features/panel/kardex/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { PAGINATION, RANGO_FECHA } from '#lib/constants/index.ts';
	import type { KardexFiltros, MovimientoInventario, SkuNombre } from '#lib/interfaces/index.ts';
	import { errorService, kardexService, usuarioService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import {
		can,
		esUuid,
		fetchAllPages,
		formatFullName,
		kardexFiltrosToParams,
		skuNombreDesdeCosto
	} from '#lib/utils/index.ts';

	/** Query param con el SKU cuyo kardex se ve (lo usa también el enlace desde Valor del stock) */
	const SKU_PARAM = 'sku';

	const FILTROS_INICIALES: KardexFiltros = {
		rango: RANGO_FECHA.TODO,
		desde: '',
		hasta: '',
		tipo: null,
		motivo: null,
		user_id: null,
		sku_id: null
	};

	// Cada movimiento ya trae su responsable; la lista de usuarios solo alimenta el filtro, y solo
	// quien puede listar usuarios la tiene
	const puedeFiltrarUsuarios = $derived(can($currentRole, Module.USUARIO, Action.READ));

	let movimientos = $state<MovimientoInventario[]>([]);
	let currentPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let perPage = $state<number>(PAGINATION.DEFAULT_PER_PAGE);
	let totalPages = $state(1);
	let total = $state(0);
	let filtros = $state<KardexFiltros>({ ...FILTROS_INICIALES });
	let isLoading = $state(false);
	let loadError = $state('');

	let usuarios = $state<{ id: string; nombre: string }[] | null>(null);

	let buscandoCodigo = $state(false);
	let codigoError = $state('');

	/**
	 * Prenda del kardex abierto. Se conoce al buscarla por código de barras; si se abrió desde la URL
	 * (p. ej. desde el detalle de un movimiento), sale de sus movimientos.
	 */
	let skuElegido = $state<SkuNombre | null>(null);
	const skuKardex = $derived(filtros.sku_id ? (skuElegido ?? movimientos[0]?.sku ?? null) : null);

	// Sin recortes, el movimiento más reciente de la prenda dice cómo está hoy (stock, costo y valor)
	const ultimo = $derived(
		filtros.sku_id &&
			currentPage === PAGINATION.DEFAULT_PAGE &&
			filtros.rango === RANGO_FECHA.TODO &&
			!filtros.tipo &&
			!filtros.motivo &&
			!filtros.user_id
			? (movimientos[0] ?? null)
			: null
	);

	const filtrada = $derived(
		filtros.rango !== RANGO_FECHA.TODO ||
			!!filtros.tipo ||
			!!filtros.motivo ||
			!!filtros.user_id ||
			!!filtros.sku_id
	);

	let lastRequestId = 0;

	async function loadMovimientos(pageNumber: number) {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await kardexService.list({
				...kardexFiltrosToParams(filtros),
				page: pageNumber,
				per_page: perPage
			});
			if (requestId !== lastRequestId) return;
			movimientos = response.data;
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

	async function loadUsuarios() {
		try {
			const lista = await fetchAllPages((params) => usuarioService.list(params));
			usuarios = lista
				.map((usuario) => ({ id: usuario.id, nombre: formatFullName(usuario) }))
				.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
		} catch {
			// Sin la lista solo falta el filtro por responsable
			usuarios = null;
		}
	}

	function applyFiltros(next: KardexFiltros) {
		filtros = next;
		// Se limpia para mostrar el esqueleto y no resultados del filtro anterior
		movimientos = [];
		loadMovimientos(PAGINATION.DEFAULT_PAGE);
	}

	function handlePerPageChange(value: number) {
		perPage = value;
		loadMovimientos(PAGINATION.DEFAULT_PAGE);
	}

	/** Abre el kardex de una prenda (o vuelve a todas) y lo deja en la URL para recargar o compartir */
	function setSku(skuId: string | null, sku: SkuNombre | null = null) {
		skuElegido = sku;
		const url = new URL(page.url.href);
		if (skuId) url.searchParams.set(SKU_PARAM, skuId);
		else url.searchParams.delete(SKU_PARAM);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- misma ruta, solo cambia la query
		replaceState(url, page.state);
		applyFiltros({ ...filtros, sku_id: skuId });
	}

	async function buscarCodigo(codigo: string) {
		codigoError = '';
		buscandoCodigo = true;
		try {
			// Coincidencia exacta: a lo sumo un SKU activo
			const { data } = await kardexService.costos({ codigo_barras: codigo, per_page: 1 });
			const encontrado = data[0];
			if (encontrado) setSku(encontrado.sku_id, skuNombreDesdeCosto(encontrado));
			else codigoError = 'No hay ninguna prenda activa con ese código de barras.';
		} catch (error) {
			codigoError = errorService.getMessage(error);
		} finally {
			buscandoCodigo = false;
		}
	}

	onMount(() => {
		const skuParam = page.url.searchParams.get(SKU_PARAM);
		if (esUuid(skuParam)) filtros.sku_id = skuParam;
		loadMovimientos(PAGINATION.DEFAULT_PAGE);
		if (puedeFiltrarUsuarios) loadUsuarios();
	});
</script>

<MainLayout title="Kardex" noIndex class="container mx-auto space-y-4">
	<KardexFilters
		{filtros}
		{usuarios}
		onChange={applyFiltros}
		onBuscarCodigo={buscarCodigo}
		{buscandoCodigo}
		{codigoError}
	/>

	{#if filtros.sku_id}
		<KardexSkuResumen sku={skuKardex} {ultimo} onClear={() => setSku(null)} />
	{/if}

	<KardexList
		{movimientos}
		mostrarSku={!filtros.sku_id}
		{filtrada}
		{currentPage}
		{totalPages}
		{perPage}
		{total}
		{isLoading}
		error={loadError}
		onPageChange={loadMovimientos}
		onPerPageChange={handlePerPageChange}
		onRetry={() => loadMovimientos(currentPage)}
	/>
</MainLayout>
