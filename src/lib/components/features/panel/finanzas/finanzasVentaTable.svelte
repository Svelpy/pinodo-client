<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { ReporteVentaLinea } from '#lib/interfaces/index.ts';
	import FinanzasVentaRow from './finanzasVentaRow.svelte';

	interface Props {
		lineas: ReporteVentaLinea[];
	}

	let { lineas }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="relative overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class="{headClass} w-36">Fecha</TableHead>
				<TableHead class="{headClass} w-32">Venta</TableHead>
				<TableHead class={headClass}>Prenda</TableHead>
				<TableHead class="{headClass} hidden w-48 xl:table-cell">Vendedor · pago</TableHead>
				<TableHead class="{headClass} w-16 text-right">Cant.</TableHead>
				<TableHead class="{headClass} hidden w-32 text-right lg:table-cell">Precio</TableHead>
				<TableHead class="{headClass} w-32 text-right">Desc.</TableHead>
				<TableHead class="{headClass} w-32 text-right">Total</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each lineas as linea (linea)}
				<FinanzasVentaRow {linea} />
			{/each}
		</TableBody>
	</Table>
</div>
