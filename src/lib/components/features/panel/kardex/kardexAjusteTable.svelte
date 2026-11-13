<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { AjusteInventario } from '#lib/interfaces/index.ts';
	import KardexAjusteRow from './kardexAjusteRow.svelte';

	interface Props {
		ajustes: AjusteInventario[];
		/** Quién registró cada ajuste; null = no se muestra la columna */
		registradoPor: ((ajuste: AjusteInventario) => string | undefined) | null;
	}

	let { ajustes, registradoPor }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="relative overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class="{headClass} w-32">N.º</TableHead>
				<TableHead class="{headClass} w-36">Fecha</TableHead>
				<TableHead class="{headClass} w-40">Motivo</TableHead>
				<TableHead class={headClass}>Nota</TableHead>
				{#if registradoPor}
					<TableHead class="{headClass} hidden w-44 xl:table-cell">Registrado por</TableHead>
				{/if}
				<TableHead class="{headClass} hidden w-20 text-right lg:table-cell" title="SKUs que movió">
					SKUs
				</TableHead>
				<TableHead class="{headClass} w-24 text-right">Unidades</TableHead>
				<TableHead class="{headClass} w-32 text-right" title="Suma de cantidad × costo unitario">
					Valor
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each ajustes as ajuste (ajuste.id)}
				<KardexAjusteRow
					{ajuste}
					registradoPor={registradoPor?.(ajuste)}
					mostrarRegistradoPor={!!registradoPor}
				/>
			{/each}
		</TableBody>
	</Table>
</div>
