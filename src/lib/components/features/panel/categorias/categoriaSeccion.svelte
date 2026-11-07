<script lang="ts">
	import { Badge, Button } from '#lib/components/ui/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { CategoriaItem, SeccionArbol } from '#lib/interfaces/index.ts';
	import { formatBoolean } from '#lib/utils/index.ts';
	import CategoriaNodo from './categoriaNodo.svelte';

	interface Props {
		grupo: SeccionArbol;
		onEdit?: (categoria: CategoriaItem) => void;
		onCreateChild?: (categoria: CategoriaItem) => void;
		onDelete?: (categoria: CategoriaItem) => void;
		/** Crear una categoría raíz en esta sección */
		onCreate?: (seccionId: string) => void;
	}

	let { grupo, onEdit, onCreateChild, onDelete, onCreate }: Props = $props();

	const seccion = $derived(grupo.seccion);
	const nodos = $derived(grupo.categorias.data);
	const total = $derived(grupo.categorias.total);
</script>

<article
	class="overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	<header
		class="flex flex-wrap items-center gap-x-3 gap-y-2 bg-light-one_d/50 px-4 py-3 dark:bg-dark-one_d/50"
	>
		<div class="min-w-0 flex-1">
			<h2 class="truncate font-semibold text-light-two dark:text-dark-two">{seccion.nombre}</h2>
			<p class="text-xs text-light-two_d dark:text-dark-two_d">
				{total}
				{total === 1 ? 'categoría' : 'categorías'}
			</p>
		</div>
		<Badge variant={seccion.is_visible ? 'success' : 'secondary'} dot>
			{formatBoolean(seccion.is_visible, { trueLabel: 'Visible', falseLabel: 'Oculta' })}
		</Badge>
		{#if onCreate}
			<Button variant="outline" size="sm" onclick={() => onCreate(seccion.id)}>
				{#snippet leftIcon()}<PlusIcon class="size-4" />{/snippet}
				Categoría
			</Button>
		{/if}
	</header>

	{#if nodos.length === 0}
		<p
			class="border-t border-light-one_d px-4 py-6 text-center text-sm text-light-two_d dark:border-dark-one_d dark:text-dark-two_d"
		>
			Esta sección aún no tiene categorías.
		</p>
	{:else}
		<ul aria-label="Categorías de {seccion.nombre}">
			{#each nodos as nodo (nodo.data.id)}
				<CategoriaNodo {nodo} {onEdit} {onCreateChild} {onDelete} />
			{/each}
		</ul>
	{/if}
</article>
