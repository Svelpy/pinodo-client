<script lang="ts">
	import { ChevronRightIcon } from '#lib/icons/outline/index.ts';
	import type { NavSection } from '#lib/interfaces/index.ts';

	interface Props {
		/** Navegación ya filtrada por rol (filterNavigation) */
		sections: NavSection[];
	}

	let { sections }: Props = $props();

	/** Texto de ayuda de cada módulo; los ids son los de PANEL_NAVIGATION */
	const DESCRIPCIONES: Record<string, string> = {
		venta: 'Cobra en caja y consulta el historial de ventas.',
		productos: 'Catálogo con colores, tallas, precios y stock.',
		secciones: 'Agrupa el catálogo en secciones de la tienda.',
		archivos: 'Imágenes y archivos subidos.',
		usuarios: 'Cuentas del equipo y sus roles.',
		'mi-negocio': 'Datos, logo y contacto de la tienda.',
		perfil: 'Tus datos y tu contraseña.'
	};

	// El inicio no se enlaza a sí mismo
	const visibles = $derived(
		sections
			.map((section) => ({
				...section,
				items: section.items.filter((item) => item.id !== 'inicio')
			}))
			.filter((section) => section.items.length > 0)
	);
</script>

{#each visibles as section (section.id)}
	<section aria-labelledby="inicio-{section.id}" class="space-y-3">
		<h2
			id="inicio-{section.id}"
			class="text-xs font-semibold tracking-wide text-light-two_d uppercase dark:text-dark-two_d"
		>
			{section.label}
		</h2>
		<ul class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each section.items as item (item.id)}
				{@const Icon = item.icon}
				<li
					class="flex h-full flex-col border border-light-one_d bg-light-one transition-colors hover:border-light-two dark:border-dark-one_d dark:bg-dark-one dark:hover:border-dark-two"
				>
					<a href={item.href} class="group flex flex-1 items-start gap-3 p-4">
						<Icon class="mt-0.5 size-5 shrink-0 text-light-two dark:text-dark-two" />
						<span class="min-w-0 flex-1">
							<span
								class="block font-semibold text-light-two group-hover:underline dark:text-dark-two"
							>
								{item.label}
							</span>
							{#if DESCRIPCIONES[item.id]}
								<span class="mt-0.5 block text-xs text-light-two_d dark:text-dark-two_d">
									{DESCRIPCIONES[item.id]}
								</span>
							{/if}
						</span>
						<ChevronRightIcon
							class="size-4 shrink-0 self-center text-light-two_d transition-transform group-hover:translate-x-0.5 dark:text-dark-two_d"
						/>
					</a>
					{#if item.children?.length}
						<div
							class="flex flex-wrap gap-2 border-t border-light-one_d px-4 py-3 dark:border-dark-one_d"
						>
							{#each item.children as child (child.id)}
								<a
									href={child.href}
									class="border border-light-one_d px-2 py-1 text-xs text-light-two_d transition-colors hover:border-light-two hover:text-light-two dark:border-dark-one_d dark:text-dark-two_d dark:hover:border-dark-two dark:hover:text-dark-two"
								>
									{child.label}
								</a>
							{/each}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/each}
