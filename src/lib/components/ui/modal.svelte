<script lang="ts">
	import { XIcon } from '#lib/icons/outline/index.ts';
	import BlurOverlay from './blurOverlay.svelte';
	import Button from './button.svelte';
	import Heading from './heading.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		isOpen: boolean;
		title: string;
		onClose: () => void;
		children: Snippet;
		footer?: Snippet;
		maxWidth?: string;
	}

	let { isOpen, title, onClose, children, footer, maxWidth = 'sm:max-w-2xl' }: Props = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') onClose();
	}
</script>

{#if isOpen}
	<div
		class="relative z-50"
		role="presentation"
		onclick={(event) => {
			event.stopPropagation();
		}}
		onkeydown={handleKeydown}
	>
		<BlurOverlay class="overflow-y-auto ">
			<div
				class="relative my-8 w-full transform overflow-hidden bg-white text-left transition-all {maxWidth} flex max-h-[90vh] flex-col"
				onclick={(e) => e.stopPropagation()}
				role="presentation"
			>
				<!-- Header -->
				<div class="flex items-center justify-between border-b border-light-four px-6 py-4">
					<Heading level="h4" class="text-light-black">{title}</Heading>
					<Button type="button" variant="ghost" onclick={onClose} class="p-2!" aria-label="Cerrar">
						{#snippet leftIcon()}
							<XIcon class="size-6 text-light-two hover:text-light-black" />
						{/snippet}
					</Button>
				</div>

				<!-- Content -->
				<div class="flex-1 overflow-y-auto p-6">
					{@render children()}
				</div>

				<!-- Footer -->
				{#if footer}
					<div class="border-t border-light-four bg-light-one_d px-6 py-4">
						{@render footer()}
					</div>
				{/if}
			</div>
		</BlurOverlay>
	</div>
{/if}
