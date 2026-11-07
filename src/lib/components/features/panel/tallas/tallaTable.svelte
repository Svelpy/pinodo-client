<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { Talla } from '#lib/interfaces/index.ts';
	import TallaRow from './tallaRow.svelte';

	interface Props {
		tallas: Talla[];
		onEdit?: (talla: Talla) => void;
		onDelete?: (talla: Talla) => void;
	}

	let { tallas, onEdit, onDelete }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class="{headClass} w-[50%]">Talla</TableHead>
				<TableHead class={headClass}>Creada</TableHead>
				<TableHead class="h-11 w-14 px-2">
					<span class="sr-only">Acciones</span>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each tallas as talla (talla.id)}
				<TallaRow {talla} {onEdit} {onDelete} />
			{/each}
		</TableBody>
	</Table>
</div>
