<script lang="ts">
	import { resolve } from '$app/paths';
	import type { AjusteInventario } from '#lib/interfaces/index.ts';
	import { formatCurrency, formatDateTime, formatNumber, formatOrigen } from '#lib/utils/index.ts';
	import KardexAjusteMotivoBadge from './kardexAjusteMotivoBadge.svelte';
	import KardexCantidad from './kardexCantidad.svelte';

	interface Props {
		ajuste: AjusteInventario;
		registradoPor?: string;
	}

	let { ajuste, registradoPor }: Props = $props();
</script>

<article
	class="relative flex gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
>
	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<!-- El enlace cubre la tarjeta (::after) -->
			<a
				href={resolve('/panel/kardex/ajustes/[id]', { id: ajuste.id })}
				class="font-semibold text-light-two tabular-nums after:absolute after:inset-0 dark:text-dark-two"
			>
				{formatOrigen({ tipo: 'AJUSTE', numero: ajuste.numero })}
			</a>
			<KardexAjusteMotivoBadge motivo={ajuste.motivo} size="sm" />
		</div>
		<p class="mt-0.5 truncate text-xs text-light-two_d dark:text-dark-two_d">
			{formatDateTime(ajuste.created_at)}{registradoPor ? ` · ${registradoPor}` : ''}
		</p>
		{#if ajuste.nota}
			<p class="mt-2 line-clamp-2 text-sm wrap-break-word text-light-two dark:text-dark-two">
				{ajuste.nota}
			</p>
		{/if}
		<p class="mt-2 text-xs text-light-two_d dark:text-dark-two_d">
			{formatNumber(ajuste.items)}
			{ajuste.items === 1 ? 'SKU' : 'SKUs'}
		</p>
	</div>
	<div class="flex shrink-0 flex-col items-end justify-between gap-2">
		<KardexCantidad cantidad={ajuste.unidades} class="text-lg" />
		<p class="font-semibold text-light-two tabular-nums dark:text-dark-two">
			{formatCurrency(ajuste.valor)}
		</p>
	</div>
</article>
