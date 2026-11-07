<script lang="ts">
	import { cn } from '#lib/utils/index.ts';
	import type { Snippet } from 'svelte';
	/**
	 * Variantes de texto disponibles para diferentes casos de uso:
	 *
	 * 'body-xl'   - Párrafos principales destacados, intros de secciones, texto hero
	 * 'body-lg'   - Párrafos importantes, descripciones principales, contenido destacado
	 * 'body-base' - Texto estándar, párrafos normales, contenido general
	 * 'body-sm'   - Texto secundario, metadatos, información adicional
	 * 'body-xs'   - Texto muy pequeño, disclaimers, texto legal
	 * 'caption'   - Pies de foto, títulos de imágenes, texto explicativo
	 * 'label'     - Etiquetas de formularios, labels de inputs, títulos de campos
	 * 'helper'    - Texto de ayuda, instrucciones, hints de formularios
	 * 'error'     - Mensajes de error, validaciones, alertas de formulario
	 */
	type TextVariant =
		| 'body-xl'
		| 'body-lg'
		| 'body-base'
		| 'body-sm'
		| 'body-xs'
		| 'caption'
		| 'label'
		| 'helper'
		| 'error';

	/**
	 * Pesos de fuente disponibles:
	 * 'normal'   - Texto estándar, párrafos normales
	 * 'medium'   - Texto con ligero énfasis, labels importantes
	 * 'semibold' - Texto destacado, información importante
	 * 'bold'     - Texto muy importante, llamadas a la acción
	 */
	type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

	/**
	 * Colores de texto disponibles:
	 * 'primary'    - Texto principal, contenido general (negro/blanco según tema)
	 * 'secondary'  - Texto secundario, menos prominente
	 * 'muted'      - Texto deshabilitado, placeholder, metadatos
	 * 'accent'     - Enlaces, botones de texto, elementos interactivos
	 * 'success'    - Mensajes de éxito, confirmaciones
	 * 'warning'    - Advertencias, alertas moderadas
	 * 'error'      - Errores, validaciones fallidas, alertas críticas
	 * 'white'      - Texto blanco (fondos oscuros)
	 * 'black'      - Texto negro (fondos claros)
	 */
	type TextColor =
		| 'primary'
		| 'secondary'
		| 'muted'
		| 'accent'
		| 'success'
		| 'warning'
		| 'error'
		| 'white'
		| 'black';

	type TextElement = 'p' | 'span' | 'div';

	interface Props {
		children: Snippet;
		variant?: TextVariant;
		weight?: TextWeight;
		color?: TextColor;
		truncate?: boolean;
		maxLines?: number;
		element?: TextElement;
		class?: string;
	}

	let {
		children,
		variant = 'body-base',
		weight,
		color = 'secondary',
		truncate = false,
		maxLines,
		element = 'p',
		class: className = ''
	}: Props = $props();

	// Estilos base para cada variante de texto
	const variantStyles: Record<TextVariant, string> = {
		//  PÁGINA PRINCIPAL: Texto introductorio, descripciones destacadas de productos
		'body-xl': 'text-lg/relaxed sm:text-xl/relaxed lg:text-2xl/relaxed',
		// CONTENIDO DESTACADO: Párrafos importantes, descripciones de características
		'body-lg': 'text-base/relaxed sm:text-lg/relaxed lg:text-xl/relaxed',
		// CONTENIDO GENERAL: Párrafos normales, artículos, posts de blog, descripciones
		'body-base': 'text-sm/relaxed sm:text-base/relaxed lg:text-lg/relaxed',
		// INFORMACIÓN SECUNDARIA: Metadatos, fechas, autores, categorías, tags
		'body-sm': 'text-xs/relaxed sm:text-sm/relaxed lg:text-base/relaxed',
		// TEXTO LEGAL: Disclaimers, términos y condiciones, notas al pie
		'body-xs': 'text-xs/relaxed sm:text-xs/relaxed lg:text-sm/relaxed',

		// PIES DE FOTO: Descripciones de imágenes, créditos, texto explicativo
		caption: 'text-xs/normal sm:text-xs/normal lg:text-sm/normal font-medium',

		// FORMULARIOS: Etiquetas de campos, labels de inputs, títulos de secciones
		label: 'text-sm/normal sm:text-sm/normal lg:text-base/normal font-medium',

		// AYUDA AL USUARIO: Instrucciones, hints, placeholder text, tooltips
		helper: 'text-xs/normal sm:text-xs/normal lg:text-sm/normal',

		//  ERRORES Y VALIDACIONES: Mensajes de error, alertas, validaciones de formulario
		error: 'text-xs/normal sm:text-sm/normal lg:text-base/normal font-medium'
	};

	const weightStyles: Record<TextWeight, string> = {
		normal: 'font-normal',
		medium: 'font-medium',
		semibold: 'font-semibold',
		bold: 'font-bold'
	};

	const colorStyles: Record<TextColor, string> = {
		primary: 'text-light-black',
		secondary: 'text-light-two_d',
		muted: 'text-light-four',
		accent: 'text-light-three',
		success: 'text-light-success',
		warning: 'text-light-warning',
		error: 'text-light-error',
		white: 'text-light-one',
		black: 'text-black'
	};

	const computedClasses = $derived(
		[
			variantStyles[variant],
			weight ? weightStyles[weight] : '',
			colorStyles[color],
			truncate ? 'truncate' : '',
			maxLines ? `line-clamp-${maxLines}` : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<svelte:element this={element} class={cn(computedClasses)}>
	{@render children()}
</svelte:element>

<!--
EJEMPLOS DE USO POR VARIANTE:

PÁGINA PRINCIPAL / LANDING:
<Text variant="body-xl">Bienvenido a nuestra plataforma innovadora</Text>

CONTENIDO DESTACADO:
<Text variant="body-lg">Descubre todas las características que tenemos para ti</Text>

CONTENIDO GENERAL:
<Text variant="body-base">Este es el contenido principal de tu artículo o descripción</Text>

INFORMACIÓN SECUNDARIA:
<Text variant="body-sm" color="secondary">Publicado el 15 de junio, 2025</Text>

TEXTO LEGAL:
<Text variant="body-xs" color="muted">* Términos y condiciones aplican</Text>

PIE DE FOTO:
<Text variant="caption" color="secondary">Imagen cortesía de Unsplash</Text>

FORMULARIOS:
<Text variant="label">Nombre completo *</Text>

TEXTO DE AYUDA:
<Text variant="helper" color="muted">Tu contraseña debe tener al menos 8 caracteres</Text>

MENSAJES DE ERROR:
<Text variant="error" color="error">Este campo es obligatorio</Text>
-->
