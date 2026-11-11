<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Header, Sidebar } from '#lib/components/ui/index.ts';
	import { PANEL_NAVIGATION } from '#lib/config/navigation.config.ts';
	import { ACCESS_TOKEN_KEY } from '#lib/constants/index.ts';
	import { authService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import {
		buildSignInUrl,
		filterNavigation,
		findActiveNavItem,
		getHomeRoute
	} from '#lib/utils/index.ts';

	let { children } = $props();

	const SIDEBAR_ID = 'panel-sidebar';

	let sidebarOpen = $state(false);

	const sections = $derived(filterNavigation(PANEL_NAVIGATION, $currentRole));
	const activeItem = $derived(findActiveNavItem(sections, page.url.pathname));
	const homeHref = $derived(resolve($currentRole ? getHomeRoute($currentRole) : '/panel'));

	// La sesión se perdió sin que el usuario la cerrara (refresh rechazado o tokens borrados): al login
	// con aviso, recordando la página actual para volver tras iniciar sesión
	$effect(() => {
		const unsubscribe = authService.onSessionExpired(() => {
			const current = page.url.pathname + page.url.search;
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- buildSignInUrl ya resuelve la ruta
			void goto(buildSignInUrl('expired', current), { replaceState: true });
		});
		return unsubscribe;
	});

	// Detecta que desaparecieron los tokens con la página abierta. Borrarlos desde otra pestaña dispara
	// `storage`; hacerlo desde DevTools en esta no, así que también se revisa al volver a la pestaña
	function checkSession() {
		if (!authService.getToken()) authService.expireSession();
	}

	function handleStorage(event: StorageEvent) {
		// key === null: se limpió todo el localStorage
		if (event.key === null || event.key === ACCESS_TOKEN_KEY) checkSession();
	}

	function handleVisibilityChange() {
		if (document.visibilityState === 'visible') checkSession();
	}
</script>

<svelte:window onstorage={handleStorage} onfocus={checkSession} />
<svelte:document onvisibilitychange={handleVisibilityChange} />

<!-- Escritorio: el sidebar se funde con el fondo y el contenido flota en una tarjeta con su propio
     scroll (como Shopify). Móvil: la tarjeta ocupa toda la pantalla y el sidebar es un drawer. -->
<div
	class="min-h-dvh bg-light-three lg:h-dvh lg:overflow-hidden lg:py-2 lg:pr-2 lg:pl-64 dark:bg-dark-one"
>
	<Sidebar {sections} bind:open={sidebarOpen} id={SIDEBAR_ID} {homeHref} />
	<div
		class="relative flex flex-col bg-light-one lg:h-full lg:min-h-0 lg:overflow-y-auto lg:rounded-xl dark:bg-dark-one_d"
	>
		<Header
			title={activeItem?.label ?? 'Panel'}
			icon={activeItem?.icon}
			{sidebarOpen}
			sidebarId={SIDEBAR_ID}
			onToggleSidebar={() => (sidebarOpen = !sidebarOpen)}
		/>

		<main class="flex-1 p-4 md:p-6 lg:p-8">
			{@render children()}
		</main>
	</div>
</div>
