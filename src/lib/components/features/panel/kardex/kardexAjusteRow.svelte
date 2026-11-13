<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { AjusteInventario } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTimeParts,
		formatNumber,
		formatOrigen,
		formatValue
	} from '#lib/utils/index.ts';
	import KardexAjusteMotivoBadge from './kardexAjusteMotivoBadge.svelte';
	import KardexCantidad from './kardexCantidad.svelte';

	interface Props {
		ajuste: AjusteInventario;
		/** Nombre de quien lo registró ("Sistema" en la carga inicial) */
		registradoPor?: string;
		mostrarRegistradoPor?: boolean;
	}

	let { ajuste, registradoPor, mostrarRegistradoPor = false }: Props = $props();

	const href = $derived(resolve('/panel/kardex/ajustes/[id]', { id: ajuste.id }));
	const creado = $derived(formatDateTimeParts(ajuste.created_at));

	// La fila entera abre el detalle; el número es el enlace accesible
	function handleClick(event: MouseEvent) {
		if ((event.target as HTMLElement).closest('a, button')) return;
		goto(href);
	}
</script>

<TableRow
	onclick={handleClick}
	class="cursor-pointer border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3">
		<a {href} class="font-semibold text-light-two tabular-nums hover:underline dark:text-dark-two">
			{formatOrigen({ tipo: 'AJUSTE', numero: ajuste.numero })}
		</a>
	</TableCell>
	<TableCell class="px-4 py-3 text-sm">
		<time datetime={ajuste.created_at} class="block whitespace-nowrap">
			<span class="block text-light-two dark:text-dark-two">{creado.fecha}</span>
			<span class="block text-xs text-light-two_d dark:text-dark-two_d">{creado.hora}</span>
		</time>
	</TableCell>
	<TableCell class="px-4 py-3">
		<KardexAjusteMotivoBadge motivo={ajuste.motivo} size="sm" />
	</TableCell>
	<TableCell class="truncate px-4 py-3 text-sm text-light-two dark:text-dark-two">
		<span title={ajuste.nota ?? undefined}>{formatValue(ajuste.nota)}</span>
	</TableCell>
	{#if mostrarRegistradoPor}
		<TableCell
			class="hidden truncate px-4 py-3 text-sm text-light-two_d xl:table-cell dark:text-dark-two_d"
		>
			{formatValue(registradoPor)}
		</TableCell>
	{/if}
	<TableCell
		class="hidden px-4 py-3 text-right text-sm text-light-two_d tabular-nums lg:table-cell dark:text-dark-two_d"
	>
		{formatNumber(ajuste.items)}
	</TableCell>
	<TableCell class="px-4 py-3 text-right text-sm">
		<KardexCantidad cantidad={ajuste.unidades} />
	</TableCell>
	<TableCell
		class="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap text-light-two tabular-nums dark:text-dark-two"
	>
		{formatCurrency(ajuste.valor)}
	</TableCell>
</TableRow>
