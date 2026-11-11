<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { AlertBox, Button, FormSection, Input, TextArea } from '#lib/components/ui/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { Tienda, TiendaFormValues, TiendaImagenForm } from '#lib/interfaces/index.ts';
	import { errorService, tiendaService } from '#lib/services/index.ts';
	import {
		alert,
		buildTiendaPatch,
		tiendaFormSignature,
		toTiendaForm,
		validateImagenFile,
		validateSchemaDeep
	} from '#lib/utils/index.ts';
	import { TIENDA_LIMITS, tiendaSchema } from '#lib/zod/index.ts';
	import NegocioHorarioField from './negocioHorarioField.svelte';
	import NegocioImagenField from './negocioImagenField.svelte';
	import NegocioRedesField from './negocioRedesField.svelte';

	interface Props {
		tienda: Tienda;
		/** Sin permiso de edición: el formulario se muestra deshabilitado y sin botones */
		readonly?: boolean;
		/** Avisa si hay cambios sin guardar (para avisar antes de salir de la página) */
		onDirtyChange?: (dirty: boolean) => void;
		/** Responde la configuración completa; el padre la reemplaza y el formulario se reinicia */
		onSaved: (tienda: Tienda) => void;
	}

	let { tienda, readonly = false, onDirtyChange, onSaved }: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	const imagenVacia = (): TiendaImagenForm => ({ file: null, eliminar: false });

	let form = $state<HTMLFormElement>();
	let values = $state<TiendaFormValues>(untrack(() => toTiendaForm(tienda)));
	let initialSignature = $state(untrack(() => tiendaFormSignature(values)));
	let logo = $state(imagenVacia());
	let favicon = $state(imagenVacia());
	let errors = $state<Record<string, string>>({});
	let formError = $state('');
	let isSaving = $state(false);

	const hasChanges = $derived(
		tiendaFormSignature(values) !== initialSignature ||
			!!logo.file ||
			(logo.eliminar && !!tienda.logo_url) ||
			!!favicon.file ||
			(favicon.eliminar && !!tienda.favicon_url)
	);

	$effect(() => {
		onDirtyChange?.(hasChanges);
	});

	function fillForm(source: Tienda) {
		values = toTiendaForm(source);
		initialSignature = tiendaFormSignature(values);
		logo = imagenVacia();
		favicon = imagenVacia();
		errors = {};
		formError = '';
	}

	// La tienda cambia al guardar (o al recargarla): el formulario parte de los datos nuevos
	$effect(() => {
		const source = tienda;
		untrack(() => fillForm(source));
	});

	function addRed() {
		values.redes_sociales.push({ red: '', url: '' });
	}

	// En un formulario largo el primer error puede quedar fuera de la vista
	async function focusFirstError() {
		await tick();
		form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
	}

	function validate() {
		const result = validateSchemaDeep(tiendaSchema, values);
		const imagenErrors: Record<string, string> = {};
		const logoError = logo.file && validateImagenFile(logo.file);
		const faviconError = favicon.file && validateImagenFile(favicon.file);
		if (logoError) imagenErrors.logo = logoError;
		if (faviconError) imagenErrors.favicon = faviconError;

		if (!result.success || Object.keys(imagenErrors).length > 0) {
			errors = { ...(result.success ? {} : result.errors), ...imagenErrors };
			return null;
		}
		errors = {};
		return result.data;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (readonly || !hasChanges) return;

		const data = validate();
		if (!data) {
			focusFirstError();
			return;
		}

		const patch = buildTiendaPatch(tienda, data, { logo, favicon });
		// Solo cambiaron espacios o filas vacías: no hay nada que enviar
		if (Object.keys(patch).length === 0) {
			fillForm(tienda);
			return;
		}

		isSaving = true;
		try {
			const saved = await tiendaService.update(patch);
			alert('success', 'Datos del negocio actualizados.');
			onSaved(saved);
		} catch (error) {
			// Errores de validación del backend, para mostrarlos bajo cada campo
			errors = errorService.getFieldErrors(error);
			formError = Object.keys(errors).length > 0 ? '' : errorService.getMessage(error);
			if (formError) form?.scrollIntoView({ block: 'start', behavior: 'smooth' });
			else focusFirstError();
		} finally {
			isSaving = false;
		}
	}
</script>

<form
	bind:this={form}
	id={FORM_ID}
	onsubmit={handleSubmit}
	novalidate
	class="scroll-mt-4 space-y-4"
	aria-label="Datos del negocio"
>
	{#if formError}
		<AlertBox>{formError}</AlertBox>
	{/if}

	<fieldset class="space-y-4" disabled={isSaving || readonly}>
		<FormSection
			title="Identidad"
			description="Cómo se presenta tu tienda a los clientes y en el panel."
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					id="{id}-nombre"
					class="sm:col-span-2"
					label="Nombre de la tienda"
					bind:value={values.nombre_tienda}
					error={errors.nombre_tienda}
					aria-invalid={!!errors.nombre_tienda}
					maxlength={TIENDA_LIMITS.NOMBRE_MAX}
					autocomplete="organization"
					required
				/>
				<TextArea
					id="{id}-descripcion"
					class="sm:col-span-2"
					label="Descripción (opcional)"
					bind:value={values.descripcion}
					error={errors.descripcion}
					aria-invalid={!!errors.descripcion}
					rows={3}
					placeholder="Qué vendes y qué te diferencia"
				/>
				<NegocioImagenField
					id="{id}-logo"
					label="Logo"
					hint="Lo verán tus clientes en la tienda y también aparece en el menú lateral de este panel. Hasta 5 MB, sin SVG."
					currentUrl={tienda.logo_url}
					bind:value={logo}
					error={errors.logo}
					disabled={isSaving || readonly}
				/>
				<NegocioImagenField
					id="{id}-favicon"
					label="Favicon"
					hint="Icono de la tienda en los metadatos del sitio: se ve en la pestaña del navegador y en favoritos. Imagen cuadrada (p. ej. 512 × 512) de hasta 5 MB, sin SVG."
					currentUrl={tienda.favicon_url}
					bind:value={favicon}
					error={errors.favicon}
					disabled={isSaving || readonly}
				/>
			</div>
		</FormSection>

		<FormSection
			title="Contacto"
			description="Los clientes envían sus pedidos al WhatsApp; el resto se muestra en el pie de la tienda."
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					id="{id}-whatsapp"
					type="tel"
					inputmode="tel"
					label="WhatsApp (opcional)"
					bind:value={values.whatsapp}
					error={errors.whatsapp}
					aria-invalid={!!errors.whatsapp}
					maxlength={TIENDA_LIMITS.TELEFONO_MAX}
					placeholder="Con código de país, p. ej. +59171234567"
					autocomplete="off"
				/>
				<Input
					id="{id}-telefono"
					type="tel"
					inputmode="tel"
					label="Teléfono (opcional)"
					bind:value={values.telefono}
					error={errors.telefono}
					aria-invalid={!!errors.telefono}
					maxlength={TIENDA_LIMITS.TELEFONO_MAX}
					placeholder="Solo dígitos, sin espacios"
					autocomplete="off"
				/>
				<Input
					id="{id}-email"
					class="sm:col-span-2"
					type="email"
					inputmode="email"
					label="Correo de contacto (opcional)"
					bind:value={values.email_contacto}
					error={errors.email_contacto}
					aria-invalid={!!errors.email_contacto}
					maxlength={TIENDA_LIMITS.EMAIL_MAX}
					autocomplete="off"
				/>
			</div>
		</FormSection>

		<FormSection title="Ubicación" description="Dónde pueden visitarte.">
			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					id="{id}-direccion"
					label="Dirección (opcional)"
					bind:value={values.direccion}
					error={errors.direccion}
					aria-invalid={!!errors.direccion}
					maxlength={TIENDA_LIMITS.DIRECCION_MAX}
					autocomplete="off"
				/>
				<Input
					id="{id}-ciudad"
					label="Ciudad (opcional)"
					bind:value={values.ciudad}
					error={errors.ciudad}
					aria-invalid={!!errors.ciudad}
					maxlength={TIENDA_LIMITS.CIUDAD_MAX}
					autocomplete="off"
				/>
				<Input
					id="{id}-mapa"
					class="sm:col-span-2"
					type="url"
					inputmode="url"
					label="Enlace del mapa (opcional)"
					bind:value={values.map_url}
					error={errors.map_url}
					aria-invalid={!!errors.map_url}
					maxlength={TIENDA_LIMITS.MAP_URL_MAX}
					placeholder="https://maps.google.com/…"
					autocomplete="off"
				/>
			</div>
		</FormSection>

		<FormSection
			title="Horario"
			description="Marca los días que abres. Un día sin marcar se muestra como cerrado."
		>
			<NegocioHorarioField bind:value={values.horario} {errors} disabled={isSaving || readonly} />
		</FormSection>

		<FormSection title="Redes sociales" description="Enlaces a tus perfiles.">
			{#snippet action()}
				{#if !readonly}
					<Button variant="outline" size="sm" onclick={addRed} disabled={isSaving}>
						{#snippet leftIcon()}<PlusIcon class="size-4" />{/snippet}
						Añadir red social
					</Button>
				{/if}
			{/snippet}
			<NegocioRedesField
				bind:value={values.redes_sociales}
				{errors}
				disabled={isSaving || readonly}
			/>
		</FormSection>

		<FormSection title="Mantenimiento">
			<label class="flex cursor-pointer items-start gap-3">
				<input
					type="checkbox"
					bind:checked={values.en_mantenimiento}
					class="mt-1 size-4 shrink-0 accent-light-three dark:accent-dark-three"
					aria-describedby="{id}-mantenimiento-hint"
				/>
				<span>
					<span class="block text-sm font-medium text-light-two dark:text-dark-two">
						Tienda en mantenimiento
					</span>
					<span
						id="{id}-mantenimiento-hint"
						class="block text-sm text-light-two_d dark:text-dark-two_d"
					>
						Los clientes verán un aviso en lugar de la tienda. El panel sigue funcionando.
					</span>
				</span>
			</label>
			{#if values.en_mantenimiento}
				<AlertBox variant="warning" class="mt-4">
					{tienda.en_mantenimiento
						? 'La tienda está cerrada al público.'
						: 'Al guardar, la tienda dejará de estar visible para los clientes.'}
				</AlertBox>
			{/if}
		</FormSection>
	</fieldset>

	{#if !readonly}
		<!-- Barra de acciones fija al pie de la tarjeta con scroll -->
		<div
			class="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-light-one_d bg-light-one/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-end dark:border-dark-one_d dark:bg-dark-one/95"
		>
			<p
				class="text-center text-xs text-light-two_d sm:mr-auto sm:text-left dark:text-dark-two_d"
				aria-live="polite"
			>
				{hasChanges ? 'Tienes cambios sin guardar.' : 'Modifica algún campo para guardar.'}
			</p>
			<Button
				variant="outline"
				onclick={() => fillForm(tienda)}
				disabled={isSaving || !hasChanges}
				class="w-full sm:w-auto"
			>
				Descartar cambios
			</Button>
			<Button
				type="submit"
				form={FORM_ID}
				loading={isSaving}
				disabled={!hasChanges}
				class="w-full sm:w-auto"
			>
				Guardar cambios
			</Button>
		</div>
	{/if}
</form>
