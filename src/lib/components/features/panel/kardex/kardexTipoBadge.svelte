<script lang="ts">
	import { Badge } from '#lib/components/ui/index.ts';
	import {
		MOVIMIENTO_TIPO_BADGE,
		MOVIMIENTO_TIPO_LABEL,
		type MovimientoTipo
	} from '#lib/constants/index.ts';

	interface Props {
		tipo: MovimientoTipo;
		size?: 'sm' | 'md';
	}

	let { tipo, size = 'md' }: Props = $props();
</script>

<Badge variant={MOVIMIENTO_TIPO_BADGE[tipo]} {size}>{MOVIMIENTO_TIPO_LABEL[tipo]}</Badge>
