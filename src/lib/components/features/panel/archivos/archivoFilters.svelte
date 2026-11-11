<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Input, Select } from '#lib/components/ui/index.ts';
	import { IMAGEN_TIPO, IMAGEN_TIPO_LABEL, type ImagenTipo } from '#lib/constants/index.ts';
	import { SearchIcon } from '#lib/icons/outline/index.ts';
	import { ARCHIVO_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		/** Búsqueda ya aplicada, para el estado inicial del campo */
		nombre: string;
		/** null = todos los tipos */
		tipo: ImagenTipo | null;
		/** Se llama al dejar de escribir (con una pequeña espera) */
		onNombreChange: (nombre: string) => void;
		onTipoChange: (tipo: ImagenTipo | null) => void;
	}

	let { nombre, tipo, onNombreChange, onTipoChange }: Props = $props();

	const id = $props.id();
	const SEARCH_DELAY_MS = 400;

	// Solo el valor inicial: después el campo es del usuario y la página recibe lo que escribe
	// svelte-ignore state_referenced_locally
	let search = $state(nombre);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Espera a que el usuario deje de escribir para no pedir el listado en cada tecla
	function handleSearchInput(event: Event & { currentTarget: HTMLInputElement }) {
		search = event.currentTarget.value;
		clearTimeout(timer);
		timer = setTimeout(() => onNombreChange(search.trim()), SEARCH_DELAY_MS);
	}

	onDestroy(() => clearTimeout(timer));
</script>

<div class="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_14rem] lg:max-w-3xl">
	<Input
		id="{id}-nombre"
		type="search"
		label="Buscar"
		icon={SearchIcon}
		value={search}
		oninput={handleSearchInput}
		maxlength={ARCHIVO_LIMITS.NOMBRE_BUSQUEDA_MAX}
		placeholder="Nombre del producto"
		autocomplete="off"
	/>

	<Select
		id="{id}-tipo"
		label="Tipo"
		value={tipo ?? ''}
		onchange={(event) => onTipoChange((event.currentTarget.value as ImagenTipo) || null)}
	>
		<option value="">Todos</option>
		{#each Object.values(IMAGEN_TIPO) as value (value)}
			<option {value}>{IMAGEN_TIPO_LABEL[value]}</option>
		{/each}
	</Select>
</div>
