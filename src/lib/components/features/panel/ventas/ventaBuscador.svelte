<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { PercentIcon, ScanBarcodeIcon, SearchIcon, XIcon } from '#lib/icons/outline/index.ts';
	import type { CajaAviso } from '#lib/interfaces/index.ts';
	import { VENTA_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		/** Búsqueda por nombre aplicada */
		nombre: string;
		enRebaja: boolean;
		/** Mensaje bajo el campo tras escanear o agregar (se anuncia a lectores de pantalla) */
		aviso?: CajaAviso | null;
		/** Hay una búsqueda por código en curso */
		buscandoCodigo?: boolean;
		/** Se llama al dejar de escribir o al pulsar Enter con texto */
		onNombreChange: (nombre: string) => void;
		/** Enter con un código (lector USB o teclado): búsqueda exacta */
		onCodigo: (codigo: string) => void;
		onEnRebajaChange: (enRebaja: boolean) => void;
		/** Abre el escáner con la cámara; no se pasa si el navegador no lo soporta */
		onScan?: () => void;
	}

	let {
		nombre,
		enRebaja,
		aviso = null,
		buscandoCodigo = false,
		onNombreChange,
		onCodigo,
		onEnRebajaChange,
		onScan
	}: Props = $props();

	const id = $props.id();
	const SEARCH_DELAY_MS = 300;
	// Un lector de códigos escribe solo dígitos (EAN-13, UPC…) o un código sin espacios
	const CODIGO_REGEX = /^[0-9A-Za-z\-.]{6,50}$/;
	const SOLO_DIGITOS = /^\d{6,}$/;

	// svelte-ignore state_referenced_locally
	let texto = $state(nombre);
	let input = $state<HTMLInputElement>();
	let timer: ReturnType<typeof setTimeout> | undefined;

	/** Pone el foco en el campo para el siguiente escaneo */
	export function focus() {
		input?.focus();
		input?.select();
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		texto = event.currentTarget.value;
		clearTimeout(timer);
		const value = texto.trim();
		// Un número largo casi siempre es un código a medio escanear: se espera al Enter
		if (SOLO_DIGITOS.test(value)) return;
		timer = setTimeout(() => onNombreChange(value), SEARCH_DELAY_MS);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && texto) {
			event.preventDefault();
			limpiar();
			return;
		}
		if (event.key !== 'Enter') return;
		event.preventDefault();
		clearTimeout(timer);
		const value = texto.trim();
		if (!value) return;

		// Sin espacios y con dígitos: se trata como código y se limpia para el siguiente escaneo
		if (CODIGO_REGEX.test(value) && /\d/.test(value)) {
			onCodigo(value);
			texto = '';
			return;
		}
		onNombreChange(value);
	}

	function limpiar() {
		clearTimeout(timer);
		texto = '';
		onNombreChange('');
		input?.focus();
	}

	// "/" o F2 desde cualquier parte de la caja enfocan el buscador (salvo escribiendo en otro campo)
	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key !== '/' && event.key !== 'F2') return;
		const target = event.target as HTMLElement | null;
		const editando =
			target?.closest('input, textarea, select, [contenteditable="true"]') !== null &&
			target !== input;
		if (editando && event.key === '/') return;
		if (target === input) return;
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
		<div class="relative min-w-0 flex-1">
			<label for="{id}-buscar" class="sr-only">Buscar producto o escanear código de barras</label>
			<SearchIcon
				class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-light-two_d dark:text-dark-two_d"
			/>
			<input
				bind:this={input}
				id="{id}-buscar"
				type="search"
				inputmode="search"
				enterkeyhint="search"
				autocomplete="off"
				spellcheck="false"
				maxlength={VENTA_LIMITS.NOMBRE_BUSQUEDA_MAX}
				placeholder="Busca por nombre o escanea un código"
				value={texto}
				oninput={handleInput}
				onkeydown={handleKeydown}
				aria-describedby="{id}-ayuda {id}-aviso"
				class="block h-12 w-full border border-light-four bg-light-one pr-11 pl-10 text-base text-light-two transition-colors outline-none placeholder:text-sm placeholder:text-light-two_d hover:border-light-two focus:border-light-three dark:border-dark-four_d dark:bg-dark-one dark:text-dark-two dark:placeholder:text-dark-two_d dark:hover:border-dark-two dark:focus:border-dark-three [&::-webkit-search-cancel-button]:hidden"
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
		</div>
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

	<div class="flex flex-wrap items-center justify-between gap-2">
		<button
			type="button"
			aria-pressed={enRebaja}
			onclick={() => onEnRebajaChange(!enRebaja)}
			class={[
				'inline-flex h-9 items-center gap-1.5 border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none dark:focus-visible:ring-dark-three',
				enRebaja
					? 'border-light-accent bg-light-accent/10 text-light-accent dark:border-dark-accent dark:bg-dark-accent/10 dark:text-dark-accent'
					: 'border-light-one_d text-light-two_d hover:text-light-two dark:border-dark-one_d dark:text-dark-two_d dark:hover:text-dark-two'
			]}
		>
			<PercentIcon class="size-4" />
			En rebaja
		</button>
		<p id="{id}-ayuda" class="hidden text-xs text-light-two_d sm:block dark:text-dark-two_d">
			Pulsa <kbd class="border border-light-one_d px-1 font-mono dark:border-dark-one_d">/</kbd>
			para buscar · Enter agrega el código escaneado
		</p>
	</div>

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
