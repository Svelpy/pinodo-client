<script lang="ts">
	let { children } = $props();
</script>

<!-- Páginas legales dentro de la tienda (mismo header, footer y modo mantenimiento): solo ancho de lectura -->
<div class="mx-auto w-full max-w-3xl pb-10">
	{@render children()}
</div>
