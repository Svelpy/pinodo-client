<script lang="ts">
	import { LegalArticle } from '#lib/components/features/legal/index.ts';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { APP_SITE_CONFIG } from '#lib/constants/index.ts';
</script>

<MainLayout
	title={`Política de privacidad · ${APP_SITE_CONFIG.APP_NAME}`}
	description="Cómo Farmacia Tupa trata y protege los datos personales de los usuarios de Tupa Club."
	canonicalUrl="/privacidad"
>
	<LegalArticle
		title="Política de privacidad y protección de datos personales"
		updatedAt="Octubre de 2026"
	>
		<p>
			La presente Política de Privacidad regula el tratamiento de los datos personales de los
			usuarios registrados en el programa Tupa Club a través del dominio farmatupa.com, aplicando
			principios de licitud, consentimiento previo, proporcionalidad, seguridad y transparencia
			reconocidos a nivel internacional (estándares RGPD/GDPR).
		</p>

		<h2>1. Responsable del tratamiento de datos vs. proveedor tecnológico</h2>
		<p>
			<strong>Responsable del Tratamiento de Datos:</strong> La entidad que decide las finalidades, contenidos
			y tratamiento de los datos personales de los clientes es FARMACIA TUPA, con domicilio en San Julián,
			Santa Cruz, Bolivia. Es la única responsable legal frente a los usuarios y las autoridades por la
			utilización de sus datos para fines comerciales.
		</p>
		<p>
			<strong>Encargado Técnico del Tratamiento:</strong> La empresa SVELPY actúa únicamente como procesador
			de datos a nivel técnico (Data Processor), encargándose del almacenamiento en servidores seguros
			y el mantenimiento operativo de la Plataforma. Svelpy no comercializa, no transfiere, no explota
			ni utiliza la información personal de los clientes de Farmacia Tupa para beneficio propio o de terceros.
		</p>

		<h2>2. Datos personales recolectados</h2>
		<p>
			Para la operación del programa de puntos, Farmacia Tupa recolecta y almacena los siguientes
			datos:
		</p>
		<ul>
			<li>Nombre completo y Apellidos.</li>
			<li>
				Número de Cédula de Identidad (C.I.) (utilizado como identificador unívoco de cliente).
			</li>
			<li>Número de teléfono móvil / WhatsApp.</li>
			<li>Fecha de nacimiento (para promociones y felicitaciones por cumpleaños).</li>
			<li>Historial transaccional de acumulación y canje de puntos dentro del sistema.</li>
		</ul>

		<h2>3. Finalidad del tratamiento y autorización para envío de publicidad</h2>
		<p>
			Al registrarse en Tupa Club, usted otorga su consentimiento libre, expreso, informado e
			inequívoco para que sus datos sean tratados con las siguientes finalidades:
		</p>
		<ul>
			<li>
				<strong>Operación del Sistema de Lealtad:</strong> Asignar puntos por visitas o compras, consultar
				saldos, verificar canjes y actualizar el estado de sus beneficios.
			</li>
			<li>
				<strong>Comunicaciones Comerciales y Publicidad (Exclusivas de Farmacia Tupa):</strong>
				Utilizar su número de teléfono celular para remitirle ofertas, descuentos especiales, alertas
				de días con puntos dobles o triples, recordatorios de reposición de tratamientos médicos, promociones
				por cumpleaños y catálogos de premios a través de WhatsApp, mensajes SMS o llamadas telefónicas
				directas.
			</li>
			<li>
				<strong>Auditoría interna y seguridad:</strong> Evitar fraudes, usurpación de identidad o duplicidad
				de canjes en mostrador.
			</li>
		</ul>

		<h2>4. Derechos del usuario (acceso, rectificación y cancelación, ARCO)</h2>
		<p>Todo usuario tiene derecho a:</p>
		<ul>
			<li>Conocer qué datos personales mantiene la farmacia en sus registros.</li>
			<li>Solicitar la corrección o actualización de sus datos si fuesen erróneos.</li>
			<li>
				<strong>Revocar el consentimiento para recibir publicidad comercial:</strong> El usuario podrá
				en cualquier momento solicitar dejar de recibir mensajes de WhatsApp o promociones comunicándolo
				directamente al personal de mostrador de Farmacia Tupa o respondiendo la palabra "BAJA" o "CANCELAR"
				en el canal de mensajería utilizado.
			</li>
			<li>
				Solicitar la eliminación total de su cuenta de Tupa Club (lo cual conllevará la pérdida
				definitiva de los puntos acumulados).
			</li>
		</ul>

		<h2>5. Seguridad de la información y transferencia a terceros</h2>
		<p>
			Farmacia Tupa y Svelpy aplican protocolos técnicos de encriptación y control de acceso
			restringido en servidores en la nube para resguardar la confidencialidad de la información.
			Los datos personales de los usuarios no serán vendidos, cedidos, alquilados ni transferidos a
			empresas financieras, agencias de publicidad externas ni aseguradoras.
		</p>
	</LegalArticle>
</MainLayout>
