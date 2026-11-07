<script lang="ts">
	let { className = '' } = $props();
</script>

<div class="flex space-x-2 {className}">
	<div class="h-4 w-4 animate-bounce bg-light-three dark:bg-dark-two"></div>
	<div class="h-4 w-4 animate-bounce bg-light-three delay-200 dark:bg-dark-two"></div>
	<div class="h-4 w-4 animate-bounce bg-light-three delay-400 dark:bg-dark-two"></div>
</div>

<style>
	.animate-bounce {
		animation: bounce 1.5s infinite;
	}
	.delay-200 {
		animation-delay: 0.2s;
	}
	.delay-400 {
		animation-delay: 0.4s;
	}
	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}
</style>
