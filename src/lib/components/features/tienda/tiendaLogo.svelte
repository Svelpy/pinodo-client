<script lang="ts">
	import { resolve } from '$app/paths';
	import type { TiendaConfigPublica } from '#lib/interfaces/index.ts';
	import { cn, imagenUrl } from '#lib/utils/index.ts';

	interface Props {
		tienda: TiendaConfigPublica;
		/** Clases del <img> (alto máximo según dónde se muestre) */
		class?: string;
		/** Al seguir el enlace (cierra el drawer en móvil) */
		onNavigate?: () => void;
	}

	let { tienda, class: className, onNavigate }: Props = $props();
</script>

<!--
	Logo de la tienda como marca/publicidad (sidebar, menú móvil, footer). Puede incluir el nombre
	del negocio, por eso el header muestra solo el nombre en texto y no este logo.
-->
{#if tienda.logo_url}
	<a
		href={resolve('/(tienda)')}
		onclick={onNavigate}
		class="inline-block"
		aria-label="{tienda.nombre_tienda}, inicio"
	>
		<img
			src={imagenUrl(tienda.logo_url, 400)}
			alt={tienda.nombre_tienda}
			loading="lazy"
			decoding="async"
			class={cn('h-auto max-h-20 w-auto max-w-44 object-contain', className)}
		/>
	</a>
{/if}
