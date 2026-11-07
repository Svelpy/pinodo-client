<script lang="ts">
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

<article
	class="flex gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
>
	<div class="min-w-0 flex-1">
		<h3 class="truncate font-semibold text-light-two dark:text-dark-two">{talla.etiqueta}</h3>
		<p class="mt-1 text-xs text-light-two_d dark:text-dark-two_d">
			Creada el {formatDate(talla.created_at)}
		</p>
	</div>
	<div class="-mt-1.5 -mr-2 shrink-0 self-start">
		<TallaActions {talla} {onEdit} {onDelete} />
	</div>
</article>
