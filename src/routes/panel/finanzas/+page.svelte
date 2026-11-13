<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import {
		FinanzasFilters,
		FinanzasRentabilidadList,
		FinanzasRentabilidadMeses,
		FinanzasRentabilidadResumen,
		FinanzasVentaList,
		FinanzasVentasResumen
	} from '#lib/components/features/panel/finanzas/index.ts';
	import { Button, Tabs } from '#lib/components/ui/index.ts';
	import {
		PAGINATION,
		RANGO_FECHA,
		REPORTE_FINANZAS,
		REPORTE_FINANZAS_LABEL,
		type ReporteFinanzas
	} from '#lib/constants/index.ts';
	import { DownloadIcon } from '#lib/icons/outline/index.ts';
	import type {
		FinanzasFiltros,
		FinanzasPeriodo,
		ReporteRentabilidad,
		ReporteVentas
	} from '#lib/interfaces/index.ts';
	import { errorService, finanzasService } from '#lib/services/index.ts';
	import {
		alert,
		descargarArchivo,
		finanzasFiltrosToParams,
		formatDateTime,
		formatPeriodo,
		nombreArchivoReporte
	} from '#lib/utils/index.ts';

	/** Query param con el reporte abierto, para recargar o compartir la pestaña */
	const REPORTE_PARAM = 'reporte';

	const REPORTE_TABS = Object.values(REPORTE_FINANZAS).map((value) => ({
		value,
		label: REPORTE_FINANZAS_LABEL[value]
	}));

	function esReporte(value: string | null): value is ReporteFinanzas {
		return Object.values(REPORTE_FINANZAS).some((reporte) => reporte === value);
	}

	let reporte = $state<ReporteFinanzas>(REPORTE_FINANZAS.VENTAS);
	let filtros = $state<FinanzasFiltros>({ rango: RANGO_FECHA.MES, desde: '', hasta: '' });

	// null = sin cargar para los filtros actuales
	let ventas = $state<ReporteVentas | null>(null);
	let rentabilidad = $state<ReporteRentabilidad | null>(null);
	let isLoading = $state(false);
	let loadError = $state('');
	let descargando = $state(false);

	// El detalle llega completo: se pagina en el navegador
	let ventasPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let rentabilidadPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let perPage = $state<number>(PAGINATION.DEFAULT_PER_PAGE);

	const periodo = $derived<FinanzasPeriodo | null>(
		(reporte === REPORTE_FINANZAS.VENTAS ? ventas : rentabilidad)?.periodo ?? null
	);

	let lastRequestId = 0;

	async function loadReporte() {
		const requestId = ++lastRequestId;
		const tipo = reporte;
		const params = finanzasFiltrosToParams(filtros);
		loadError = '';
		isLoading = true;
		try {
			if (tipo === REPORTE_FINANZAS.VENTAS) {
				const response = await finanzasService.ventas(params);
				if (requestId !== lastRequestId) return;
				ventas = response;
				ventasPage = PAGINATION.DEFAULT_PAGE;
			} else {
				const response = await finanzasService.rentabilidad(params);
				if (requestId !== lastRequestId) return;
				rentabilidad = response;
				rentabilidadPage = PAGINATION.DEFAULT_PAGE;
			}
		} catch (error) {
			if (requestId !== lastRequestId) return;
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	function applyFiltros(next: FinanzasFiltros) {
		filtros = next;
		// Los dos reportes quedan desactualizados; el otro se pide al abrir su pestaña
		ventas = null;
		rentabilidad = null;
		loadReporte();
	}

	function cambiarReporte(value: ReporteFinanzas) {
		reporte = value;
		const url = new URL(page.url.href);
		if (value === REPORTE_FINANZAS.VENTAS) url.searchParams.delete(REPORTE_PARAM);
		else url.searchParams.set(REPORTE_PARAM, value.toLowerCase());
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- misma ruta, solo cambia la query
		replaceState(url, page.state);

		const cargado = value === REPORTE_FINANZAS.VENTAS ? ventas : rentabilidad;
		if (cargado) {
			// Ya está para estos filtros: se descarta lo que estuviera pidiendo la otra pestaña
			lastRequestId++;
			isLoading = false;
			loadError = '';
		} else {
			loadReporte();
		}
	}

	function handlePerPageChange(value: number) {
		perPage = value;
		ventasPage = PAGINATION.DEFAULT_PAGE;
		rentabilidadPage = PAGINATION.DEFAULT_PAGE;
	}

	async function descargarExcel() {
		const tipo = reporte;
		const params = finanzasFiltrosToParams(filtros);
		descargando = true;
		try {
			const archivo =
				tipo === REPORTE_FINANZAS.VENTAS
					? await finanzasService.ventasExcel(params)
					: await finanzasService.rentabilidadExcel(params);
			descargarArchivo(archivo.blob, archivo.filename ?? nombreArchivoReporte(tipo, params));
		} catch (error) {
			alert('error', errorService.getMessage(error));
		} finally {
			descargando = false;
		}
	}

	onMount(() => {
		const param = page.url.searchParams.get(REPORTE_PARAM)?.toUpperCase() ?? null;
		if (esReporte(param)) reporte = param;
		loadReporte();
	});
</script>

<MainLayout title="Finanzas" noIndex class="container mx-auto space-y-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<FinanzasFilters {filtros} onChange={applyFiltros} />
		<Button
			variant="outline"
			loading={descargando}
			disabled={descargando}
			onclick={descargarExcel}
			class="w-full shrink-0 sm:w-auto"
		>
			{#snippet leftIcon()}<DownloadIcon class="size-5" />{/snippet}
			Descargar Excel
		</Button>
	</div>

	<Tabs
		id="finanzas-reporte"
		label="Reporte"
		options={REPORTE_TABS}
		value={reporte}
		onChange={cambiarReporte}
	>
		<div class="mt-4 space-y-4">
			{#if reporte === REPORTE_FINANZAS.VENTAS}
				<FinanzasVentasResumen
					resumen={ventas?.resumen ?? null}
					cobrado={ventas?.cobrado_por_metodo ?? null}
				/>
				<FinanzasVentaList
					lineas={ventas?.detalle ?? null}
					currentPage={ventasPage}
					{perPage}
					{isLoading}
					error={loadError}
					onPageChange={(value) => (ventasPage = value)}
					onPerPageChange={handlePerPageChange}
					onRetry={loadReporte}
				/>
			{:else}
				<FinanzasRentabilidadResumen resumen={rentabilidad?.resumen ?? null} />
				<FinanzasRentabilidadMeses meses={rentabilidad?.por_mes ?? null} />
				<FinanzasRentabilidadList
					skus={rentabilidad?.detalle ?? null}
					currentPage={rentabilidadPage}
					{perPage}
					{isLoading}
					error={loadError}
					onPageChange={(value) => (rentabilidadPage = value)}
					onPerPageChange={handlePerPageChange}
					onRetry={loadReporte}
				/>
			{/if}
		</div>
	</Tabs>

	<div class="space-y-1 text-xs text-light-two_d dark:text-dark-two_d">
		{#if periodo}
			<p>
				{periodo.sin_filtros ? 'Desde la primera venta: ' : 'Periodo: '}{formatPeriodo(periodo)}
				· Generado {formatDateTime(periodo.generado_at)}
			</p>
		{/if}
		<p>
			{#if reporte === REPORTE_FINANZAS.VENTAS}
				Solo ventas confirmadas, por su fecha de confirmación. Las anuladas no suman al total.
			{:else}
				Margen bruto = ingreso neto − costo de lo vendido. No incluye gastos: no es la utilidad
				neta.
			{/if}
		</p>
	</div>
</MainLayout>
