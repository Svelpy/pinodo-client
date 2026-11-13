<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { Venta } from '#lib/interfaces/index.ts';
	import VentaRow from './ventaRow.svelte';

	interface Props {
		ventas: Venta[];
		/** Id de usuario → nombre; null = no se muestra la columna Vendedor */
		vendedores: ReadonlyMap<string, string> | null;
		onCobrar?: (venta: Venta) => void;
		onCancelar?: (venta: Venta) => void;
	}

	let { ventas, vendedores, onCobrar, onCancelar }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="relative overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class="{headClass} w-28">N.º</TableHead>
				<TableHead class="{headClass} w-36">Fecha</TableHead>
				<TableHead class={headClass}>Cliente</TableHead>
				<TableHead class="{headClass} hidden w-36 lg:table-cell">Canal</TableHead>
				<TableHead class="{headClass} hidden w-40 lg:table-cell">Pago</TableHead>
				{#if vendedores}
					<TableHead class="{headClass} hidden w-40 xl:table-cell">Vendedor</TableHead>
				{/if}
				<TableHead class="{headClass} w-32">Estado</TableHead>
				<TableHead class="{headClass} w-32 text-right">Total</TableHead>
				<TableHead class="h-11 w-14 px-2">
					<span class="sr-only">Acciones</span>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each ventas as venta (venta.id)}
				<VentaRow
					{venta}
					vendedor={vendedores?.get(venta.created_by)}
					mostrarVendedor={!!vendedores}
					{onCobrar}
					{onCancelar}
				/>
			{/each}
		</TableBody>
	</Table>
</div>
