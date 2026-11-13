<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import {
		KardexDetalleSheet,
		KardexFilters,
		KardexList,
		KardexSkuResumen
	} from '#lib/components/features/panel/kardex/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { PAGINATION, RANGO_FECHA } from '#lib/constants/index.ts';
	import type { KardexFiltros, MovimientoInventario, SkuNombre } from '#lib/interfaces/index.ts';
	import { errorService, kardexService, skuService, usuarioService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import {
		can,
		esUuid,
		fetchAllPages,
		formatFullName,
		kardexFiltrosToParams,
		skuNombreDesdeInventario
	} from '#lib/utils/index.ts';

	/** Query param con el SKU cuyo kardex se ve (lo usa también el enlace desde Valor del stock) */
	const SKU_PARAM = 'sku';

	const FILTROS_INICIALES: KardexFiltros = {
		rango: RANGO_FECHA.TODO,
		desde: '',
		hasta: '',
		tipo: null,
		created_by: null,
		sku_id: null
	};

	// Solo quien puede listar usuarios ve (y filtra por) quién originó cada movimiento
	const puedeVerUsuarios = $derived(can($currentRole, Module.USUARIO, Action.READ));

	let movimientos = $state<MovimientoInventario[]>([]);
	let currentPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let perPage = $state<number>(PAGINATION.DEFAULT_PER_PAGE);
	let totalPages = $state(1);
	let total = $state(0);
	let filtros = $state<KardexFiltros>({ ...FILTROS_INICIALES });
	let isLoading = $state(false);
	let loadError = $state('');

	// Los movimientos solo traen el id del SKU: el nombre sale del inventario de SKUs activos
	let skus = $state.raw<ReadonlyMap<string, SkuNombre>>(new Map());

	let usuarios = $state<{ id: string; nombre: string }[] | null>(null);
	const usuariosMap = $derived(
		usuarios ? new Map(usuarios.map((usuario) => [usuario.id, usuario.nombre])) : null
	);

	let seleccionado = $state<MovimientoInventario | null>(null);
	let buscandoCodigo = $state(false);
	let codigoError = $state('');

	const filtrada = $derived(
		filtros.rango !== RANGO_FECHA.TODO || !!filtros.tipo || !!filtros.created_by || !!filtros.sku_id
	);

	// El stock de hoy viene en cada movimiento; en el kardex de un SKU todos son del mismo
	const skuActual = $derived(filtros.sku_id ? movimientos[0]?.sku : undefined);

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

	async function loadSkus() {
		try {
			const inventario = await fetchAllPages((params) => skuService.inventario(params));
			skus = new Map(inventario.map((sku) => [sku.id, skuNombreDesdeInventario(sku)]));
		} catch {
			// Sin el inventario las filas muestran solo el código de barras
		}
	}

	async function loadUsuarios() {
		try {
			const lista = await fetchAllPages((params) => usuarioService.list(params));
			usuarios = lista
				.map((usuario) => ({ id: usuario.id, nombre: formatFullName(usuario) }))
				.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
		} catch {
			// Es solo informativo: sin la lista no se muestra la columna ni el filtro
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

	/** Cambia el SKU del kardex y lo deja en la URL para poder recargar o compartir la vista */
	function setSku(skuId: string | null) {
		const url = new URL(page.url.href);
		if (skuId) url.searchParams.set(SKU_PARAM, skuId);
		else url.searchParams.delete(SKU_PARAM);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- misma ruta, solo cambia la query
		replaceState(url, page.state);
		applyFiltros({ ...filtros, sku_id: skuId });
	}

	function handleVerKardex(skuId: string) {
		seleccionado = null;
		setSku(skuId);
	}

	async function buscarCodigo(codigo: string) {
		codigoError = '';
		buscandoCodigo = true;
		try {
			let skuId = [...skus].find(([, sku]) => sku.codigo_barras === codigo)?.[0];
			if (!skuId) {
				// Puede ser un SKU creado después de cargar el inventario
				const { data } = await skuService.inventario({ codigo_barras: codigo, per_page: 1 });
				const sku = data[0];
				if (sku) {
					skuId = sku.id;
					skus = new Map([...skus, [sku.id, skuNombreDesdeInventario(sku)]]);
				}
			}
			if (skuId) setSku(skuId);
			else codigoError = 'No hay ningún SKU con ese código de barras.';
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
		loadSkus();
		if (puedeVerUsuarios) loadUsuarios();
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
		<KardexSkuResumen
			sku={skus.get(filtros.sku_id)}
			codigoBarras={skuActual?.codigo_barras}
			stock={skuActual?.stock ?? null}
			onClear={() => setSku(null)}
		/>
	{/if}

	<KardexList
		{movimientos}
		{skus}
		usuarios={usuariosMap}
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
		onSelect={(movimiento) => (seleccionado = movimiento)}
	/>

	<KardexDetalleSheet
		movimiento={seleccionado}
		sku={seleccionado ? skus.get(seleccionado.sku_id) : undefined}
		usuario={seleccionado?.created_by ? usuariosMap?.get(seleccionado.created_by) : undefined}
		onClose={() => (seleccionado = null)}
		onVerKardex={filtros.sku_id ? undefined : handleVerKardex}
	/>
</MainLayout>
