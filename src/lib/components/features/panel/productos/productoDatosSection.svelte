<script lang="ts">
	import { Input, Select, TextArea } from '#lib/components/ui/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { ProductoFormValues, Seccion } from '#lib/interfaces/index.ts';
	import { PRODUCTO_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		values: ProductoFormValues;
		secciones: readonly Seccion[];
		errors: Record<string, string>;
		disabled?: boolean;
		/** La sección cambió: el formulario descarta las categorías de la anterior */
		onSeccionChange: (seccionId: string) => void;
		/** Abre el diálogo para crear una sección sin salir del formulario */
		onCreateSeccion?: () => void;
	}

	let {
		values = $bindable(),
		secciones,
		errors,
		disabled = false,
		onSeccionChange,
		onCreateSeccion
	}: Props = $props();

	const id = $props.id();
</script>

<fieldset class="grid gap-4 sm:grid-cols-2" {disabled}>
	<div>
		<Select
			id="{id}-seccion"
			label="Sección"
			value={values.seccion_id}
			onchange={(event) => onSeccionChange(event.currentTarget.value)}
			error={errors.seccion_id}
			aria-invalid={!!errors.seccion_id}
			required
		>
			<option value="" disabled>Selecciona una sección</option>
			{#each secciones as seccion (seccion.id)}
				<option value={seccion.id}>{seccion.nombre}</option>
			{/each}
		</Select>

		{#if onCreateSeccion}
			<div class="mt-1 flex flex-wrap items-center gap-x-3">
				{#if secciones.length === 0}
					<span class="text-xs text-light-two_d dark:text-dark-two_d">
						Aún no hay secciones registradas.
					</span>
				{/if}
				<button
					type="button"
					onclick={onCreateSeccion}
					{disabled}
					class="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-light-three underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none disabled:opacity-50 dark:text-dark-three"
				>
					<PlusIcon class="size-4" />
					Nueva sección
				</button>
			</div>
		{/if}
	</div>

	<Select
		id="{id}-visibilidad"
		label="Visibilidad"
		value={values.is_visible ? 'true' : 'false'}
		onchange={(event) => (values.is_visible = event.currentTarget.value === 'true')}
	>
		<option value="true">Visible</option>
		<option value="false">Oculto</option>
	</Select>

	<Input
		id="{id}-nombre"
		class="sm:col-span-2"
		label="Nombre"
		bind:value={values.nombre}
		error={errors.nombre}
		aria-invalid={!!errors.nombre}
		maxlength={PRODUCTO_LIMITS.NOMBRE_MAX}
		autocomplete="off"
		placeholder="Ej. Camisa Oxford"
		required
	/>

	<TextArea
		id="{id}-descripcion"
		class="sm:col-span-2"
		label="Descripción (opcional)"
		bind:value={values.descripcion}
		error={errors.descripcion}
		aria-invalid={!!errors.descripcion}
		maxlength={PRODUCTO_LIMITS.DESCRIPCION_MAX}
		rows={3}
	/>

	<TextArea
		id="{id}-cuidados"
		label="Cuidados (opcional)"
		bind:value={values.cuidados}
		error={errors.cuidados}
		aria-invalid={!!errors.cuidados}
		maxlength={PRODUCTO_LIMITS.CUIDADOS_MAX}
		rows={2}
	/>

	<TextArea
		id="{id}-composicion"
		label="Composición (opcional)"
		bind:value={values.composicion}
		error={errors.composicion}
		aria-invalid={!!errors.composicion}
		maxlength={PRODUCTO_LIMITS.COMPOSICION_MAX}
		rows={2}
	/>
</fieldset>
