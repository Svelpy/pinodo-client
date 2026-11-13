<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { RentabilidadSku } from '#lib/interfaces/index.ts';
	import FinanzasRentabilidadRow from './finanzasRentabilidadRow.svelte';

	interface Props {
		skus: RentabilidadSku[];
	}

	let { skus }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="relative overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class={headClass}>Prenda</TableHead>
				<TableHead class="{headClass} w-16 text-right">Cant.</TableHead>
				<TableHead class="{headClass} hidden w-32 text-right lg:table-cell">Desc.</TableHead>
				<TableHead class="{headClass} w-32 text-right">Ingreso</TableHead>
				<TableHead class="{headClass} w-32 text-right">Costo</TableHead>
				<TableHead class="{headClass} w-32 text-right">Margen</TableHead>
				<TableHead class="{headClass} w-20 text-right">%</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each skus as sku (sku.sku_id)}
				<FinanzasRentabilidadRow {sku} />
			{/each}
		</TableBody>
	</Table>
</div>
