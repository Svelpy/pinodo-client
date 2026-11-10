<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { PercentIcon, ScanBarcodeIcon, SearchIcon, XIcon } from '#lib/icons/outline/index.ts';
	import type { CajaAviso, SkuInventario } from '#lib/interfaces/index.ts';
	import { errorService, skuService } from '#lib/services/index.ts';
	import {
		BUSQUEDA_DEBOUNCE_MS,
		BUSQUEDA_MIN_CHARS,
		clickOutside,
		esCodigoBarras,
		estadoStockSku
	} from '#lib/utils/index.ts';
	import { VENTA_LIMITS } from '#lib/zod/index.ts';
	import VentaSugerencias, { sugerenciaOptionId } from './ventaSugerencias.svelte';

	interface Props {
		/** Unidades de cada SKU que ya están en el carrito */
		enCarrito: ReadonlyMap<string, number>;
		/** Mensaje bajo el campo tras agregar o escanear (se anuncia a lectores de pantalla) */
		aviso?: CajaAviso | null;
		/** No se puede agregar (sin permiso o con un cobro en curso) */
		disabled?: boolean;
		/** Se eligió un SKU (de la lista o por su código exacto) */
		onAgregar: (sku: SkuInventario) => void;
		/** Llegaron SKUs de la API: el carrito actualiza su stock y precio */
		onResultados?: (skus: SkuInventario[]) => void;
		/** Avisos propios de la búsqueda (p. ej. un código escaneado que no existe); null los borra */
		onAviso?: (aviso: CajaAviso | null) => void;
		/** Abre el escáner con la cámara; no se pasa si el navegador no lo soporta */
		onScan?: () => void;
	}

	let {
		enCarrito,
		aviso = null,
		disabled = false,
		onAgregar,
		onResultados,
		onAviso,
		onScan
	}: Props = $props();

	const id = $props.id();
	const LISTBOX_ID = `${id}-sugerencias`;
	const PER_PAGE = 20;

	let input = $state<HTMLInputElement>();
	let texto = $state('');
	let enRebaja = $state(false);
	let abierto = $state(false);

	// Resultados de la búsqueda por nombre (o la lista inicial, sin texto)
	let skus = $state<SkuInventario[]>([]);
	let page = $state(1);
	let totalPages = $state(1);
	let isLoading = $state(false);
	let error = $state('');
	let mensaje = $state('');
	let activoId = $state<string | null>(null);
	// Lo último que se pidió por nombre, para "Cargar más" y para refrescar
	let consulta: string | null = null;
	let buscandoCodigo = $state(false);

	let timer: ReturnType<typeof setTimeout> | undefined;
	let lastRequestId = 0;

	const elegibles = $derived(
		skus.filter((sku) => !disabled && !estadoStockSku(sku, enCarrito.get(sku.id) ?? 0).agotado)
	);
	const mostrarLista = $derived(
		abierto && (isLoading || !!error || skus.length > 0 || mensaje !== '')
	);
	const activeDescendant = $derived(
		mostrarLista && activoId ? sugerenciaOptionId(LISTBOX_ID, activoId) : undefined
	);

	/** Pone el foco en el campo para el siguiente escaneo */
	export function focus() {
		input?.focus();
		input?.select();
	}

	/** Vuelve a pedir la última búsqueda (p. ej. tras cobrar, para mostrar el stock nuevo) */
	export function refrescar() {
		if (consulta !== null) buscarNombre(consulta);
	}

	function primerElegible() {
		activoId = elegibles[0]?.id ?? null;
	}

	async function buscarNombre(nombre: string, pagina = 1) {
		const requestId = ++lastRequestId;
		consulta = nombre;
		error = '';
		isLoading = true;
		if (pagina === 1) mensaje = '';
		try {
			const response = await skuService.inventario({
				page: pagina,
				per_page: PER_PAGE,
				nombre: nombre || undefined,
				en_rebaja: enRebaja || undefined
			});
			if (requestId !== lastRequestId) return;
			skus = pagina > 1 ? [...skus, ...response.data] : response.data;
			page = response.page;
			totalPages = Math.max(1, response.total_pages);
			if (skus.length === 0) {
				mensaje = nombre
					? `Sin resultados para «${nombre}»${enRebaja ? ' en rebaja' : ''}.`
					: enRebaja
						? 'No hay productos en rebaja.'
						: 'No hay productos en el inventario.';
			}
			if (pagina === 1) primerElegible();
			onResultados?.(response.data);
		} catch (err) {
			if (requestId !== lastRequestId) return;
			error = errorService.getMessage(err);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	/**
	 * Búsqueda exacta por código. Con coincidencia se agrega sin más y el campo queda listo para el
	 * siguiente; sin ella, al escribir se avisa en la lista (puede ser un código a medio tipear) y
	 * desde la cámara bajo el campo.
	 */
	export async function buscarCodigo(codigo: string, origen: 'texto' | 'camara' = 'camara') {
		const requestId = ++lastRequestId;
		buscandoCodigo = true;
		isLoading = false;
		error = '';
		onAviso?.(null);
		try {
			const response = await skuService.inventario({ codigo_barras: codigo, per_page: 5 });
			if (requestId !== lastRequestId) return;
			const [sku] = response.data;
			if (sku) {
				onResultados?.(response.data);
				onAgregar(sku);
				texto = '';
				abierto = false;
				return;
			}
			const sinCoincidencia = `Ningún producto activo tiene el código ${codigo}.`;
			if (origen === 'camara') {
				onAviso?.({ tipo: 'error', texto: sinCoincidencia });
			} else {
				skus = [];
				consulta = null;
				activoId = null;
				mensaje = sinCoincidencia;
			}
		} catch (err) {
			if (requestId !== lastRequestId) return;
			onAviso?.({ tipo: 'error', texto: errorService.getMessage(err) });
		} finally {
			if (requestId === lastRequestId) buscandoCodigo = false;
			if (origen === 'camara') focus();
		}
	}

	/** Vacía la lista e invalida lo que esté en vuelo (sus resultados ya no corresponden) */
	function vaciarLista(nuevoMensaje = '') {
		lastRequestId++;
		isLoading = false;
		error = '';
		skus = [];
		consulta = null;
		activoId = null;
		mensaje = nuevoMensaje;
	}

	// Decide qué buscar con el texto actual. Sin texto no se muestra nada, salvo con «En rebaja»
	function ejecutar() {
		clearTimeout(timer);
		timer = undefined;
		const value = texto.trim();
		abierto = true;
		if (esCodigoBarras(value)) {
			buscarCodigo(value, 'texto');
		} else if (value.length === 0) {
			if (enRebaja) buscarNombre('');
			else vaciarLista();
		} else if (value.length < BUSQUEDA_MIN_CHARS) {
			vaciarLista(`Escribe al menos ${BUSQUEDA_MIN_CHARS} letras para buscar.`);
		} else {
			buscarNombre(value);
		}
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		texto = event.currentTarget.value;
		onAviso?.(null);
		clearTimeout(timer);
		// Se busca al dejar de escribir: un lector escribe todo el código antes de que venza
		timer = setTimeout(ejecutar, BUSQUEDA_DEBOUNCE_MS);
	}

	// Enfocar no busca: solo vuelve a mostrar la última búsqueda, si la hay
	function handleFocus() {
		abierto = true;
	}

	function mover(delta: 1 | -1) {
		if (elegibles.length === 0) return;
		const actual = elegibles.findIndex((sku) => sku.id === activoId);
		const siguiente =
			actual === -1
				? delta === 1
					? 0
					: elegibles.length - 1
				: (actual + delta + elegibles.length) % elegibles.length;
		activoId = elegibles[siguiente].id;
	}

	function elegir(sku: SkuInventario) {
		if (disabled) return;
		onAgregar(sku);
		// La lista sigue abierta con el mismo texto, para sumar otra talla o color
		input?.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp': {
				event.preventDefault();
				if (!abierto) {
					handleFocus();
					return;
				}
				mover(event.key === 'ArrowDown' ? 1 : -1);
				return;
			}
			case 'Enter': {
				// Enter no hace falta, pero muchos lectores lo envían: busca ya, sin esperar ni duplicar
				event.preventDefault();
				if (timer) {
					ejecutar();
					return;
				}
				const sku = mostrarLista ? elegibles.find((item) => item.id === activoId) : undefined;
				if (sku) elegir(sku);
				return;
			}
			case 'Escape': {
				if (abierto) {
					event.preventDefault();
					abierto = false;
				} else if (texto) {
					event.preventDefault();
					limpiar();
				}
				return;
			}
			case 'Tab':
				abierto = false;
		}
	}

	function limpiar() {
		clearTimeout(timer);
		timer = undefined;
		texto = '';
		onAviso?.(null);
		ejecutar();
		input?.focus();
	}

	function toggleRebaja() {
		enRebaja = !enRebaja;
		input?.focus();
		const value = texto.trim();
		abierto = true;
		// Filtra la búsqueda por nombre. Sin ella, activo lista los productos en rebaja y
		// desactivado no muestra nada. Nunca repite una búsqueda por código (la volvería a agregar)
		if (!esCodigoBarras(value) && value.length >= BUSQUEDA_MIN_CHARS) buscarNombre(value);
		else if (enRebaja) buscarNombre('');
		else vaciarLista();
	}

	// "/" o F2 desde cualquier parte de la caja enfocan el buscador (salvo escribiendo en otro campo)
	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key !== '/' && event.key !== 'F2') return;
		const target = event.target as HTMLElement | null;
		if (target === input) return;
		const editando = target?.closest('input, textarea, select, [contenteditable="true"]') !== null;
		if (editando && event.key === '/') return;
		event.preventDefault();
		focus();
	}

	onMount(() => {
		// En pantallas táctiles no se abre el teclado sin que lo pidan
		if (window.matchMedia('(pointer: fine)').matches) input?.focus();
	});

	onDestroy(() => clearTimeout(timer));
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="space-y-2">
	<div class="flex gap-2">
		<div class="relative min-w-0 flex-1" use:clickOutside={() => (abierto = false)}>
			<label for="{id}-buscar" class="sr-only">Buscar producto o escanear código de barras</label>
			<SearchIcon
				class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-light-two_d dark:text-dark-two_d"
			/>
			<input
				bind:this={input}
				id="{id}-buscar"
				type="text"
				role="combobox"
				aria-autocomplete="list"
				aria-expanded={mostrarLista}
				aria-controls={LISTBOX_ID}
				aria-activedescendant={activeDescendant}
				aria-describedby="{id}-ayuda {id}-aviso"
				inputmode="search"
				enterkeyhint="search"
				autocomplete="off"
				spellcheck="false"
				maxlength={VENTA_LIMITS.NOMBRE_BUSQUEDA_MAX}
				placeholder="Busca por nombre o escanea un código"
				value={texto}
				oninput={handleInput}
				onkeydown={handleKeydown}
				onfocus={handleFocus}
				onclick={() => (abierto = true)}
				class="block h-12 w-full border border-light-four bg-light-one pr-11 pl-10 text-base text-light-two transition-colors outline-none placeholder:text-sm placeholder:text-light-two_d hover:border-light-two focus:border-light-three dark:border-dark-four_d dark:bg-dark-one dark:text-dark-two dark:placeholder:text-dark-two_d dark:hover:border-dark-two dark:focus:border-dark-three"
			/>
			{#if texto}
				<button
					type="button"
					onclick={limpiar}
					aria-label="Limpiar búsqueda"
					class="absolute top-1/2 right-1.5 inline-flex size-9 -translate-y-1/2 items-center justify-center text-light-two_d hover:text-light-two dark:text-dark-two_d dark:hover:text-dark-two"
				>
					<XIcon class="size-4" />
				</button>
			{/if}

			{#if mostrarLista}
				<VentaSugerencias
					id={LISTBOX_ID}
					{skus}
					{enCarrito}
					{activoId}
					{isLoading}
					{error}
					{mensaje}
					{disabled}
					hasMore={page < totalPages}
					onElegir={elegir}
					onActivar={(skuId) => (activoId = skuId)}
					onLoadMore={() => consulta !== null && buscarNombre(consulta, page + 1)}
					onRetry={() => (consulta !== null ? buscarNombre(consulta) : ejecutar())}
				/>
			{/if}
		</div>
		<button
			type="button"
			aria-pressed={enRebaja}
			onclick={toggleRebaja}
			title="Mostrar solo productos en rebaja"
			class={[
				'inline-flex h-12 shrink-0 items-center gap-1.5 border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none dark:focus-visible:ring-dark-three',
				enRebaja
					? 'border-light-accent bg-light-accent/10 text-light-accent dark:border-dark-accent dark:bg-dark-accent/10 dark:text-dark-accent'
					: 'border-light-four text-light-two_d hover:text-light-two dark:border-dark-four_d dark:text-dark-two_d dark:hover:text-dark-two'
			]}
		>
			<PercentIcon class="size-4" />
			<span class="hidden sm:inline">En rebaja</span>
			<span class="sr-only sm:hidden">En rebaja</span>
		</button>
		{#if onScan}
			<button
				type="button"
				onclick={onScan}
				aria-label="Escanear con la cámara"
				title="Escanear con la cámara"
				class="inline-flex size-12 shrink-0 items-center justify-center border border-light-four bg-light-one text-light-two transition-colors hover:border-light-three hover:bg-light-one_d focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none dark:border-dark-four_d dark:bg-dark-one dark:text-dark-two dark:hover:border-dark-three dark:hover:bg-dark-one_d dark:focus-visible:ring-dark-three"
			>
				<ScanBarcodeIcon class="size-6" />
			</button>
		{/if}
	</div>

	<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
		<p
			id="{id}-aviso"
			aria-live="polite"
			class={[
				'min-h-5 text-sm font-medium',
				aviso?.tipo === 'error'
					? 'text-light-error dark:text-dark-error'
					: 'text-[color-mix(in_oklab,var(--color-light-success)_75%,black)] dark:text-dark-success'
			]}
		>
			{#if buscandoCodigo}
				<span class="text-light-two_d dark:text-dark-two_d">Buscando código…</span>
			{:else if aviso}
				{aviso.texto}
			{/if}
		</p>
	</div>
</div>
