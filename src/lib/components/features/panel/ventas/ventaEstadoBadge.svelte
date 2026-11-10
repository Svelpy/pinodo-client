<script lang="ts">
	import { Badge } from '#lib/components/ui/index.ts';
	import {
		VENTA_ESTADO_BADGE,
		VENTA_ESTADO_LABEL,
		type VentaEstado
	} from '#lib/constants/index.ts';

	interface Props {
		estado: VentaEstado;
		size?: 'sm' | 'md';
	}

	let { estado, size = 'md' }: Props = $props();
</script>

<Badge variant={VENTA_ESTADO_BADGE[estado]} {size} dot>{VENTA_ESTADO_LABEL[estado]}</Badge>
