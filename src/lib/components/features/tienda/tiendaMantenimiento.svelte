<script lang="ts">
	import type { TiendaConfigPublica } from '#lib/interfaces/index.ts';
	import { whatsappUrl } from '#lib/utils/index.ts';

	interface Props {
		tienda: TiendaConfigPublica;
	}

	let { tienda }: Props = $props();

	const whatsapp = $derived(whatsappUrl(tienda.whatsapp));
</script>

<svelte:head>
	<title>{tienda.nombre_tienda} · Volvemos pronto</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -- enlaces externos (wa.me, tel:, mailto:) -->
<main
	class="flex min-h-dvh flex-col items-center justify-center bg-light-one px-6 text-center text-light-two dark:bg-dark-one dark:text-dark-two"
>
	{#if tienda.logo_url}
		<img
			src={tienda.logo_url}
			alt={tienda.nombre_tienda}
			class="mb-12 h-12 w-auto max-w-[70vw] object-contain"
		/>
	{:else}
		<p class="mb-12 font-editorial text-2xl font-light tracking-[0.2em] uppercase md:text-4xl">
			{tienda.nombre_tienda}
		</p>
	{/if}

	<h1 class="text-editorial text-sm font-semibold">Volvemos pronto</h1>
	<p class="mt-4 max-w-md text-sm leading-relaxed text-light-two_d dark:text-dark-two_d">
		La tienda en línea no está disponible en este momento. Estamos trabajando para volver a
		atenderte lo antes posible. Gracias por tu paciencia.
	</p>

	{#if whatsapp || tienda.telefono || tienda.email_contacto}
		<div class="mt-10 space-y-2 text-editorial">
			<p class="text-light-two_d dark:text-dark-two_d">Mientras tanto, escríbenos</p>
			{#if whatsapp}
				<p>
					<a href={whatsapp} target="_blank" rel="noopener" class="underline underline-offset-4"
						>WhatsApp</a
					>
				</p>
			{/if}
			{#if tienda.telefono}
				<p>
					<a href="tel:{tienda.telefono.replace(/\s/g, '')}" class="underline underline-offset-4"
						>{tienda.telefono}</a
					>
				</p>
			{/if}
			{#if tienda.email_contacto}
				<p class="tracking-normal normal-case">
					<a href="mailto:{tienda.email_contacto}" class="underline underline-offset-4"
						>{tienda.email_contacto}</a
					>
				</p>
			{/if}
		</div>
	{/if}
</main>
