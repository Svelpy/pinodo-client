<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { Producto } from '#lib/interfaces/index.ts';
	import ProductoRow from './productoRow.svelte';

	interface Props {
		productos: Producto[];
		onToggleVisible?: (producto: Producto) => void;
		onDelete?: (producto: Producto) => void;
	}

	let { productos, onToggleVisible, onDelete }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="overflow-x-auto">
	<Table class="table-fixed text-sm lg:min-w-[240] xl:min-w-[300]">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class={headClass}>Producto</TableHead>
				<TableHead class="{headClass} w-32">Colores</TableHead>
				<TableHead class="{headClass} hidden w-52 lg:table-cell">Precio</TableHead>
				<TableHead class="{headClass} hidden w-28 lg:table-cell">Stock</TableHead>
				<TableHead class="{headClass} w-40">Visibilidad</TableHead>
				<TableHead class="{headClass} hidden w-36 xl:table-cell">Creado</TableHead>
				<TableHead class="{headClass} hidden w-40 xl:table-cell">Actualizado</TableHead>
				<TableHead class="h-11 w-14 px-2">
					<span class="sr-only">Acciones</span>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each productos as producto (producto.id)}
				<ProductoRow {producto} {onToggleVisible} {onDelete} />
			{/each}
		</TableBody>
	</Table>
</div>
