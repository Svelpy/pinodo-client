<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Input, Select } from '#lib/components/ui/index.ts';
	import { SearchIcon } from '#lib/icons/outline/index.ts';
	import type { CategoriaOption, Seccion } from '#lib/interfaces/index.ts';
	import { PRODUCTO_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		secciones: readonly Seccion[];
		/** Categorías de la sección elegida (con su ruta completa); vacío sin sección */
		categoriaOptions: readonly CategoriaOption[];
		/** null = sin filtro */
		seccionId: string | null;
		categoriaId: string | null;
		isVisible: boolean | null;
		/** Búsqueda ya aplicada, para el estado inicial del campo */
		nombre: string;
		onSeccionChange: (seccionId: string | null) => void;
		onCategoriaChange: (categoriaId: string | null) => void;
		onVisibleChange: (isVisible: boolean | null) => void;
		/** Se llama al dejar de escribir (con una pequeña espera) */
		onNombreChange: (nombre: string) => void;
	}

	let {
		secciones,
		categoriaOptions,
		seccionId,
		categoriaId,
		isVisible,
		nombre,
		onSeccionChange,
		onCategoriaChange,
		onVisibleChange,
		onNombreChange
	}: Props = $props();

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

<div class="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
	<Input
		id="{id}-nombre"
		type="search"
		label="Buscar"
		icon={SearchIcon}
		value={search}
		oninput={handleSearchInput}
		maxlength={PRODUCTO_LIMITS.NOMBRE_MAX}
		placeholder="Nombre del producto"
		autocomplete="off"
	/>

	<Select
		id="{id}-seccion"
		label="Sección"
		value={seccionId ?? ''}
		onchange={(event) => onSeccionChange(event.currentTarget.value || null)}
	>
		<option value="">Todas</option>
		{#each secciones as seccion (seccion.id)}
			<option value={seccion.id}>{seccion.nombre}</option>
		{/each}
	</Select>

	<!-- Las categorías dependen de la sección: sin sección elegida no hay opciones -->
	<Select
		id="{id}-categoria"
		label="Categoría"
		value={categoriaId ?? ''}
		disabled={!seccionId}
		onchange={(event) => onCategoriaChange(event.currentTarget.value || null)}
	>
		<option value="">{seccionId ? 'Todas' : 'Elige una sección'}</option>
		{#each categoriaOptions as option (option.id)}
			<option value={option.id}>{option.label}</option>
		{/each}
	</Select>

	<Select
		id="{id}-visibilidad"
		label="Visibilidad"
		value={isVisible === null ? '' : String(isVisible)}
		onchange={(event) => {
			const { value } = event.currentTarget;
			onVisibleChange(value === '' ? null : value === 'true');
		}}
	>
		<option value="">Todos</option>
		<option value="true">Visibles</option>
		<option value="false">Ocultos</option>
	</Select>
</div>
