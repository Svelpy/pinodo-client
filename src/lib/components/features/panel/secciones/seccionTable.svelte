<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { Seccion } from '#lib/interfaces/index.ts';
	import SeccionRow from './seccionRow.svelte';

	interface Props {
		secciones: Seccion[];
		onEdit?: (seccion: Seccion) => void;
		onDelete?: (seccion: Seccion) => void;
	}

	let { secciones, onEdit, onDelete }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class="{headClass} w-[50%]">Sección</TableHead>
				<TableHead class={headClass}>Visibilidad</TableHead>
				<TableHead class="{headClass} hidden w-48 lg:table-cell">Creada</TableHead>
				<TableHead class="h-11 w-14 px-2">
					<span class="sr-only">Acciones</span>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each secciones as seccion (seccion.id)}
				<SeccionRow {seccion} {onEdit} {onDelete} />
			{/each}
		</TableBody>
	</Table>
</div>
