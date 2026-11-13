<script lang="ts">
	import { onDestroy } from 'svelte';
	import { KARDEX_LIMITS } from '#lib/constants/index.ts';
	import { ScanBarcodeIcon, SearchIcon } from '#lib/icons/outline/index.ts';
	import type { CostoFiltros } from '#lib/interfaces/index.ts';

	interface Props {
		filtros: CostoFiltros;
		onChange: (filtros: CostoFiltros) => void;
	}

	let { filtros, onChange }: Props = $props();

	const id = $props.id();
	const SEARCH_DELAY_MS = 400;

	// Lo escrito se aplica tras una pausa para no pedir la lista en cada tecla
	// svelte-ignore state_referenced_locally
	let valores = $state<CostoFiltros>({ ...filtros });
	let timer: ReturnType<typeof setTimeout> | undefined;

	function handleInput(campo: keyof CostoFiltros, value: string) {
		valores = { ...valores, [campo]: value };
		clearTimeout(timer);
		timer = setTimeout(() => onChange({ ...valores }), SEARCH_DELAY_MS);
	}

	onDestroy(() => clearTimeout(timer));

	const labelClass = 'mb-1 block text-xs font-medium text-light-two_d dark:text-dark-two_d';
	const iconClass =
		'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-light-two_d dark:text-dark-two_d';
	const inputClass =
		'block h-11 w-full border border-light-four bg-light-one pr-3 pl-9 text-base text-light-two outline-none hover:border-light-two focus:border-light-three dark:border-dark-four_d dark:bg-dark-one dark:text-dark-two dark:focus:border-dark-three';
</script>

<div class="grid gap-3 sm:grid-cols-2 xl:flex xl:items-end">
	<div class="xl:w-80">
		<label for="{id}-nombre" class={labelClass}>Producto</label>
		<div class="relative">
			<SearchIcon class={iconClass} />
			<input
				id="{id}-nombre"
				type="search"
				autocomplete="off"
				placeholder="Buscar por nombre"
				maxlength={KARDEX_LIMITS.NOMBRE_MAX}
				value={valores.nombre}
				oninput={(event) => handleInput('nombre', event.currentTarget.value)}
				class={inputClass}
			/>
		</div>
	</div>
	<div class="xl:w-60">
		<label for="{id}-codigo" class={labelClass}>Código de barras</label>
		<div class="relative">
			<ScanBarcodeIcon class={iconClass} />
			<input
				id="{id}-codigo"
				type="search"
				autocomplete="off"
				placeholder="Código exacto"
				maxlength={KARDEX_LIMITS.CODIGO_BARRAS_MAX}
				value={valores.codigo_barras}
				oninput={(event) => handleInput('codigo_barras', event.currentTarget.value)}
				class={inputClass}
			/>
		</div>
	</div>
</div>
