<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Action, Module } from '#lib/config/permissions.config.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { can } from '#lib/utils/rbac.utils.ts';

	/**
	 * Muestra su contenido solo si el rol actual tiene la acción en el módulo.
	 * En el script de un componente usa directamente `can($currentRole, module, action)`.
	 */
	interface Props {
		module: Module;
		action: Action;
		children: Snippet;
		/** Contenido alternativo cuando no hay permiso */
		fallback?: Snippet;
	}

	let { module, action, children, fallback }: Props = $props();

	const allowed = $derived(can($currentRole, module, action));
</script>

{#if allowed}
	{@render children()}
{:else}
	{@render fallback?.()}
{/if}
