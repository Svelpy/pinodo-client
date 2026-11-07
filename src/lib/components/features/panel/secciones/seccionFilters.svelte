<script lang="ts">
	import { Select } from '#lib/components/ui/index.ts';

	interface Props {
		/** null = sin filtro (todas las secciones) */
		isVisible: boolean | null;
		onChange: (isVisible: boolean | null) => void;
	}

	let { isVisible, onChange }: Props = $props();

	const toValue = (value: boolean | null) => (value === null ? '' : String(value));

	function handleChange(event: Event & { currentTarget: HTMLSelectElement }) {
		const { value } = event.currentTarget;
		onChange(value === '' ? null : value === 'true');
	}
</script>

<!-- Etiqueta y select en una fila: el Select sin `label` no dibuja la suya -->
<div class="flex items-center gap-3">
	<label
		for="secciones-visibilidad"
		class="shrink-0 text-sm font-medium text-light-two sm:text-base dark:text-dark-two"
	>
		Visibilidad
	</label>
	<Select
		id="secciones-visibilidad"
		class="min-w-0 flex-1 sm:w-64 sm:flex-none"
		value={toValue(isVisible)}
		onchange={handleChange}
	>
		<option value="">Todas</option>
		<option value="true">Visibles</option>
		<option value="false">Ocultas</option>
	</Select>
</div>
