<script lang="ts">
	import { fly } from 'svelte/transition';
	import { beforeNavigate } from '$app/navigation';
	import { updated } from '$app/state';
	import { RefreshIcon, XIcon } from '#lib/icons/outline/index.ts';

	let dismissed = $state(false);

	// SvelteKit detecta los despliegues nuevos (al volver a la app y cada hora). Se le pide al
	// navegador que descargue ya el service worker nuevo con los archivos de esa versión
	$effect(() => {
		if (!updated.current) return;
		navigator.serviceWorker?.getRegistration().then((registration) => registration?.update());
	});

	// La versión nueva se aplica sola en la próxima navegación: se carga la página completa en vez
	// de seguir en la app vieja. Así nunca se recarga en medio de un formulario a medio llenar
	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) location.href = to.url.href;
	});
</script>

{#if updated.current && !dismissed}
	<!-- En móvil queda por encima de las pestañas fijas del área de clientes -->
	<div
		role="status"
		transition:fly={{ y: 16, duration: 200 }}
		class="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-light-two py-2 pr-2 pl-4 text-light-one shadow-lg md:bottom-6 dark:bg-dark-two dark:text-dark-one"
	>
		<p class="flex-1 text-sm font-medium">Hay una nueva versión disponible</p>
		<button
			type="button"
			onclick={() => location.reload()}
			class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-light-one px-3 py-2 text-sm font-semibold text-light-two transition-transform focus-visible:ring-2 focus-visible:ring-light-one/60 focus-visible:outline-none active:scale-95 dark:bg-dark-one dark:text-dark-two dark:focus-visible:ring-dark-one/60"
		>
			<RefreshIcon class="size-4" />
			Actualizar
		</button>
		<button
			type="button"
			aria-label="Cerrar aviso"
			onclick={() => (dismissed = true)}
			class="shrink-0 rounded-lg p-2 text-light-one/70 transition-colors hover:text-light-one focus-visible:ring-2 focus-visible:ring-light-one/60 focus-visible:outline-none dark:text-dark-one/70 dark:hover:text-dark-one dark:focus-visible:ring-dark-one/60"
		>
			<XIcon class="size-4" />
		</button>
	</div>
{/if}
