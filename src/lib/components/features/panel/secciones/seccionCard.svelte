<script lang="ts">
	import { Badge } from '#lib/components/ui/index.ts';
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

<article
	class="flex gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
>
	<div class="min-w-0 flex-1">
		<h3 class="truncate font-semibold text-light-two dark:text-dark-two">{seccion.nombre}</h3>
		<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">/{seccion.slug}</p>
		<Badge variant={seccion.is_visible ? 'success' : 'secondary'} dot class="mt-2">
			{formatBoolean(seccion.is_visible, { trueLabel: 'Visible', falseLabel: 'Oculta' })}
		</Badge>
		<p class="mt-2 text-xs text-light-two_d dark:text-dark-two_d">
			Creada el {formatDate(seccion.created_at)}
		</p>
	</div>
	<div class="-mt-1.5 -mr-2 shrink-0 self-start">
		<SeccionActions {seccion} {onEdit} {onDelete} />
	</div>
</article>
