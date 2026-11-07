<script lang="ts">
	import { LegalArticle } from '#lib/components/features/legal/index.ts';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { APP_SITE_CONFIG } from '#lib/constants/index.ts';
</script>

<MainLayout
	title={`Política de cookies · ${APP_SITE_CONFIG.APP_NAME}`}
	description="Qué cookies y almacenamiento local usa la aplicación de Tupa Club y cómo gestionarlos."
	canonicalUrl="/cookies"
>
	<LegalArticle title="Política de cookies y almacenamiento local" updatedAt="Octubre de 2026">
		<p>
			En farmatupa.com utilizamos tecnologías de almacenamiento local para garantizar la mejor
			experiencia de usuario en nuestra aplicación web progresiva (PWA / Web App).
		</p>

		<h2>1. ¿Qué son las cookies y el almacenamiento local?</h2>
		<p>
			Las cookies y tecnologías afines (como Local Storage y Session Storage de su navegador) son
			pequeños archivos de datos que se almacenan temporalmente en su teléfono móvil o computadora
			para permitir que la aplicación reconozca su dispositivo y mantenga sus sesiones de usuario
			activas.
		</p>

		<h2>2. ¿Qué tipo de cookies utilizamos?</h2>
		<p>
			La Plataforma utiliza exclusivamente tecnologías necesarias para el funcionamiento operativo:
		</p>
		<ul>
			<li>
				<strong>Cookies de Sesión y Autenticación (Estrictamente Necesarias):</strong> Permiten que usted
				ingrese su C.I. y mantenga la sesión iniciada mientras consulta sus puntos o navega por el catálogo
				de premios sin tener que identificarse en cada pantalla.
			</li>
			<li>
				<strong>Almacenamiento Local de Preferencias:</strong> Guarda en la memoria de su navegador sus
				premios marcados en la "Lista de Deseos / Vales Favoritos" para que pueda consultarlos rápidamente
				incluso con conexiones lentas de internet.
			</li>
			<li>
				<strong>NO utilizamos cookies publicitarias de terceros (Third-Party Cookies):</strong> No implementamos
				píxeles de rastreo invasivo de redes publicitarias externas que sigan su navegación por fuera
				del dominio de Farmacia Tupa.
			</li>
			<li>
				<strong>Aplicación Web Progresiva (PWA) en Dispositivos Móviles:</strong> Se guía al usuario para
				instalar el acceso directo o "descargar" la aplicación en su dispositivo, y se pone a disposición
				una opción o botón para desinstalar la PWA en cualquier momento si el usuario así lo desea.
			</li>
		</ul>

		<h2>3. Cómo gestionar o desactivar el almacenamiento</h2>
		<p>
			Usted puede bloquear, limpiar o desactivar el almacenamiento local y las cookies accediendo a
			la configuración de privacidad de su navegador web (Google Chrome, Safari, Mozilla Firefox,
			etc.). Tenga presente que, si bloquea las cookies técnicas, no podrá mantener la sesión
			iniciada para consultar sus puntos de Farma Club en tiempo real.
		</p>
	</LegalArticle>
</MainLayout>
