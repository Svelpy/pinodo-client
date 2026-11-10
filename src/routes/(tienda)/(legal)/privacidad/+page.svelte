<script lang="ts">
	import { LegalArticle, LegalContacto } from '#lib/components/features/legal/index.ts';
	import { TiendaSeo } from '#lib/components/features/tienda/index.ts';

	let { data } = $props();

	const tienda = $derived(data.tienda);
	const nombre = $derived(tienda.nombre_tienda);
</script>

<TiendaSeo
	title="Política de privacidad"
	tienda={nombre}
	description="Qué datos personales trata {nombre} y cómo puede ejercer sus derechos."
/>

<LegalArticle title="Política de privacidad" updatedAt="Noviembre de 2026">
	<p>
		Esta política explica qué datos personales trata <strong>{nombre}</strong> cuando usted visita su
		sitio web o le envía un pedido, y cómo puede ejercer sus derechos sobre ellos.
	</p>

	<h2>1. Responsable y encargado del tratamiento</h2>
	<p>
		<strong>Responsable:</strong>
		{nombre} decide para qué se usan los datos de sus clientes y responde por ese uso.
	</p>
	<LegalContacto {tienda} />
	<p>
		<strong>Encargado técnico:</strong> SVELPY (plataforma Pinodo) aloja y mantiene el sitio. Solo trata
		datos a nivel técnico para que el servicio funcione, y no los vende, cede ni utiliza para fines propios.
	</p>

	<h2>2. Qué datos tratamos</h2>
	<ul>
		<li>
			<strong>Navegación sin registro:</strong> no necesita crear una cuenta para ver el catálogo ni para
			hacer un pedido.
		</li>
		<li>
			<strong>Cesta:</strong> las prendas que agrega se guardan solo en el almacenamiento de su navegador;
			no se envían a nuestros servidores.
		</li>
		<li>
			<strong>Pedidos por WhatsApp:</strong> al enviar un pedido, la Tienda recibe su número de WhatsApp,
			el detalle de la cesta y, si los escribe, su nombre y la nota que agregue. Ese mensaje viaja por
			WhatsApp, que tiene su propia política de privacidad.
		</li>
		<li>
			<strong>Datos técnicos:</strong> como cualquier sitio web, el servidor registra datos básicos de
			la conexión (dirección IP, navegador, fecha) por motivos de seguridad.
		</li>
	</ul>

	<h2>3. Para qué los usamos</h2>
	<ul>
		<li>Atender su pedido: confirmar disponibilidad, precio, pago y entrega.</li>
		<li>Responder sus consultas y gestionar cambios o devoluciones.</li>
		<li>
			Enviarle novedades u ofertas por WhatsApp <strong>solo si usted lo autoriza</strong>. Puede
			pedir que dejen de enviárselas en cualquier momento.
		</li>
	</ul>

	<h2>4. Conservación y terceros</h2>
	<p>
		Los datos se conservan mientras sean necesarios para atender su pedido y cumplir obligaciones
		legales.
		{nombre} no vende ni cede sus datos a terceros, salvo a quienes intervengan en la entrega de su pedido
		o cuando una autoridad lo exija.
	</p>

	<h2>5. Sus derechos</h2>
	<p>
		Puede solicitar acceso, corrección o eliminación de sus datos, u oponerse a recibir publicidad,
		escribiendo a la Tienda por los medios de contacto indicados arriba.
	</p>
</LegalArticle>
