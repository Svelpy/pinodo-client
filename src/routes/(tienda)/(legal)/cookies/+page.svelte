<script lang="ts">
	import { LegalArticle } from '#lib/components/features/legal/index.ts';
	import { TiendaSeo } from '#lib/components/features/tienda/index.ts';

	let { data } = $props();

	const nombre = $derived(data.tienda.nombre_tienda);
</script>

<TiendaSeo
	title="Política de cookies"
	tienda={nombre}
	description="Qué guarda el sitio de {nombre} en su navegador y cómo borrarlo."
/>

<LegalArticle title="Política de cookies y almacenamiento local" updatedAt="Noviembre de 2026">
	<p>
		El sitio de <strong>{nombre}</strong> guarda en su navegador solo lo necesario para funcionar. No
		usa cookies publicitarias ni herramientas de rastreo de terceros.
	</p>

	<h2>1. ¿Qué son?</h2>
	<p>
		Las cookies y el almacenamiento local (Local Storage) son pequeños datos que un sitio guarda en
		su teléfono o computadora para recordar información entre visitas.
	</p>

	<h2>2. Qué usamos</h2>
	<ul>
		<li>
			<strong>Cesta de compras (almacenamiento local):</strong> guarda las prendas que agregó para que
			no se pierdan al recargar la página o volver otro día. No sale de su navegador.
		</li>
		<li>
			<strong>Caché de la aplicación:</strong> el sitio guarda sus propios archivos (estilos, código,
			íconos) para cargar más rápido y mostrar un aviso cuando no hay conexión.
		</li>
		<li>
			<strong>Sesión del personal de la tienda:</strong> solo quienes ingresan al panel de administración
			usan una cookie de sesión. Los clientes no necesitan iniciar sesión.
		</li>
		<li>
			<strong>No usamos</strong> cookies publicitarias, píxeles de redes sociales ni seguimiento fuera
			de este sitio.
		</li>
	</ul>

	<h2>3. Cómo borrarlos</h2>
	<p>
		Puede borrar las cookies y el almacenamiento del sitio desde la configuración de privacidad de
		su navegador (Chrome, Safari, Firefox, etc.). Si lo hace, se vaciará su cesta.
	</p>
</LegalArticle>
