<script lang="ts">
	import type { DropdownOption } from '#lib/interfaces/index.ts';
	import { clickOutside, portal } from '#lib/utils/index.ts';
	import { scale } from 'svelte/transition';

	interface Props {
		options: DropdownOption[];
		width: number;
		class?: string;
		isOpen: boolean;
		triggerElement?: HTMLElement;
	}

	let {
		options,
		width,
		class: className = '',
		isOpen = $bindable(),
		triggerElement
	}: Props = $props();

	let dropdownElement = $state<HTMLElement>();

	function handleSelect(option: DropdownOption) {
		if (option.disabled) return;
		if (option.action) {
			option.action();
		}
		close();
	}

	function close(): void {
		isOpen = false;
	}

	$effect(() => {
		if (isOpen && triggerElement && dropdownElement) {
			const rect = triggerElement.getBoundingClientRect();
			dropdownElement.style.position = 'fixed';
			// position: fixed se mide desde el viewport, no hay que sumar el scroll
			dropdownElement.style.top = `${rect.bottom}px`;
			dropdownElement.style.right = `${window.innerWidth - rect.right}px`;
			dropdownElement.style.zIndex = '9999';
		}
	});
</script>

{#if isOpen}
	<div
		use:portal
		use:clickOutside={{ callback: () => close(), exclude: triggerElement }}
		bind:this={dropdownElement}
		class=" border border-light-four bg-light-one focus:outline-none dark:border-dark-one dark:bg-dark-one_d {className}"
		style="width: {width}px;"
		role="menu"
		aria-orientation="vertical"
		tabindex="-1"
		transition:scale={{ duration: 120, start: 0.95, opacity: 0 }}
	>
		{#each options as option, i (option.id || i)}
			{#if option.divider && i > 0}
				<div class="border-t border-light-four dark:border-dark-four"></div>
			{/if}
			<div class="py-1" role="none">
				<button
					class={`group flex w-full items-center px-4 py-2 text-sm ${option.disabled ? 'cursor-not-allowed text-light-two dark:text-dark-two' : 'text-light-two hover:bg-light-one_d hover:text-light-two_d dark:text-dark-two dark:hover:bg-dark-one_d dark:hover:text-dark-two'}`}
					role="menuitem"
					tabindex="-1"
					onclick={() => handleSelect(option)}
					disabled={option.disabled}
				>
					{#if option.icon}
						<span
							class="mr-3 size-5 text-light-two group-hover:text-light-two_d dark:text-dark-two dark:group-hover:text-dark-two_d"
						>
							<option.icon />
						</span>
					{/if}
					{option.label}
				</button>
			</div>
		{/each}
	</div>
{/if}
