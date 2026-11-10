<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Select } from '#lib/components/ui/index.ts';
	import {
		METODO_PAGO,
		METODO_PAGO_LABEL,
		RANGO_FECHA,
		RANGO_FECHA_LABEL,
		VENTA_CANAL,
		VENTA_CANAL_LABEL,
		type MetodoPago,
		type RangoFecha,
		type VentaCanal
	} from '#lib/constants/index.ts';
	import { HashIcon } from '#lib/icons/outline/index.ts';
	import type { VentaFiltros } from '#lib/interfaces/index.ts';
	import { todayISO } from '#lib/utils/index.ts';

	interface Props {
		filtros: VentaFiltros;
		/** Usuarios para filtrar por quién registró la venta; null = sin ese filtro */
		vendedores: readonly { id: string; nombre: string }[] | null;
		onChange: (filtros: VentaFiltros) => void;
	}

	let { filtros, vendedores, onChange }: Props = $props();

	const id = $props.id();
	const SEARCH_DELAY_MS = 400;
	const today = todayISO();

	// svelte-ignore state_referenced_locally
	let numero = $state(filtros.numero);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function set(patch: Partial<VentaFiltros>) {
		onChange({ ...filtros, ...patch });
	}

	function handleNumeroInput(event: Event & { currentTarget: HTMLInputElement }) {
		numero = event.currentTarget.value.replace(/[^\d]/g, '');
		clearTimeout(timer);
		timer = setTimeout(() => set({ numero }), SEARCH_DELAY_MS);
	}

	function handleRango(value: RangoFecha) {
		// Al pasar a personalizado se parte del día de hoy
		if (value === RANGO_FECHA.PERSONALIZADO) {
			set({ rango: value, desde: filtros.desde || today, hasta: filtros.hasta || today });
			return;
		}
		set({ rango: value });
	}

	onDestroy(() => clearTimeout(timer));

	const labelClass = 'mb-1 block text-xs font-medium text-light-two_d dark:text-dark-two_d';
	const dateClass =
		'block h-11 w-full border border-light-four bg-light-one px-3 text-base text-light-two outline-none hover:border-light-two focus:border-light-three dark:border-dark-four_d dark:bg-dark-one dark:text-dark-two dark:[color-scheme:dark] dark:focus:border-dark-three';
</script>

<div class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:flex xl:flex-wrap xl:items-end">
	<div class="col-span-2 md:col-span-1 xl:w-48">
		<label for="{id}-rango" class={labelClass}>Fecha</label>
		<Select
			id="{id}-rango"
			value={filtros.rango}
			onchange={(event) => handleRango(event.currentTarget.value as RangoFecha)}
		>
			{#each Object.values(RANGO_FECHA) as value (value)}
				<option {value}>{RANGO_FECHA_LABEL[value]}</option>
			{/each}
		</Select>
	</div>

	{#if filtros.rango === RANGO_FECHA.PERSONALIZADO}
		<div class="xl:w-44">
			<label for="{id}-desde" class={labelClass}>Desde</label>
			<input
				id="{id}-desde"
				type="date"
				class={dateClass}
				value={filtros.desde}
				max={filtros.hasta || today}
				onchange={(event) => set({ desde: event.currentTarget.value })}
			/>
		</div>
		<div class="xl:w-44">
			<label for="{id}-hasta" class={labelClass}>Hasta</label>
			<input
				id="{id}-hasta"
				type="date"
				class={dateClass}
				value={filtros.hasta}
				min={filtros.desde || undefined}
				max={today}
				onchange={(event) => set({ hasta: event.currentTarget.value })}
			/>
		</div>
	{/if}

	<div class="xl:w-40">
		<label for="{id}-canal" class={labelClass}>Canal</label>
		<Select
			id="{id}-canal"
			value={filtros.canal ?? ''}
			onchange={(event) => set({ canal: (event.currentTarget.value as VentaCanal) || null })}
		>
			<option value="">Todos</option>
			{#each Object.values(VENTA_CANAL) as value (value)}
				<option {value}>{VENTA_CANAL_LABEL[value]}</option>
			{/each}
		</Select>
	</div>

	<div class="xl:w-44">
		<label for="{id}-metodo" class={labelClass}>Método de pago</label>
		<Select
			id="{id}-metodo"
			value={filtros.metodo_pago ?? ''}
			onchange={(event) => set({ metodo_pago: (event.currentTarget.value as MetodoPago) || null })}
		>
			<option value="">Todos</option>
			{#each Object.values(METODO_PAGO) as value (value)}
				<option {value}>{METODO_PAGO_LABEL[value]}</option>
			{/each}
		</Select>
	</div>

	{#if vendedores}
		<div class="xl:w-52">
			<label for="{id}-vendedor" class={labelClass}>Registrada por</label>
			<Select
				id="{id}-vendedor"
				value={filtros.created_by ?? ''}
				onchange={(event) => set({ created_by: event.currentTarget.value || null })}
			>
				<option value="">Todos</option>
				{#each vendedores as vendedor (vendedor.id)}
					<option value={vendedor.id}>{vendedor.nombre}</option>
				{/each}
			</Select>
		</div>
	{/if}

	<div class="xl:w-36">
		<label for="{id}-numero" class={labelClass}>N.º de venta</label>
		<div class="relative">
			<HashIcon
				class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-light-two_d dark:text-dark-two_d"
			/>
			<input
				id="{id}-numero"
				type="text"
				inputmode="numeric"
				autocomplete="off"
				placeholder="12"
				value={numero}
				oninput={handleNumeroInput}
				class="block h-11 w-full border border-light-four bg-light-one pr-3 pl-9 text-base text-light-two outline-none hover:border-light-two focus:border-light-three dark:border-dark-four_d dark:bg-dark-one dark:text-dark-two dark:focus:border-dark-three"
			/>
		</div>
	</div>
</div>
