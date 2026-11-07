<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { scale } from 'svelte/transition';
	import { ChevronDownIcon, LogOutIcon } from '#lib/icons/outline/index.ts';
	import {
		authStore,
		currentRole,
		currentTiendaStore,
		currentUserStore
	} from '#lib/stores/index.ts';
	import { canAccessRoute, clickOutside, formatFullName } from '#lib/utils/index.ts';
	import Avatar from './avatar.svelte';

	const FALLBACK_NAME = 'Mi tienda';

	let isOpen = $state(false);
	let trigger = $state<HTMLButtonElement>();

	const tienda = $derived($currentTiendaStore);
	const user = $derived($currentUserStore);

	const tiendaName = $derived(tienda?.nombre_tienda || FALLBACK_NAME);

	const fullName = $derived(user ? formatFullName(user, { fallback: '' }) : '');
	// El perfil no es accesible para todos los roles (p. ej. SUPERADMIN): entonces la cuenta es solo informativa
	const canOpenPerfil = $derived(canAccessRoute($currentRole, '/panel/perfil'));

	function close() {
		isOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			close();
			trigger?.focus();
		}
	}

	async function logout() {
		close();
		authStore.logout();
		await goto(resolve('/auth/sign-in'), { replaceState: true });
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative">
	<button
		bind:this={trigger}
		type="button"
		onclick={() => (isOpen = !isOpen)}
		aria-haspopup="menu"
		aria-expanded={isOpen}
		aria-label="Menú de la tienda y de la cuenta"
		class={[
			'flex w-full items-center gap-2.5 px-2 py-2 text-left text-sm font-medium text-light-one transition-colors focus-visible:ring-2 focus-visible:ring-light-one/60 focus-visible:outline-none dark:text-dark-two dark:focus-visible:ring-dark-two/60',
			isOpen ? 'bg-white/10 dark:bg-dark-two/10' : 'hover:bg-white/5 dark:hover:bg-dark-two/5'
		]}
	>
		<Avatar src={tienda?.logo_url} name={tiendaName} size="sm" tone="accent" />
		<span class="min-w-0 flex-1 truncate">{tiendaName}</span>
		<ChevronDownIcon
			class="size-4 shrink-0 opacity-70 transition-transform {isOpen ? 'rotate-180' : ''}"
		/>
	</button>

	{#if isOpen}
		<div
			use:clickOutside={{ callback: close, exclude: trigger }}
			role="menu"
			aria-label="Tienda y cuenta"
			class="absolute bottom-full left-0 z-10 mb-2 w-64 origin-bottom-left rounded-xl border border-light-four/40 bg-light-one text-light-two shadow-xl lg:w-72 dark:border-dark-one dark:bg-dark-one_d dark:text-dark-two"
			transition:scale={{ duration: 120, start: 0.95, opacity: 0 }}
		>
			<div class="p-1.5" role="none">
				<div
					class="flex items-center gap-3 rounded-lg bg-light-one_d px-2.5 py-2 text-sm font-semibold dark:bg-dark-one"
					role="none"
				>
					<Avatar src={tienda?.logo_url} name={tiendaName} size="sm" tone="accent" />
					<span class="min-w-0 flex-1 truncate">{tiendaName}</span>
				</div>
			</div>

			{#if user}
				<div class="border-t border-light-four/40 p-1.5 dark:border-dark-one" role="none">
					{#snippet account()}
						<Avatar name={fullName} />
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-medium">{fullName}</span>
							<span class="block truncate text-xs text-light-two_d dark:text-dark-four">
								{user.email}
							</span>
						</span>
					{/snippet}

					{#if canOpenPerfil}
						<!-- Otra pestaña: no se pierde la página en la que se está trabajando -->
						<a
							href={resolve('/panel/perfil')}
							target="_blank"
							rel="noopener noreferrer"
							role="menuitem"
							onclick={close}
							class="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-light-one_d focus-visible:bg-light-one_d focus-visible:outline-none dark:hover:bg-dark-one dark:focus-visible:bg-dark-one"
						>
							{@render account()}
						</a>
					{:else}
						<div class="flex items-center gap-3 px-2.5 py-2" role="none">
							{@render account()}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Siempre disponible: sin usuario (sesión perdida) sigue siendo la salida hacia el login -->
			<div
				class={['p-1.5', !user && 'border-t border-light-four/40 dark:border-dark-one']}
				role="none"
			>
				<button
					type="button"
					role="menuitem"
					onclick={logout}
					class="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-light-one_d focus-visible:bg-light-one_d focus-visible:outline-none dark:hover:bg-dark-one dark:focus-visible:bg-dark-one"
				>
					<LogOutIcon class="size-5 shrink-0" />
					Cerrar sesión
				</button>
			</div>
		</div>
	{/if}
</div>
