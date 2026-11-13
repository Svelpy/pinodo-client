<script lang="ts">
	import { Badge } from '#lib/components/ui/index.ts';
	import {
		AJUSTE_MOTIVO_BADGE,
		AJUSTE_MOTIVO_LABEL,
		type AjusteMotivo
	} from '#lib/constants/index.ts';

	interface Props {
		motivo: AjusteMotivo;
		size?: 'sm' | 'md';
	}

	let { motivo, size = 'md' }: Props = $props();
</script>

<Badge variant={AJUSTE_MOTIVO_BADGE[motivo]} {size}>{AJUSTE_MOTIVO_LABEL[motivo]}</Badge>
