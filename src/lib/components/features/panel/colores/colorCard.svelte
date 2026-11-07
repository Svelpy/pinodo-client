<script lang="ts">
	import { ColorSwatch } from '#lib/components/ui/index.ts';
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

<article
	class="flex gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
>
	<ColorSwatch hex={color.codigo_hex} class="size-10" />
	<div class="min-w-0 flex-1">
		<h3 class="truncate font-semibold text-light-two dark:text-dark-two">{color.nombre}</h3>
		<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">/{color.slug}</p>
		<p class="mt-2 font-mono text-sm text-light-two dark:text-dark-two">{color.codigo_hex}</p>
		<p class="mt-2 text-xs text-light-two_d dark:text-dark-two_d">
			Creado el {formatDate(color.created_at)}
		</p>
	</div>
	<div class="-mt-1.5 -mr-2 shrink-0 self-start">
		<ColorActions {color} {onEdit} {onDelete} />
	</div>
</article>
