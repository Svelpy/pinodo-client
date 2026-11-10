<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Component } from 'svelte';
	import type { Role } from '#lib/config/index.ts';
	import type { StaticRouteId } from '#lib/config/routeAccess.config.ts';
	import {
		ArrowUpRightIcon,
		PackageIcon,
		PlusIcon,
		ShoppingCartIcon
	} from '#lib/icons/outline/index.ts';
	import { canAccessRoute } from '#lib/utils/index.ts';

	interface Props {
		role: Role | null;
	}

	let { role }: Props = $props();

	interface Atajo {
		id: string;
		label: string;
		descripcion: string;
		route: StaticRouteId;
		icon: Component<{ class?: string }>;
		/** Se abre en otra pestaña (la tienda pública) */
		externo?: boolean;
	}

	// Las tareas más frecuentes del día a día; cada rol ve solo las páginas que puede abrir
	const ATAJOS: Atajo[] = [
		{
			id: 'nueva-venta',
			label: 'Nueva venta',
			descripcion: 'Registra una venta en caja',
			route: '/panel/ventas',
			icon: ShoppingCartIcon
		},
		{
			id: 'nuevo-producto',
			label: 'Nuevo producto',
			descripcion: 'Agrega un producto al catálogo',
			route: '/panel/productos/nuevo',
			icon: PlusIcon
		},
		{
			id: 'productos',
			label: 'Ver productos',
			descripcion: 'Precios, stock y visibilidad',
			route: '/panel/productos',
			icon: PackageIcon
		},
		{
			id: 'tienda',
			label: 'Ver tienda',
			descripcion: 'Abre la tienda pública',
			route: '/(tienda)',
			icon: ArrowUpRightIcon,
			externo: true
		}
	];

	const atajos = $derived(
		ATAJOS.filter((atajo) => atajo.externo || canAccessRoute(role, atajo.route))
	);
</script>

{#if atajos.length > 0}
	<section aria-labelledby="inicio-atajos" class="space-y-3">
		<h2
			id="inicio-atajos"
			class="text-xs font-semibold tracking-wide text-light-two_d uppercase dark:text-dark-two_d"
		>
			Acciones rápidas
		</h2>
		<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{#each atajos as atajo (atajo.id)}
				{@const Icon = atajo.icon}
				<li>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() en el href -->
					<a
						href={resolve(atajo.route)}
						target={atajo.externo ? '_blank' : undefined}
						rel={atajo.externo ? 'noopener' : undefined}
						class="group flex h-full items-center gap-3 border border-light-one_d bg-light-one p-4 transition-colors hover:border-light-two dark:border-dark-one_d dark:bg-dark-one dark:hover:border-dark-two"
					>
						<span
							class="flex size-10 shrink-0 items-center justify-center bg-light-two text-light-one dark:bg-dark-two dark:text-dark-one"
						>
							<Icon class="size-5" />
						</span>
						<span class="min-w-0">
							<span class="block font-semibold text-light-two dark:text-dark-two">
								{atajo.label}
							</span>
							<span class="block text-xs text-light-two_d dark:text-dark-two_d">
								{atajo.descripcion}
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}
