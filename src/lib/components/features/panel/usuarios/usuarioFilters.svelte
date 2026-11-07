<script lang="ts">
	import { Select } from '#lib/components/ui/index.ts';
	import type { Role } from '#lib/config/index.ts';
	import { ROLE_LABEL } from '#lib/constants/index.ts';

	interface Props {
		/** Roles que el usuario actual puede listar: el suyo y los inferiores */
		roles: readonly Role[];
		/** null = sin filtro (todos los roles) */
		role: Role | null;
		onChange: (role: Role | null) => void;
	}

	let { roles, role, onChange }: Props = $props();
</script>

<!-- Etiqueta y select en una fila: el Select sin `label` no dibuja la suya -->
<div class="flex items-center gap-3">
	<label
		for="usuarios-rol"
		class="shrink-0 text-sm font-medium text-light-two sm:text-base dark:text-dark-two"
	>
		Rol
	</label>
	<Select
		id="usuarios-rol"
		class="min-w-0 flex-1 sm:w-64 sm:flex-none"
		value={role ?? ''}
		onchange={(event) => onChange((event.currentTarget.value as Role) || null)}
	>
		<option value="">Todos</option>
		{#each roles as value (value)}
			<option {value}>{ROLE_LABEL[value]}</option>
		{/each}
	</Select>
</div>
