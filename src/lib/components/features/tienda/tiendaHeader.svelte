<script lang="ts">
	import { fly } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SearchIcon } from '#lib/icons/outline/index.ts';
	import type { TiendaConfigPublica } from '#lib/interfaces/index.ts';
	import { duracion } from '#lib/utils/index.ts';

	interface Props {
		tienda: TiendaConfigPublica;
		cantidad: number;
		menuAbierto: boolean;
		onMenu: () => void;
		onCesta: () => void;
	}

	let { tienda, cantidad, menuAbierto, onMenu, onCesta }: Props = $props();

	const enBusqueda = $derived(page.route.id === '/(tienda)/buscar');
	const q = $derived(enBusqueda ? (page.url.searchParams.get('q') ?? '') : '');
</script>

<header
	class="sticky top-0 z-30 bg-light-one/95 backdrop-blur-sm supports-backdrop-filter:bg-light-one/85 dark:bg-dark-one/95 dark:supports-backdrop-filter:bg-dark-one/85"
>
	<div
		class="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:gap-4 md:h-24 md:px-10 xl:px-12"
	>
		<!-- Menú: dos líneas finas -->
		<div class="flex items-center">
			<button
				type="button"
				onclick={onMenu}
				aria-label={menuAbierto ? 'Ocultar menú' : 'Abrir menú'}
				aria-expanded={menuAbierto}
				class="group -ml-2 flex h-10 w-12 flex-col justify-center gap-[7px] px-2 md:w-24"
			>
				<span class="block h-px w-full bg-current transition-transform group-hover:scale-x-90"
				></span>
				<span class="block h-px w-full bg-current transition-transform group-hover:scale-x-75"
				></span>
			</button>
		</div>

		<a
			href={resolve('/(tienda)')}
			class="flex items-center justify-center"
			aria-label="{tienda.nombre_tienda}, inicio"
		>
			{#if tienda.logo_url}
				<img
					src={tienda.logo_url}
					alt={tienda.nombre_tienda}
					class="h-8 w-auto max-w-[44vw] object-contain md:h-11"
				/>
			{:else}
				<span
					class="block truncate text-base font-light tracking-[0.25em] uppercase sm:text-lg sm:tracking-[0.35em] md:text-3xl md:tracking-[0.4em]"
				>
					{tienda.nombre_tienda}
				</span>
			{/if}
		</a>

		<div class="flex items-center justify-end gap-3 text-editorial sm:gap-5 md:gap-8">
			<form
				method="GET"
				action={resolve('/(tienda)/buscar')}
				role="search"
				class="hidden w-48 border-b border-current md:block xl:w-56"
			>
				<label class="sr-only" for="tienda-buscar">Buscar productos</label>
				<input
					id="tienda-buscar"
					name="q"
					type="search"
					value={q}
					maxlength="100"
					placeholder="BUSCAR"
					autocomplete="off"
					class="w-full border-0 bg-transparent px-0 pt-0 pb-1 text-right text-editorial placeholder:text-current focus:ring-0 focus:outline-none"
				/>
			</form>
			<a href={resolve('/(tienda)/buscar')} class="p-1 md:hidden" aria-label="Buscar">
				<SearchIcon class="size-5 stroke-[1.25]" />
			</a>

			<button
				type="button"
				onclick={onCesta}
				class="flex items-center gap-2 hover:underline hover:underline-offset-4"
				aria-label="Cesta, {cantidad} {cantidad === 1 ? 'prenda' : 'prendas'}"
			>
				<span class="hidden sm:inline">Cesta</span>
				<span
					class="inline-flex min-w-6 items-end justify-center overflow-hidden border-b border-l border-current px-1 leading-none tabular-nums"
				>
					<!-- El número sube al agregar una prenda -->
					{#key cantidad}
						<span class="inline-block" in:fly={{ y: 10, duration: duracion(300) }}>{cantidad}</span>
					{/key}
				</span>
			</button>
		</div>
	</div>
</header>
