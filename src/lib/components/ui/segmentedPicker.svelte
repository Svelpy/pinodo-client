<script lang="ts" generics="T extends string">
	import { tick, type Component } from 'svelte';
	import { slide } from 'svelte/transition';
	import { ChevronDownIcon } from '#lib/icons/outline/index.ts';
	import { duracion } from '#lib/utils/index.ts';
	import SegmentedControl from './segmentedControl.svelte';

	type Option = { value: T; label: string; icon?: Component<{ class?: string }> };

	/**
	 * `SegmentedControl` para listas largas: las opciones frecuentes siempre a la vista y el resto
	 * tras "Más", en una segunda cuadrícula. Si se eligió una de las de "Más", ocupa su lugar en la
	 * fila principal para que la elección se vea aunque el panel esté cerrado.
	 */
	interface Props {
		/** Nombre accesible del grupo */
		label: string;
		showLabel?: boolean;
		/** Siempre visibles */
		options: readonly Option[];
		/** Tras "Más" */
		more: readonly Option[];
		moreLabel?: string;
		/** null = ninguna elegida */
		value: T | null;
		onChange: (value: T) => void;
		disabled?: boolean;
		error?: string;
		/** Columnas de la fila principal (contando "Más"); por defecto, todas en una fila */
		columns?: number;
		/** Columnas de la cuadrícula de "Más" */
		moreColumns?: number;
		class?: string;
	}

	let {
		label,
		showLabel = true,
		options,
		more,
		moreLabel = 'Más',
		value,
		onChange,
		disabled = false,
		error,
		columns,
		moreColumns = 2,
		class: className
	}: Props = $props();

	const MAS = '__mas__';
	type Visible = T | typeof MAS;

	let abierto = $state(false);

	const elegidaEnMas = $derived(more.find((option) => option.value === value));
	const visibles = $derived<{ value: Visible; label: string; icon?: Option['icon'] }[]>([
		...options,
		{
			value: MAS,
			label: elegidaEnMas?.label ?? moreLabel,
			icon: elegidaEnMas?.icon ?? ChevronDownIcon
		}
	]);

	let contenedor = $state<HTMLDivElement>();

	function handleChange(next: Visible) {
		if (next === MAS) {
			abierto = !abierto;
			return;
		}
		abierto = false;
		onChange(next);
	}

	/**
	 * Elegir en "Más" (clic, toque, Enter o Espacio, que también disparan `click`) cierra el panel.
	 * Las flechas no lo cierran: recorren las opciones eligiendo cada una, como en un radiogroup.
	 * El foco pasa a la fila principal, donde ahora se ve lo elegido.
	 */
	async function cerrarTrasElegir(event: MouseEvent) {
		if (!(event.target as HTMLElement).closest('[role="radio"]')) return;
		abierto = false;
		await tick();
		contenedor?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus();
	}
</script>

<div bind:this={contenedor} class={className}>
	<SegmentedControl
		{label}
		{showLabel}
		options={visibles}
		value={elegidaEnMas ? MAS : value}
		onChange={handleChange}
		{disabled}
		error={abierto ? undefined : error}
		{columns}
	/>
	{#if abierto}
		<!-- El clic llega de los botones (radio) de dentro, que ya son accesibles por teclado -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div transition:slide={{ duration: duracion(150) }} onclick={cerrarTrasElegir} class="pt-1">
			<SegmentedControl
				label="{label}: {moreLabel.toLowerCase()}"
				showLabel={false}
				options={more}
				value={elegidaEnMas ? value : null}
				{onChange}
				{disabled}
				{error}
				columns={moreColumns}
			/>
		</div>
	{/if}
</div>
