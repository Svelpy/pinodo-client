<script lang="ts">
	import { Select } from '#lib/components/ui/index.ts';
	import type { Seccion } from '#lib/interfaces/index.ts';

	interface Props {
		secciones: readonly Seccion[];
		/** null = sin filtro */
		seccionId: string | null;
		isVisible: boolean | null;
		onSeccionChange: (seccionId: string | null) => void;
		onVisibleChange: (isVisible: boolean | null) => void;
	}

	let { secciones, seccionId, isVisible, onSeccionChange, onVisibleChange }: Props = $props();

	const id = $props.id();
</script>

<div class="grid min-w-0 flex-1 gap-3 sm:max-w-xl sm:grid-cols-2">
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

	<Select
		id="{id}-visibilidad"
		label="Visibilidad"
		value={isVisible === null ? '' : String(isVisible)}
		onchange={(event) => {
			const { value } = event.currentTarget;
			onVisibleChange(value === '' ? null : value === 'true');
		}}
	>
		<option value="">Todas</option>
		<option value="true">Visibles</option>
		<option value="false">Ocultas</option>
	</Select>
</div>
