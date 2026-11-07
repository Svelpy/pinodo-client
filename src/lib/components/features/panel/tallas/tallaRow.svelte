<script lang="ts">
	import { TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { Talla } from '#lib/interfaces/index.ts';
	import { formatDate } from '#lib/utils/index.ts';
	import TallaActions from './tallaActions.svelte';

	interface Props {
		talla: Talla;
		onEdit?: (talla: Talla) => void;
		onDelete?: (talla: Talla) => void;
	}

	let { talla, onEdit, onDelete }: Props = $props();
</script>

<TableRow
	class="border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3">
		<p class="truncate font-medium text-light-two dark:text-dark-two">{talla.etiqueta}</p>
	</TableCell>
	<TableCell class="px-4 py-3 text-sm whitespace-nowrap text-light-two_d dark:text-dark-two_d">
		{formatDate(talla.created_at)}
	</TableCell>
	<TableCell class="px-2 py-3 text-right">
		<TallaActions {talla} {onEdit} {onDelete} />
	</TableCell>
</TableRow>
