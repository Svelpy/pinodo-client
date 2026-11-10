<script lang="ts">
	import { resolve } from '$app/paths';
	import { LegalLinks } from '#lib/components/features/legal/index.ts';
	import type { TiendaConfigPublica } from '#lib/interfaces/index.ts';
	import { whatsappUrl } from '#lib/utils/index.ts';
	import TiendaLogo from './tiendaLogo.svelte';

	interface Props {
		tienda: TiendaConfigPublica;
	}

	let { tienda }: Props = $props();

	const whatsapp = $derived(whatsappUrl(tienda.whatsapp));
	const horario = $derived(Object.entries(tienda.horario ?? {}));
	const redes = $derived(
		Object.entries(tienda.redes_sociales ?? {}).filter(([, url]) => /^https?:\/\//.test(url))
	);
	const telefonoHref = $derived(
		tienda.telefono ? `tel:${tienda.telefono.replace(/\s/g, '')}` : null
	);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- enlaces externos (redes, mapa, wa.me, tel:, mailto:) -->
<footer
	id="contacto"
	class="mt-24 border-t border-light-two/15 px-4 pt-12 pb-10 text-editorial md:px-10 xl:px-12 dark:border-dark-two/15"
>
	<!-- Marca: el único lugar con logo visible en todas las páginas y tamaños -->
	<div class="mb-12 flex flex-col items-start gap-4">
		{#if tienda.logo_url}
			<TiendaLogo {tienda} class="max-h-24 max-w-56" />
		{:else}
			<p class="font-editorial text-lg font-light tracking-[0.2em] uppercase">
				{tienda.nombre_tienda}
			</p>
		{/if}
		{#if tienda.descripcion}
			<p class="max-w-md text-sm tracking-normal text-light-two_d normal-case dark:text-dark-two_d">
				{tienda.descripcion}
			</p>
		{/if}
	</div>

	<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
		<section aria-labelledby="footer-contacto">
			<h2 id="footer-contacto" class="mb-4 font-semibold">Contacto</h2>
			<ul class="space-y-2 normal-case">
				{#if whatsapp}
					<li>
						<a href={whatsapp} target="_blank" rel="noopener" class="uppercase hover:underline"
							>WhatsApp {tienda.whatsapp}</a
						>
					</li>
				{/if}
				{#if telefonoHref}
					<li>
						<a href={telefonoHref} class="uppercase hover:underline">Tel. {tienda.telefono}</a>
					</li>
				{/if}
				{#if tienda.email_contacto}
					<li>
						<a href="mailto:{tienda.email_contacto}" class="tracking-normal hover:underline">
							{tienda.email_contacto}
						</a>
					</li>
				{/if}
			</ul>
		</section>

		{#if tienda.direccion || tienda.ciudad}
			<section aria-labelledby="footer-tienda">
				<h2 id="footer-tienda" class="mb-4 font-semibold">Tienda</h2>
				<address class="space-y-2 not-italic">
					{#if tienda.direccion}<p>{tienda.direccion}</p>{/if}
					{#if tienda.ciudad}<p>{tienda.ciudad}</p>{/if}
					{#if tienda.map_url}
						<p>
							<a
								href={tienda.map_url}
								target="_blank"
								rel="noopener"
								class="underline underline-offset-4"
							>
								Ver en el mapa
							</a>
						</p>
					{/if}
				</address>
			</section>
		{/if}

		{#if horario.length > 0}
			<section aria-labelledby="footer-horario">
				<h2 id="footer-horario" class="mb-4 font-semibold">Horario</h2>
				<dl class="space-y-2">
					{#each horario as [dia, horas] (dia)}
						<div class="flex justify-between gap-4 sm:max-w-56">
							<dt>{dia}</dt>
							<dd class="tabular-nums">{horas}</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/if}

		{#if redes.length > 0}
			<section aria-labelledby="footer-redes">
				<h2 id="footer-redes" class="mb-4 font-semibold">Síguenos</h2>
				<ul class="space-y-2">
					{#each redes as [red, url] (red)}
						<li>
							<a href={url} target="_blank" rel="noopener me" class="hover:underline">{red}</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>

	<div
		class="mt-14 flex flex-col items-center justify-between gap-4 text-light-two_d sm:flex-row dark:text-dark-two_d"
	>
		<p>© {new Date().getFullYear()} {tienda.nombre_tienda}</p>
		<LegalLinks class="tracking-normal normal-case" />
		<a href={resolve('/auth/sign-in')} class="hover:underline">Acceso tienda</a>
	</div>
</footer>
