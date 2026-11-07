<script lang="ts">
	import { Badge, TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { Seccion } from '#lib/interfaces/index.ts';
	import { formatBoolean, formatDate } from '#lib/utils/index.ts';
	import SeccionActions from './seccionActions.svelte';

	interface Props {
		seccion: Seccion;
		onEdit?: (seccion: Seccion) => void;
		onDelete?: (seccion: Seccion) => void;
	}

	let { seccion, onEdit, onDelete }: Props = $props();
</script>

<TableRow
	class="border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3">
		<p class="truncate font-medium text-light-two dark:text-dark-two">{seccion.nombre}</p>
		<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">/{seccion.slug}</p>
	</TableCell>
	<TableCell class="px-4 py-3">
		<Badge variant={seccion.is_visible ? 'success' : 'secondary'} dot>
			{formatBoolean(seccion.is_visible, { trueLabel: 'Visible', falseLabel: 'Oculta' })}
		</Badge>
	</TableCell>
	<TableCell
		class="hidden px-4 py-3 text-sm whitespace-nowrap text-light-two_d lg:table-cell dark:text-dark-two_d"
	>
		{formatDate(seccion.created_at)}
	</TableCell>
	<TableCell class="px-2 py-3 text-right">
		<SeccionActions {seccion} {onEdit} {onDelete} />
	</TableCell>
</TableRow>
