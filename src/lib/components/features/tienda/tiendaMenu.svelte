<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { scale, slide } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import type { TiendaCategoriaNodo, TiendaSeccion } from '#lib/interfaces/index.ts';
	import { duracion, slugIdParam, ubicarCategoria } from '#lib/utils/index.ts';

	interface Props {
		navegacion: TiendaSeccion[];
		/** Sección de la página actual (se muestra desplegada) */
		seccionActiva?: string;
		/** Categoría de la página actual: se marca y se despliegan sus ancestros */
		categoriaActiva?: string;
		/** true en la página "ver todo" de la sección activa */
		verTodoActivo?: boolean;
		/** Al elegir un enlace (cierra el drawer en móvil) */
		onNavigate?: () => void;
	}

	let {
		navegacion,
		seccionActiva,
		categoriaActiva,
		verTodoActivo = false,
		onNavigate
	}: Props = $props();

	// Sección desplegada: sigue a la página actual, pero el usuario puede abrir otra sin navegar
	let abierta = $derived<string | null>(seccionActiva ?? navegacion[0]?.id ?? null);

	const rutaActiva = $derived(
		new Set(
			categoriaActiva
				? (ubicarCategoria(navegacion, categoriaActiva)?.ruta.map((c) => c.id) ?? [])
				: []
		)
	);

	const numero = (index: number) => String(index + 1).padStart(2, '0');
</script>

{#snippet marcador(activo: boolean)}
	{#if activo}
		<span class="absolute top-1/2 -left-5 -translate-y-1/2" aria-hidden="true">
			<span class="block size-1 rounded-full bg-current" in:scale={{ duration: duracion(250) }}
			></span>
		</span>
	{/if}
{/snippet}

{#snippet categorias(nodos: TiendaCategoriaNodo[], nivel: number)}
	<!-- Las subcategorías se despliegan con slide (el primer nivel lo anima su sección) -->
	<ul
		class={nivel > 0 ? 'mt-2 space-y-2 pl-4' : 'space-y-2.5'}
		transition:slide={{ duration: duracion(250), easing: cubicOut }}
	>
		{#each nodos as nodo (nodo.data.id)}
			{@const activa = nodo.data.id === categoriaActiva}
			<li>
				<a
					href={resolve('/(tienda)/[categoria=categoria]', {
						categoria: slugIdParam(nodo.data, 'l')
					})}
					onclick={onNavigate}
					aria-current={activa ? 'page' : undefined}
					class="relative inline-block py-0.5 hover:underline hover:underline-offset-4"
				>
					{@render marcador(activa)}
					{nodo.data.nombre}
				</a>
				{#if nodo.children.length > 0 && rutaActiva.has(nodo.data.id)}
					{@render categorias(nodo.children, nivel + 1)}
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<nav aria-label="Secciones de la tienda" class="text-editorial">
	<ul class="space-y-3">
		{#each navegacion as seccion, index (seccion.id)}
			{@const expandida = abierta === seccion.id}
			<li>
				<button
					type="button"
					aria-expanded={expandida}
					aria-controls="menu-seccion-{seccion.id}"
					onclick={() => (abierta = expandida ? null : seccion.id)}
					class={[
						'flex items-center gap-2 py-0.5 text-left hover:underline hover:underline-offset-4',
						expandida && 'font-semibold'
					]}
				>
					<span class="text-light-two_d dark:text-dark-two_d">| {numero(index)} |</span>
					{seccion.nombre}
				</button>

				{#if expandida}
					<div
						id="menu-seccion-{seccion.id}"
						class="mt-3 mb-5 space-y-2.5 pl-14"
						transition:slide={{ duration: duracion(300), easing: cubicOut }}
					>
						<a
							href={resolve('/(tienda)/[seccion=seccion]', { seccion: seccion.slug })}
							onclick={onNavigate}
							aria-current={verTodoActivo && seccion.id === seccionActiva ? 'page' : undefined}
							class="relative inline-block py-0.5 hover:underline hover:underline-offset-4"
						>
							{@render marcador(verTodoActivo && seccion.id === seccionActiva)}
							Ver todo
						</a>
						{@render categorias(seccion.categorias.data, 0)}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
</nav>
