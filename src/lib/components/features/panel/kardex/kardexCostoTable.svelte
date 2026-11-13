<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { CostoSku } from '#lib/interfaces/index.ts';
	import KardexCostoRow from './kardexCostoRow.svelte';

	interface Props {
		costos: CostoSku[];
	}

	let { costos }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class={headClass}>Producto</TableHead>
				<TableHead class="{headClass} hidden w-40 lg:table-cell">Código</TableHead>
				<TableHead class="{headClass} w-24 text-right">Stock</TableHead>
				<TableHead class="{headClass} w-36 text-right">Costo prom.</TableHead>
				<TableHead class="{headClass} w-36 text-right">Valor</TableHead>
				<TableHead class="h-11 w-14 px-2"><span class="sr-only">Kardex</span></TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each costos as costo (costo.sku_id)}
				<KardexCostoRow {costo} />
			{/each}
		</TableBody>
	</Table>
</div>
