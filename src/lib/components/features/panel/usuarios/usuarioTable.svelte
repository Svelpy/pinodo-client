<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { Usuario } from '#lib/interfaces/index.ts';
	import UsuarioRow from './usuarioRow.svelte';

	interface Props {
		usuarios: Usuario[];
		currentUserId: string | null;
		onEdit?: (usuario: Usuario) => void;
		onResetPassword?: (usuario: Usuario) => void;
		onDelete?: (usuario: Usuario) => void;
	}

	let { usuarios, currentUserId, onEdit, onResetPassword, onDelete }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class="{headClass} w-[55%] lg:w-[45%]">Usuario</TableHead>
				<TableHead class={headClass}>Teléfono</TableHead>
				<TableHead class="{headClass} hidden w-48 lg:table-cell">Creado</TableHead>
				<TableHead class="h-11 w-14 px-2">
					<span class="sr-only">Acciones</span>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each usuarios as usuario (usuario.id)}
				<UsuarioRow
					{usuario}
					isCurrentUser={usuario.id === currentUserId}
					{onEdit}
					{onResetPassword}
					{onDelete}
				/>
			{/each}
		</TableBody>
	</Table>
</div>
