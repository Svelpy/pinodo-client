<script lang="ts">
	import { LegalArticle, LegalContacto } from '#lib/components/features/legal/index.ts';
	import { TiendaSeo } from '#lib/components/features/tienda/index.ts';

	let { data } = $props();

	const tienda = $derived(data.tienda);
	const nombre = $derived(tienda.nombre_tienda);
</script>

<TiendaSeo
	title="Términos y condiciones"
	tienda={nombre}
	description="Condiciones de uso del sitio web de {nombre} y de los pedidos enviados por WhatsApp."
/>

<LegalArticle title="Términos y condiciones" updatedAt="Noviembre de 2026">
	<p>
		Estos términos regulan el uso del sitio web de <strong>{nombre}</strong> (en adelante, "la Tienda")
		y de los pedidos que se envían desde él. Al navegar por el catálogo o enviar un pedido, usted acepta
		estas condiciones.
	</p>

	<h2>1. Quién es quién</h2>
	<p>
		<strong>Responsable comercial:</strong> los productos, precios, promociones, pagos, entregas,
		cambios y la relación con el cliente son responsabilidad exclusiva de {nombre}.
	</p>
	<LegalContacto {tienda} />
	<p>
		<strong>Proveedor tecnológico:</strong> SVELPY, a través de su plataforma Pinodo, provee únicamente
		la infraestructura y el software del sitio. No vende productos, no recibe pagos, no realiza entregas
		ni interviene en la relación comercial entre la Tienda y sus clientes, por lo que no asume responsabilidad
		por ella.
	</p>

	<h2>2. Cómo funcionan los pedidos</h2>
	<ul>
		<li>
			El catálogo es informativo. Las prendas que agrega a la cesta se guardan solo en su navegador.
		</li>
		<li>
			Al pulsar "Enviar pedido por WhatsApp" se abre una conversación con la Tienda con el detalle
			de la cesta. Ese mensaje es una <strong>solicitud de pedido</strong>, no una compra
			confirmada.
		</li>
		<li>
			La Tienda le responderá para confirmar disponibilidad, precio final, forma de pago y entrega.
			El pedido queda confirmado solo cuando ambas partes lo acuerdan.
		</li>
	</ul>

	<h2>3. Precios, rebajas y disponibilidad</h2>
	<ul>
		<li>
			Los precios se expresan en bolivianos (Bs) y son los vigentes el día en que se consultan. Las
			rebajas tienen vigencia limitada.
		</li>
		<li>
			El stock mostrado es referencial y puede cambiar entre la consulta y la confirmación del
			pedido.
		</li>
		<li>Las imágenes son ilustrativas: los colores pueden verse distintos según la pantalla.</li>
		<li>
			Si un precio o dato se publicó por error, la Tienda se lo informará antes de confirmar el
			pedido.
		</li>
	</ul>

	<h2>4. Pagos y entregas</h2>
	<p>
		Los medios de pago, costos de envío, plazos y lugar de entrega se acuerdan directamente con la
		Tienda por WhatsApp. Este sitio no procesa pagos ni guarda datos de tarjetas.
	</p>

	<h2>5. Cambios y devoluciones</h2>
	<p>
		Las condiciones de cambio o devolución son las que la Tienda le indique al confirmar el pedido.
		Ante cualquier inconveniente con una prenda, comuníquese con la Tienda por los medios de
		contacto indicados arriba.
	</p>

	<h2>6. Uso del sitio y contenido</h2>
	<p>
		Las fotografías, textos y marcas del catálogo pertenecen a {nombre} o a sus respectivos titulares.
		No está permitido copiarlos con fines comerciales ni usar el sitio para actividades fraudulentas o
		que afecten su funcionamiento.
	</p>

	<h2>7. Cambios en estos términos</h2>
	<p>
		La Tienda puede actualizar estos términos. La versión vigente es la publicada en esta página,
		con su fecha de última actualización.
	</p>
</LegalArticle>
