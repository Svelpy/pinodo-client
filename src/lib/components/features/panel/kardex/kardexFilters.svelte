<script lang="ts">
	import { Select } from '#lib/components/ui/index.ts';
	import {
		KARDEX_LIMITS,
		MOVIMIENTO_TIPO,
		MOVIMIENTO_TIPO_LABEL,
		RANGO_FECHA,
		RANGO_FECHA_LABEL,
		type MovimientoTipo,
		type RangoFecha
	} from '#lib/constants/index.ts';
	import { LoaderIcon, ScanBarcodeIcon } from '#lib/icons/outline/index.ts';
	import type { KardexFiltros } from '#lib/interfaces/index.ts';
	import { todayISO } from '#lib/utils/index.ts';

	interface Props {
		filtros: KardexFiltros;
		/** Usuarios para filtrar por quién originó el movimiento; null = sin ese filtro */
		usuarios: readonly { id: string; nombre: string }[] | null;
		onChange: (filtros: KardexFiltros) => void;
		/** Busca un SKU por su código de barras para ver su kardex (Enter o lector de códigos) */
		onBuscarCodigo: (codigo: string) => void;
		buscandoCodigo?: boolean;
		/** Error de la búsqueda por código (p. ej. no existe) */
		codigoError?: string;
	}

	let {
		filtros,
		usuarios,
		onChange,
		onBuscarCodigo,
		buscandoCodigo = false,
		codigoError = ''
	}: Props = $props();

	const id = $props.id();
	const today = todayISO();

	let codigo = $state('');

	function set(patch: Partial<KardexFiltros>) {
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

	function handleCodigoSubmit(event: SubmitEvent) {
		event.preventDefault();
		const value = codigo.trim();
		if (value && !buscandoCodigo) onBuscarCodigo(value);
	}

	const labelClass = 'mb-1 block text-xs font-medium text-light-two_d dark:text-dark-two_d';
	const fieldClass =
		'block h-11 w-full border border-light-four bg-light-one px-3 text-base text-light-two outline-none hover:border-light-two focus:border-light-three dark:border-dark-four_d dark:bg-dark-one dark:text-dark-two dark:[color-scheme:dark] dark:focus:border-dark-three';
</script>

<div class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:flex xl:flex-wrap xl:items-start">
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
				class={fieldClass}
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
				class={fieldClass}
				value={filtros.hasta}
				min={filtros.desde || undefined}
				max={today}
				onchange={(event) => set({ hasta: event.currentTarget.value })}
			/>
		</div>
	{/if}

	<div class="xl:w-40">
		<label for="{id}-tipo" class={labelClass}>Tipo</label>
		<Select
			id="{id}-tipo"
			value={filtros.tipo ?? ''}
			onchange={(event) => set({ tipo: (event.currentTarget.value as MovimientoTipo) || null })}
		>
			<option value="">Todos</option>
			{#each Object.values(MOVIMIENTO_TIPO) as value (value)}
				<option {value}>{MOVIMIENTO_TIPO_LABEL[value]}</option>
			{/each}
		</Select>
	</div>

	{#if usuarios}
		<div class="xl:w-52">
			<label for="{id}-usuario" class={labelClass}>Usuario</label>
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

	<form class="col-span-2 xl:w-60" onsubmit={handleCodigoSubmit}>
		<label for="{id}-codigo" class={labelClass}>Kardex de un SKU</label>
		<div class="relative">
			<input
				id="{id}-codigo"
				type="search"
				enterkeyhint="search"
				autocomplete="off"
				placeholder="Código de barras"
				maxlength={KARDEX_LIMITS.CODIGO_BARRAS_MAX}
				bind:value={codigo}
				aria-invalid={codigoError ? 'true' : undefined}
				aria-describedby={codigoError ? `${id}-codigo-error` : undefined}
				class="{fieldClass} pr-12"
			/>
			<button
				type="submit"
				disabled={buscandoCodigo || !codigo.trim()}
				aria-label="Ver el kardex de este código"
				class="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-light-two_d transition-colors hover:text-light-two disabled:opacity-50 dark:text-dark-two_d dark:hover:text-dark-two"
			>
				{#if buscandoCodigo}
					<LoaderIcon class="size-5 animate-spin" />
				{:else}
					<ScanBarcodeIcon class="size-5" />
				{/if}
			</button>
		</div>
		{#if codigoError}
			<p
				id="{id}-codigo-error"
				role="alert"
				class="mt-1 text-sm text-light-error dark:text-dark-error"
			>
				{codigoError}
			</p>
		{/if}
	</form>
</div>
