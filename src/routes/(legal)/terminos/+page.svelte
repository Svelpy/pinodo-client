<script lang="ts">
	import { LegalArticle } from '#lib/components/features/legal/index.ts';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { APP_SITE_CONFIG } from '#lib/constants/index.ts';
</script>

<MainLayout
	title={`Términos y condiciones · ${APP_SITE_CONFIG.APP_NAME}`}
	description="Términos y condiciones de uso de la plataforma y del programa de fidelización de Farmacia Tupa."
	canonicalUrl="/terminos"
>
	<LegalArticle
		title="Términos y condiciones de uso y programa “Farma Club”"
		updatedAt="Octubre de 2026"
	>
		<p>
			Bienvenido a la plataforma web de Farma Club, accesible a través del dominio farmatupa.com (en
			adelante, la <strong>"Plataforma"</strong>). Le solicitamos leer detenidamente estos Términos
			y Condiciones antes de registrarse o utilizar el servicio. Al acceder, registrarse o
			interactuar con la Plataforma, usted declara haber leído, comprendido y aceptado en su
			totalidad las condiciones aquí estipuladas.
		</p>

		<h2>1. Información general y roles de las partes</h2>
		<p>
			<strong>El Operador y Responsable Comercial:</strong> La Plataforma, el programa de fidelización
			"Tupa Club", las promociones, los productos, los premios y la relación comercial con el usuario
			final son de exclusiva titularidad, gestión y responsabilidad de FARMACIA TUPA, con establecimiento
			comercial en la localidad de San Julián, provincia Ñuflo de Chávez, Santa Cruz, Bolivia.
		</p>
		<p>
			<strong>El Proveedor Tecnológico:</strong> La empresa de desarrollo de software SVELPY actúa únicamente
			como proveedor externo de infraestructura tecnológica, diseño de interfaz y mantenimiento de software.
			Svelpy no vende medicamentos, no emite facturas, no otorga ni administra los premios, ni gestiona
			el envío de promociones comerciales por ningún medio digital ni físico. Svelpy queda expresamente
			liberada de cualquier responsabilidad civil, comercial, tributaria, laboral o penal emanada de la
			relación entre Farmacia Tupa y sus clientes y usuarios.
		</p>

		<h2>2. Requisito de edad (mayoría de edad, +18 años)</h2>
		<p>
			El uso de esta Plataforma y la inscripción en el programa Tupa Club están estrictamente
			reservados para personas naturales mayores de 18 años con plena capacidad legal para
			obligarse. Al registrar su Cédula de Identidad (C.I.), usted declara bajo juramento ser mayor
			de edad. Farmacia Tupa se reserva el derecho de cancelar de forma inmediata, sin motivo de
			reclamo y sin previo aviso cualquier cuenta si se detecta que pertenece a un menor de edad.
		</p>

		<h2>3. Naturaleza jurídica de los puntos</h2>
		<p>
			Para evitar cualquier malentendido o controversia comercial, el usuario acepta de manera
			expresa e irrevocable lo siguiente:
		</p>
		<ul>
			<li>
				<strong>Los puntos NO son dinero:</strong> Los puntos acumulados en el programa Tupa Club representan
				únicamente una unidad de incentivo promocional digital y una liberalidad comercial otorgada de
				forma unilateral por Farmacia Tupa. En ningún caso constituyen dinero en efectivo, saldo financiero,
				moneda de curso legal, divisa electrónica ni título valor.
			</li>
			<li>
				<strong>Los puntos NO constituyen prueba de compra ni comprobante fiscal:</strong> La asignación,
				visualización o saldo de puntos en la Plataforma no constituye factura comercial, nota de crédito,
				recibo oficial, comprobante tributario ni comprobante legal de pago.
			</li>
			<li>
				<strong>Inexistencia de correlación fiscal estricta:</strong> La acumulación de puntos puede derivar
				de compras efectivamente facturadas, pero también de bonificaciones especiales, campañas de bienvenida,
				sorteos, promociones de puntos dobles/triples, aniversarios o eventos de mercadeo sin requerimiento
				de compra. Por lo tanto, el saldo de puntos bajo ninguna circunstancia refleja el monto total
				gastado o facturado en la farmacia, ni puede ser utilizado por el cliente ante instancias judiciales
				o de administración tributaria como prueba de compras o transacciones no respaldadas por su respectiva
				factura oficial emitida en mostrador al momento de la venta.
			</li>
			<li>
				<strong>No convertibilidad en efectivo:</strong> Los puntos no pueden ser canjeados, transferidos,
				devueltos ni reembolsados por dinero en moneda nacional (Bolivianos) ni extranjera.
			</li>
			<li>
				<strong>Caducidad y modificación:</strong> Farmacia Tupa se reserva la potestad de ajustar la
				tabla de conversión de puntos, establecer plazos de vigencia o caducidad por inactividad comercial,
				y corregir saldos resultantes de errores tipográficos o fallas informáticas involuntarias.
			</li>
		</ul>

		<h2>4. Canje y entrega de premios</h2>
		<ul>
			<li>
				La disponibilidad de los premios exhibidos en el "Catálogo Digital" o "Lista de Deseos" está
				sujeta al stock físico real existente en Farmacia Tupa.
			</li>
			<li>
				El canje de puntos se efectuará de manera presencial en el mostrador de Farmacia Tupa previa
				presentación de la Cédula de Identidad original del titular de la cuenta.
			</li>
			<li>
				El canje de puntos en negocios aliados, o socios se efectuará en el negocio aliado, de
				manera presencial previa presentación de la Cédula de Identidad original del titular de la
				cuenta y verificación del código de canje, Farmacia Tupa no se responsabiliza por mal canje
				o malos tratos recibidos por el personal del socio aliado.
			</li>
			<li>
				Farmacia Tupa se reserva el derecho de sustituir cualquier premio por otro de valor o
				características similares en caso de agotamiento de inventario.
			</li>
		</ul>

		<h2>5. Conductas prohibidas y suspensión de cuentas</h2>
		<p>
			Queda prohibido el uso de identidades falsas, la duplicidad fraudulenta de cuentas, la
			alteración técnica del código fuente o cualquier maniobra destinada a vulnerar los algoritmos
			de acumulación de puntos y alteración de puntos. Farmacia Tupa y Svelpy podrán dar de baja
			inmediatamente a cualquier usuario sospechoso de fraude o mala fe.
		</p>
	</LegalArticle>
</MainLayout>
