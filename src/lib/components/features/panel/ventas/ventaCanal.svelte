<script lang="ts">
	import { VENTA_CANAL, VENTA_CANAL_LABEL, type VentaCanal } from '#lib/constants/index.ts';
	import { CANAL_ICON } from './ventaIcons.ts';

	interface Props {
		canal: VentaCanal;
	}

	let { canal }: Props = $props();

	const Icon = $derived(CANAL_ICON[canal]);
</script>

<span class="inline-flex min-w-0 items-center gap-1.5 text-light-two dark:text-dark-two">
	<Icon
		class={[
			'size-4 shrink-0',
			canal === VENTA_CANAL.WHATSAPP
				? 'text-light-success dark:text-dark-success'
				: 'text-light-two_d dark:text-dark-two_d'
		].join(' ')}
	/>
	<span class="truncate">{VENTA_CANAL_LABEL[canal]}</span>
</span>
