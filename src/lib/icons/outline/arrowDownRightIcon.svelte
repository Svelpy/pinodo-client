<script lang="ts">
	let { class: className = 'size-5' } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
>
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M7 7l10 10" />
	<path d="M7 17h10v-10" />
</svg>
