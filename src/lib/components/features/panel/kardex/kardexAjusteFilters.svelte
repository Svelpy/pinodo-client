<script lang="ts">
	import { Select } from '#lib/components/ui/index.ts';
	import {
		AJUSTE_MOTIVO,
		AJUSTE_MOTIVO_LABEL,
		RANGO_FECHA,
		RANGO_FECHA_LABEL,
		type AjusteMotivo,
		type RangoFecha
	} from '#lib/constants/index.ts';
	import type { AjusteFiltros } from '#lib/interfaces/index.ts';
	import { todayISO } from '#lib/utils/index.ts';

	interface Props {
		filtros: AjusteFiltros;
		/** Usuarios para filtrar por quién registró el ajuste; null = sin ese filtro */
		usuarios: readonly { id: string; nombre: string }[] | null;
		onChange: (filtros: AjusteFiltros) => void;
	}

	let { filtros, usuarios, onChange }: Props = $props();

	const id = $props.id();
	const today = todayISO();

	function set(patch: Partial<AjusteFiltros>) {
		onChange({ ...filtros, ...patch });
	}

	function handleRango(value: RangoFecha) {
		// Al pasar a personalizado se parte del día de hoy
		if (value === RANGO_FECHA.PERSONALIZADO) {
			set({ rango: value, desde: filtros.desde || today, hasta: filtros.hasta || today });
			return;
		}
		set({ rango: value });
	}

	const labelClass = 'mb-1 block text-xs font-medium text-light-two_d dark:text-dark-two_d';
	const dateClass =
		'block h-11 w-full border border-light-four bg-light-one px-3 text-base text-light-two outline-none hover:border-light-two focus:border-light-three dark:border-dark-four_d dark:bg-dark-one dark:text-dark-two dark:scheme-dark dark:focus:border-dark-three';
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

	<div class="xl:w-44">
		<label for="{id}-motivo" class={labelClass}>Motivo</label>
		<Select
			id="{id}-motivo"
			value={filtros.motivo ?? ''}
			onchange={(event) => set({ motivo: (event.currentTarget.value as AjusteMotivo) || null })}
		>
			<option value="">Todos</option>
			{#each Object.values(AJUSTE_MOTIVO) as value (value)}
				<option {value}>{AJUSTE_MOTIVO_LABEL[value]}</option>
			{/each}
		</Select>
	</div>

	{#if usuarios}
		<div class="xl:w-52">
			<label for="{id}-usuario" class={labelClass}>Registrado por</label>
			<Select
				id="{id}-usuario"
				value={filtros.created_by ?? ''}
				onchange={(event) => set({ created_by: event.currentTarget.value || null })}
			>
				<option value="">Todos</option>
				{#each usuarios as usuario (usuario.id)}
					<option value={usuario.id}>{usuario.nombre}</option>
				{/each}
			</Select>
		</div>
	{/if}
</div>
