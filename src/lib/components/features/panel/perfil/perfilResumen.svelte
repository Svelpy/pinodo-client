<script lang="ts">
	import { Avatar, Badge } from '#lib/components/ui/index.ts';
	import type { CurrentUser } from '#lib/interfaces/index.ts';
	import { formatDateLong, formatFullName, formatRole } from '#lib/utils/index.ts';

	interface Props {
		usuario: CurrentUser;
	}

	let { usuario }: Props = $props();

	const nombre = $derived(formatFullName(usuario));
</script>

<section
	aria-label="Tu cuenta"
	class="flex flex-col items-center gap-4 border border-light-one_d bg-light-one p-4 text-center sm:flex-row sm:p-6 sm:text-left dark:border-dark-one_d dark:bg-dark-one"
>
	<Avatar name={nombre} size="lg" />
	<div class="min-w-0 flex-1">
		<div class="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
			<p class="truncate text-lg font-semibold text-light-two dark:text-dark-two">{nombre}</p>
			<Badge variant="secondary" size="sm">{formatRole(usuario.rol)}</Badge>
		</div>
		<p class="truncate text-sm text-light-two_d dark:text-dark-two_d">{usuario.email}</p>
		<p class="mt-1 text-xs text-light-two_d dark:text-dark-two_d">
			Miembro desde el {formatDateLong(usuario.created_at)}
		</p>
	</div>
</section>
