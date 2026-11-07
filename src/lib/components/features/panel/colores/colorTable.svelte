<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { Color } from '#lib/interfaces/index.ts';
	import ColorRow from './colorRow.svelte';

	interface Props {
		colores: Color[];
		onEdit?: (color: Color) => void;
		onDelete?: (color: Color) => void;
	}

	let { colores, onEdit, onDelete }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class="{headClass} w-[50%]">Color</TableHead>
				<TableHead class={headClass}>Código</TableHead>
				<TableHead class="{headClass} hidden w-48 lg:table-cell">Creado</TableHead>
				<TableHead class="h-11 w-14 px-2">
					<span class="sr-only">Acciones</span>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each colores as color (color.id)}
				<ColorRow {color} {onEdit} {onDelete} />
			{/each}
		</TableBody>
	</Table>
</div>
