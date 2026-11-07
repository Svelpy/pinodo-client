<script lang="ts">
	import { ColorSwatch, TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { Color } from '#lib/interfaces/index.ts';
	import { formatDate } from '#lib/utils/index.ts';
	import ColorActions from './colorActions.svelte';

	interface Props {
		color: Color;
		onEdit?: (color: Color) => void;
		onDelete?: (color: Color) => void;
	}

	let { color, onEdit, onDelete }: Props = $props();
</script>

<TableRow
	class="border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3">
		<div class="flex min-w-0 items-center gap-3">
			<ColorSwatch hex={color.codigo_hex} />
			<div class="min-w-0">
				<p class="truncate font-medium text-light-two dark:text-dark-two">{color.nombre}</p>
				<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">/{color.slug}</p>
			</div>
		</div>
	</TableCell>
	<TableCell class="px-4 py-3 font-mono text-sm text-light-two dark:text-dark-two">
		{color.codigo_hex}
	</TableCell>
	<TableCell
		class="hidden px-4 py-3 text-sm whitespace-nowrap text-light-two_d lg:table-cell dark:text-dark-two_d"
	>
		{formatDate(color.created_at)}
	</TableCell>
	<TableCell class="px-2 py-3 text-right">
		<ColorActions {color} {onEdit} {onDelete} />
	</TableCell>
</TableRow>
