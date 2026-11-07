<script lang="ts">
	import { Badge } from '#lib/components/ui/index.ts';
	import { ChevronDownIcon } from '#lib/icons/outline/index.ts';
	import type { CategoriaArbolNodo, CategoriaItem } from '#lib/interfaces/index.ts';
	import { formatBoolean } from '#lib/utils/index.ts';
	import CategoriaActions from './categoriaActions.svelte';
	// Un componente puede importarse a sí mismo para renderizar su propio árbol
	import CategoriaNodo from './categoriaNodo.svelte';

	interface Props {
		nodo: CategoriaArbolNodo;
		/** Nivel de anidación (0 = categoría raíz de la sección) */
		depth?: number;
		onEdit?: (categoria: CategoriaItem) => void;
		onCreateChild?: (categoria: CategoriaItem) => void;
		onDelete?: (categoria: CategoriaItem) => void;
	}

	let { nodo, depth = 0, onEdit, onCreateChild, onDelete }: Props = $props();

	const categoria = $derived(nodo.data);
	const children = $derived(nodo.children);
	const hasChildren = $derived(children.length > 0);

	// Se muestran desplegadas; el estado vive en el nodo, que se conserva al recargar el árbol
	let expanded = $state(true);
	const groupId = $props.id();
</script>

<li>
	<div
		class="flex items-center gap-1 border-t border-light-one_d py-1 pr-2 hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
		style:padding-left="{depth * 1.25 + 0.5}rem"
	>
		{#if hasChildren}
			<button
				type="button"
				onclick={() => (expanded = !expanded)}
				aria-expanded={expanded}
				aria-controls="{groupId}-hijas"
				aria-label="{expanded ? 'Contraer' : 'Expandir'} {categoria.nombre}"
				class="inline-flex size-9 shrink-0 items-center justify-center text-light-two_d transition-colors hover:text-light-two focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none dark:text-dark-two_d dark:hover:text-dark-two dark:focus-visible:ring-dark-three"
			>
				<ChevronDownIcon class="size-4 transition-transform {expanded ? '' : '-rotate-90'}" />
			</button>
		{:else}
			<!-- Reserva el ancho del botón para alinear los nombres de un mismo nivel -->
			<span class="size-9 shrink-0" aria-hidden="true"></span>
		{/if}

		<div class="min-w-0 flex-1">
			<p class="truncate font-medium text-light-two dark:text-dark-two">{categoria.nombre}</p>
			<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">
				/{categoria.slug}
				{#if hasChildren}
					· {children.length}
					{children.length === 1 ? 'subcategoría' : 'subcategorías'}
				{/if}
			</p>
		</div>

		<Badge variant={categoria.is_visible ? 'success' : 'secondary'} dot class="shrink-0">
			{formatBoolean(categoria.is_visible, { trueLabel: 'Visible', falseLabel: 'Oculta' })}
		</Badge>

		<div class="shrink-0">
			<CategoriaActions {categoria} {onEdit} {onCreateChild} {onDelete} />
		</div>
	</div>

	{#if hasChildren && expanded}
		<ul id="{groupId}-hijas">
			{#each children as child (child.data.id)}
				<CategoriaNodo nodo={child} depth={depth + 1} {onEdit} {onCreateChild} {onDelete} />
			{/each}
		</ul>
	{/if}
</li>
