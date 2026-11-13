<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import {
		KardexAjusteFilters,
		KardexAjusteList
	} from '#lib/components/features/panel/kardex/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { PAGINATION, RANGO_FECHA } from '#lib/constants/index.ts';
	import type { AjusteFiltros, AjusteInventario } from '#lib/interfaces/index.ts';
	import { ajusteInventarioService, errorService, usuarioService } from '#lib/services/index.ts';
	import { currentRole, currentUserStore } from '#lib/stores/index.ts';
	import { ajusteFiltrosToParams, can, fetchAllPages, formatFullName } from '#lib/utils/index.ts';

	const FILTROS_INICIALES: AjusteFiltros = {
		rango: RANGO_FECHA.TODO,
		desde: '',
		hasta: '',
		motivo: null,
		created_by: null
	};

	// La lista solo trae el id de quien registró el ajuste: el nombre sale de los usuarios
	const puedeVerUsuarios = $derived(can($currentRole, Module.USUARIO, Action.READ));

	let ajustes = $state<AjusteInventario[]>([]);
	let currentPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let perPage = $state<number>(PAGINATION.DEFAULT_PER_PAGE);
	let totalPages = $state(1);
	let total = $state(0);
	let filtros = $state<AjusteFiltros>({ ...FILTROS_INICIALES });
	let isLoading = $state(false);
	let loadError = $state('');

	let usuarios = $state<{ id: string; nombre: string }[] | null>(null);
	// El propio usuario siempre se conoce, aunque su rol no liste a los de su nivel
	const nombres = $derived(
		new Map([
			...(usuarios ?? []).map((usuario) => [usuario.id, usuario.nombre] as const),
			...($currentUserStore
				? [[$currentUserStore.id, formatFullName($currentUserStore)] as const]
				: [])
		])
	);

	/** Quién registró el ajuste: la carga inicial la genera el sistema */
	const registradoPor = $derived(
		puedeVerUsuarios
			? (ajuste: AjusteInventario) =>
					ajuste.created_by === null ? 'Sistema' : nombres.get(ajuste.created_by)
			: null
	);

	const filtrada = $derived(
		filtros.rango !== RANGO_FECHA.TODO || !!filtros.motivo || !!filtros.created_by
	);

	let lastRequestId = 0;

	async function loadAjustes(pageNumber: number) {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await ajusteInventarioService.list({
				...ajusteFiltrosToParams(filtros),
				page: pageNumber,
				per_page: perPage
			});
			if (requestId !== lastRequestId) return;
			ajustes = response.data;
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
			// Es solo informativo: sin la lista no hay filtro y los nombres quedan en "—"
			usuarios = null;
		}
	}

	function applyFiltros(next: AjusteFiltros) {
		filtros = next;
		// Se limpia para mostrar el esqueleto y no resultados del filtro anterior
		ajustes = [];
		loadAjustes(PAGINATION.DEFAULT_PAGE);
	}

	function handlePerPageChange(value: number) {
		perPage = value;
		loadAjustes(PAGINATION.DEFAULT_PAGE);
	}

	onMount(() => {
		loadAjustes(PAGINATION.DEFAULT_PAGE);
		if (puedeVerUsuarios) loadUsuarios();
	});
</script>

<MainLayout title="Ajustes de inventario" noIndex class="container mx-auto space-y-4">
	<KardexAjusteFilters {filtros} {usuarios} onChange={applyFiltros} />

	<KardexAjusteList
		{ajustes}
		{registradoPor}
		{filtrada}
		{currentPage}
		{totalPages}
		{perPage}
		{total}
		{isLoading}
		error={loadError}
		onPageChange={loadAjustes}
		onPerPageChange={handlePerPageChange}
		onRetry={() => loadAjustes(currentPage)}
	/>
</MainLayout>
