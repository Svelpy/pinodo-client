<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	interface Props {
		/** id del input (debe ser único en la página) */
		id: string;
		label: string;
		placeholder?: string;
		/** Muestra el label en pantalla (si no, solo para lectores de pantalla) */
		labelVisible?: boolean;
		/** Clases del <form> */
		class?: string;
		/** Clases del <input> */
		inputClass?: string;
		labelClass?: string;
	}

	let {
		id,
		label,
		placeholder,
		labelVisible = false,
		class: className,
		inputClass,
		labelClass
	}: Props = $props();

	/** Espera tras la última tecla antes de buscar */
	const ESPERA_MS = 400;
	/** Menos caracteres que esto no dispara la búsqueda automática (Enter sí) */
	const MIN_CARACTERES = 2;
	/** La API admite hasta 100 caracteres */
	const MAX_CARACTERES = 100;

	const accion = resolve('/(tienda)/buscar');
	const enBusqueda = $derived(page.route.id === '/(tienda)/buscar');
	const qActual = $derived(enBusqueda ? (page.url.searchParams.get('q') ?? '') : '');

	// Texto propio del input: no se pisa con la URL mientras el usuario escribe
	let texto = $state('');
	let enfocado = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const q = qActual;
		if (!enfocado) texto = q;
	});

	function buscar(forzar = false) {
		clearTimeout(timer);
		const q = texto.trim().slice(0, MAX_CARACTERES);
		if (!forzar && q.length > 0 && q.length < MIN_CARACTERES) return;
		if (enBusqueda && q === qActual) return;

		const destino = q ? `${accion}?${new URLSearchParams({ q })}` : accion;
		// Ya en /buscar: reemplaza la entrada del historial (atrás no recorre cada letra).
		// reset: false conserva el foco en el input y la posición del scroll
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- `accion` ya viene de resolve()
		goto(destino, { replace: enBusqueda, reset: false });
	}

	function handleInput() {
		clearTimeout(timer);
		timer = setTimeout(() => buscar(), ESPERA_MS);
	}

	function handleSubmit(event: SubmitEvent) {
		// Enter busca al instante; sin JavaScript el form hace el GET normal a /buscar
		event.preventDefault();
		buscar(true);
	}

	onDestroy(() => clearTimeout(timer));
</script>

<form method="GET" action={accion} role="search" class={className} onsubmit={handleSubmit}>
	<label for={id} class={labelVisible ? labelClass : 'sr-only'}>{label}</label>
	<input
		{id}
		name="q"
		type="search"
		bind:value={texto}
		oninput={handleInput}
		onfocus={() => (enfocado = true)}
		onblur={() => (enfocado = false)}
		maxlength={MAX_CARACTERES}
		{placeholder}
		autocomplete="off"
		enterkeyhint="search"
		class={inputClass}
	/>
</form>
