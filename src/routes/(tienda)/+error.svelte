<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const noEncontrado = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{noEncontrado ? 'Página no encontrada' : 'Algo salió mal'}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="flex flex-col items-center py-24 text-center text-editorial">
	<p class="text-light-two_d tabular-nums dark:text-dark-two_d">{page.status}</p>
	<h1 class="mt-3 text-sm font-semibold">
		{noEncontrado ? 'Página no encontrada' : 'Algo salió mal'}
	</h1>
	<p
		class="mt-4 max-w-md text-sm tracking-normal text-light-two_d normal-case dark:text-dark-two_d"
	>
		{noEncontrado
			? 'El producto o la sección que buscas ya no está disponible o el enlace cambió.'
			: (page.error?.message ?? 'Inténtalo de nuevo en unos minutos.')}
	</p>
	<a
		href={resolve('/(tienda)')}
		class="mt-10 inline-flex h-11 items-center border border-current px-8 hover:bg-light-two hover:text-light-one dark:hover:bg-dark-two dark:hover:text-dark-one"
	>
		Ver novedades
	</a>
</section>
