<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { asset, resolve } from '$app/paths';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';
	import { APP_SITE_CONFIG } from '#lib/constants/index.ts';
	import { XIcon } from '#lib/icons/outline/index.ts';
	import type { ResolvedPathname } from '$app/types';
	import type { NavSection } from '#lib/interfaces/index.ts';
	import SidebarItem from './sidebarItem.svelte';
	import StoreMenu from './storeMenu.svelte';

	interface Props {
		sections: NavSection[];
		/** Solo aplica en pantallas < lg; en escritorio el sidebar siempre está visible */
		open: boolean;
		id?: string;
		/** Destino del logo: la página de inicio del rol */
		homeHref?: ResolvedPathname;
	}

	let {
		sections,
		open = $bindable(false),
		id = 'app-sidebar',
		homeHref = resolve('/panel')
	}: Props = $props();

	const isDesktop = new MediaQuery('(min-width: 1024px)', false);
	let closeButton = $state<HTMLButtonElement>();

	function close() {
		open = false;
	}

	// Cerrar el drawer al navegar a otra página
	afterNavigate(close);

	// Si la pantalla pasa a escritorio con el drawer abierto, cerrarlo
	$effect(() => {
		if (isDesktop.current) close();
	});

	// Drawer abierto en móvil: bloquear el scroll del fondo y mover el foco al drawer
	$effect(() => {
		if (!open || isDesktop.current) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		closeButton?.focus();
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<button
		type="button"
		tabindex="-1"
		aria-label="Cerrar menú"
		class="fixed inset-0 z-40 bg-light-black/50 backdrop-blur-sm lg:hidden"
		onclick={close}
		transition:fade={{ duration: 200 }}
	></button>
{/if}

<!-- Cerrado en móvil: fuera de pantalla e `invisible` (sin foco ni lector de pantalla) -->
<aside
	{id}
	aria-label="Navegación principal"
	class={[
		'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-light-three text-light-one transition-[transform,visibility] duration-300 ease-out lg:visible lg:w-64 lg:translate-x-0 dark:bg-dark-one dark:text-dark-two',
		open ? 'visible translate-x-0 ' : 'invisible -translate-x-full'
	]}
>
	<div class="flex h-16 shrink-0 items-center justify-between gap-3 px-5">
		<a href={homeHref} class="flex min-w-0 items-center gap-3">
			<img
				src={asset('images/logo_mark.webp')}
				alt=""
				width="36"
				height="36"
				class="size-9 shrink-0 ring-1 ring-white/20"
			/>
			<span class="truncate text-base font-semibold">{APP_SITE_CONFIG.APP_NAME}</span>
		</a>
		<button
			bind:this={closeButton}
			type="button"
			onclick={close}
			aria-label="Cerrar menú"
			class=" p-1.5 text-light-one/70 transition-colors hover:bg-white/10 hover:text-light-one lg:hidden dark:text-dark-two/70 dark:hover:bg-dark-two/10 dark:hover:text-dark-two"
		>
			<XIcon />
		</button>
	</div>

	<nav class="flex-1 overflow-y-auto px-3 pt-2 pb-6">
		<!-- Sin título visible, como Shopify: las secciones solo se separan con espacio -->
		{#each sections as section (section.id)}
			<ul aria-label={section.label} class="mt-5 space-y-0.5 first:mt-0">
				{#each section.items as item (item.id)}
					<li>
						<SidebarItem {item} pathname={page.url.pathname} />
					</li>
				{/each}
			</ul>
		{/each}
	</nav>

	<!-- Tienda y cuenta del usuario, como en Shopify: el menú se abre hacia arriba -->
	<div class="shrink-0 px-3 pt-2 pb-3">
		<StoreMenu />
	</div>
</aside>
