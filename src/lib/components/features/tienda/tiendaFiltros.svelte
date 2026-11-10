<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { TiendaFiltros, TiendaFiltrosOpciones } from '#lib/interfaces/index.ts';
	import { filtrosToSearchParams, filtrosVacios, TIENDA_ORDENES } from '#lib/utils/index.ts';
	import TiendaDrawer from './tiendaDrawer.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		filtros: TiendaFiltros;
		opciones: TiendaFiltrosOpciones | null;
	}

	let { open, onClose, filtros, opciones }: Props = $props();

	// Borrador: los cambios se aplican con "Ver resultados"
	let borrador = $state<TiendaFiltros>(filtrosVacios());
	$effect.pre(() => {
		if (open) borrador = structuredClone($state.snapshot(filtros));
	});

	function toggle(lista: string[], id: string): string[] {
		return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
	}

	function precio(value: string): number | null {
		if (value.trim() === '') return null;
		const number = Number(value);
		return Number.isFinite(number) && number >= 0 ? number : null;
	}

	function aplicar(valores: TiendaFiltros) {
		const params = filtrosToSearchParams(valores, page.url.search);
		const search = params.size > 0 ? `?${params}` : '';
		onClose();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- misma ruta, solo cambia la query
		goto(`${page.url.pathname}${search}`);
	}
</script>

<TiendaDrawer {open} {onClose} title="Filtros" side="right">
	<form
		id="tienda-filtros"
		class="space-y-9 text-editorial"
		onsubmit={(event) => {
			event.preventDefault();
			aplicar(borrador);
		}}
	>
		<fieldset>
			<legend class="mb-3 font-semibold">Ordenar</legend>
			<div class="space-y-2">
				{#each TIENDA_ORDENES as orden (orden.value)}
					<label class="flex cursor-pointer items-center gap-3">
						<input
							type="radio"
							name="orden"
							value={orden.value}
							bind:group={borrador.orden}
							class="size-3.5 border-current text-light-two focus:ring-current dark:bg-dark-one dark:text-dark-two"
						/>
						{orden.label}
					</label>
				{/each}
			</div>
		</fieldset>

		{#if opciones && opciones.colores.length > 0}
			<fieldset>
				<legend class="mb-3 font-semibold">Color</legend>
				<div class="grid grid-cols-2 gap-x-4 gap-y-2.5">
					{#each opciones.colores as color (color.id)}
						<label class="flex cursor-pointer items-center gap-2.5">
							<input
								type="checkbox"
								class="peer sr-only"
								checked={borrador.colores.includes(color.id)}
								onchange={() => (borrador.colores = toggle(borrador.colores, color.id))}
							/>
							<span
								class="size-4 shrink-0 border border-light-two/25 ring-current ring-offset-2 peer-checked:ring-1 peer-focus-visible:outline-1 peer-focus-visible:outline-offset-4 dark:border-dark-two/30 dark:ring-offset-dark-one"
								style:background-color={color.codigo_hex ?? 'transparent'}
								aria-hidden="true"
							></span>
							<span class="peer-checked:font-semibold">{color.nombre}</span>
						</label>
					{/each}
				</div>
			</fieldset>
		{/if}

		{#if opciones && opciones.tallas.length > 0}
			<fieldset>
				<legend class="mb-3 font-semibold">Talla</legend>
				<div class="flex flex-wrap gap-2">
					{#each opciones.tallas as talla (talla.id)}
						<label class="cursor-pointer">
							<input
								type="checkbox"
								class="peer sr-only"
								checked={borrador.tallas.includes(talla.id)}
								onchange={() => (borrador.tallas = toggle(borrador.tallas, talla.id))}
							/>
							<span
								class="inline-flex h-9 min-w-11 items-center justify-center border border-light-two/25 px-3 peer-checked:border-current peer-checked:bg-light-two peer-checked:text-light-one peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 dark:border-dark-two/30 dark:peer-checked:bg-dark-two dark:peer-checked:text-dark-one"
							>
								{talla.etiqueta}
							</span>
						</label>
					{/each}
				</div>
			</fieldset>
		{/if}

		<fieldset>
			<legend class="mb-3 font-semibold">Precio (Bs)</legend>
			<div class="flex items-center gap-3">
				<label class="flex-1">
					<span class="sr-only">Precio mínimo</span>
					<input
						type="number"
						min="0"
						step="any"
						inputmode="decimal"
						placeholder={opciones?.precio_min != null
							? `Desde ${Math.floor(opciones.precio_min)}`
							: 'Desde'}
						value={borrador.min ?? ''}
						oninput={(e) => (borrador.min = precio(e.currentTarget.value))}
						class="w-full border-0 border-b border-current bg-transparent px-0 text-editorial focus:ring-0"
					/>
				</label>
				<span aria-hidden="true">—</span>
				<label class="flex-1">
					<span class="sr-only">Precio máximo</span>
					<input
						type="number"
						min="0"
						step="any"
						inputmode="decimal"
						placeholder={opciones?.precio_max != null
							? `Hasta ${Math.ceil(opciones.precio_max)}`
							: 'Hasta'}
						value={borrador.max ?? ''}
						oninput={(e) => (borrador.max = precio(e.currentTarget.value))}
						class="w-full border-0 border-b border-current bg-transparent px-0 text-editorial focus:ring-0"
					/>
				</label>
			</div>
		</fieldset>

		<fieldset class="space-y-3">
			<legend class="mb-3 font-semibold">Disponibilidad</legend>
			{#if opciones?.hay_rebajas || borrador.rebaja}
				<label class="flex cursor-pointer items-center gap-3">
					<input
						type="checkbox"
						bind:checked={borrador.rebaja}
						class="size-3.5 border-current text-light-two focus:ring-current dark:bg-dark-one dark:text-dark-two"
					/>
					Solo en rebaja
				</label>
			{/if}
			<label class="flex cursor-pointer items-center gap-3">
				<input
					type="checkbox"
					bind:checked={borrador.disponible}
					class="size-3.5 border-current text-light-two focus:ring-current dark:bg-dark-one dark:text-dark-two"
				/>
				Solo con stock
			</label>
		</fieldset>
	</form>

	{#snippet footer()}
		<div class="grid grid-cols-2 gap-3 text-editorial">
			<button
				type="button"
				onclick={() => aplicar({ ...filtrosVacios(), orden: borrador.orden })}
				class="h-11 border border-current hover:bg-light-one_d dark:hover:bg-dark-one_d"
			>
				Limpiar
			</button>
			<button
				type="submit"
				form="tienda-filtros"
				class="h-11 bg-light-two text-light-one hover:bg-light-three dark:bg-dark-two dark:text-dark-one"
			>
				Ver resultados
			</button>
		</div>
	{/snippet}
</TiendaDrawer>
