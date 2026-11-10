<script lang="ts">
	import { VENTA_CANAL, VENTA_CANAL_LABEL, type VentaCanal } from '#lib/constants/index.ts';
	import { BuildindStoreIcon, WhatsappIcon } from '#lib/icons/outline/index.ts';

	interface Props {
		canal: VentaCanal;
	}

	let { canal }: Props = $props();
</script>

<span class="inline-flex items-center gap-1.5 text-light-two dark:text-dark-two">
	{#if canal === VENTA_CANAL.WHATSAPP}
		<WhatsappIcon class="size-4 shrink-0 text-light-success dark:text-dark-success" />
	{:else}
		<BuildindStoreIcon class="size-4 shrink-0 text-light-two_d dark:text-dark-two_d" />
	{/if}
	{VENTA_CANAL_LABEL[canal]}
</span>
