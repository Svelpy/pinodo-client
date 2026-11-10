<script lang="ts">
	import type { TiendaConfigPublica } from '#lib/interfaces/index.ts';
	import { whatsappUrl } from '#lib/utils/index.ts';

	interface Props {
		tienda: TiendaConfigPublica;
	}

	let { tienda }: Props = $props();

	const whatsapp = $derived(whatsappUrl(tienda.whatsapp));
	const ubicacion = $derived([tienda.direccion, tienda.ciudad].filter(Boolean).join(', '));
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- enlaces externos (wa.me, tel:, mailto:) -->
<!-- Datos de contacto de la tienda, tal como los configuró el dueño en "Mi negocio" -->
<ul>
	<li><strong>Tienda:</strong> {tienda.nombre_tienda}</li>
	{#if ubicacion}
		<li><strong>Dirección:</strong> {ubicacion}</li>
	{/if}
	{#if tienda.email_contacto}
		<li>
			<strong>Correo electrónico:</strong>
			<a href="mailto:{tienda.email_contacto}">{tienda.email_contacto}</a>
		</li>
	{/if}
	{#if whatsapp}
		<li>
			<strong>WhatsApp:</strong>
			<a href={whatsapp} target="_blank" rel="noopener">{tienda.whatsapp}</a>
		</li>
	{/if}
	{#if tienda.telefono}
		<li>
			<strong>Teléfono:</strong>
			<a href="tel:{tienda.telefono.replace(/\s/g, '')}">{tienda.telefono}</a>
		</li>
	{/if}
</ul>
