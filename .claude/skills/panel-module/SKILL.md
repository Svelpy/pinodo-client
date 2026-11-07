---
name: panel-module
description: Estructura y reglas para crear o modificar un módulo CRUD del panel (src/routes/panel/*), p. ej. categorías, productos, colores, ventas, mi negocio. Úsala siempre que se implemente una página nueva del panel con listado, formularios o acciones, para seguir el patrón de componentes, servicios, validaciones y paleta del proyecto.
---

# Módulo del panel

Referencia en este repo: el módulo **usuarios**
(`src/routes/panel/usuarios/+page.svelte` y `src/lib/components/features/panel/usuarios/`).
Léelo antes de empezar y copia su forma.

Textos de interfaz, comentarios y nombres de dominio en **español**.

## 1. Dónde va cada cosa (una carpeta o archivo por módulo, nunca mezclados)

| Qué                                 | Dónde                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Tipos de la API                     | `src/lib/interfaces/<modulo>.interface.ts` + `export *` en `interfaces/index.ts`               |
| Validaciones zod                    | `src/lib/zod/<modulo>.schema.ts` + `export *` en `zod/index.ts`                                |
| Llamadas a la API                   | `src/lib/services/<modulo>.service.ts` (clase + singleton) + `export *` en `services/index.ts` |
| Formateadores                       | `src/lib/utils/format.ts` (funciones `formatXxx` con `fallback`, como las existentes)          |
| Componentes del módulo              | `src/lib/components/features/panel/<modulo>/` + su `index.ts`                                  |
| Skeleton de carga                   | `src/lib/components/skeletons/<modulo>ListSkeleton.svelte` + `skeletons/index.ts`              |
| Componentes genéricos reutilizables | `src/lib/components/ui/` + `ui/index.ts`                                                       |
| Página                              | `src/routes/panel/<modulo>/+page.svelte`                                                       |

Los componentes de un módulo **no** se crean sueltos en `features/panel/`. Si algo sirve a
más de un módulo (Avatar, AlertBox, EmptyState, PasswordInput…), va a `ui` y se exporta ahí.
Antes de crear un componente UI, revisa `ui/index.ts` y reutiliza (`Sheet`, `Modal`,
`ModalConfirm`, `Input`, `Select`, `Button`, `Badge`, `Pagination`, `Table*`, `DropdownMenu`,
`Tabs`, `EmptyState`, `AlertBox`…).

### Importaciones: siempre por barrel

Todo se importa desde el `index.ts` de su carpeta, con extensión: `#lib/config/index.ts`
(también `Role`, `Module`, `Action`, `AssignableUserRole`), `#lib/constants/index.ts`,
`#lib/interfaces/index.ts`, `#lib/services/index.ts`, `#lib/stores/index.ts`,
`#lib/utils/index.ts`, `#lib/zod/index.ts`, `#lib/icons/outline/index.ts`,
`#lib/components/ui/index.ts`, `#lib/components/skeletons/index.ts` y
`#lib/components/features/panel/<modulo>/index.ts`. Un archivo nuevo se exporta en el barrel de su
carpeta y se consume desde ahí; no se importan archivos sueltos como
`#lib/utils/pagination.ts` o `#lib/zod/usuario.schema.ts`.

Excepciones: dentro de la propia carpeta de un componente se importa el archivo hermano
(`./usuarioRow.svelte`) y no su `index.ts`; y lo que los barrels hoy no exportan
(`config/navigation.config.ts`, `utils/routeGuard.ts`).

## 2. Archivos de `features/panel/<modulo>/` (prefijo con el nombre del módulo)

- `xxxList.svelte` — contenedor: estados de error, esqueleto, vacío, lista (tarjetas en móvil, tabla desde `md`) y pie con "Mostrar N por página" + `Pagination`.
- `xxxTable.svelte` + `xxxRow.svelte` — escritorio. `xxxCard.svelte` — móvil.
- `xxxActions.svelte` — botón de 3 puntos + `DropdownMenu`; muestra solo las opciones cuyo handler recibe.
- `xxxFilters.svelte` — filtros (etiqueta y select en una fila si es uno solo).
- `xxxFormSheet.svelte` (o `...FormModal`) — crear/editar; `xxxDeleteModal.svelte` con `ModalConfirm`; otros diálogos del módulo (p. ej. restablecer contraseña).
- `index.ts` — exporta todo; la página importa desde `#lib/components/features/panel/<modulo>/index.ts`.

Reglas de los diálogos: reciben `isOpen`/el objeto (`null` = cerrado), **hacen su propia petición**, muestran `alert('success' | 'error', …)` y avisan con `onSaved`/`onDeleted`. No cierran mientras `isLoading`. Resetean el formulario cada vez que se abren (`$effect` + `untrack`). Editar envía solo los campos que cambiaron (`$derived.by` con el diff) y deshabilita Guardar sin cambios. Errores: `errorService.getFieldErrors(error)` bajo cada campo y `errorService.getMessage(error)` en un `AlertBox` si no hay errores por campo.

## 3. La página

- Envolver en `<MainLayout title="…" noIndex class="space-y-4 container mx-auto">`.
- **No usar `PageHeader`**: el header de la app ya muestra el título del módulo. Solo queda el botón de acción principal ("Nuevo …", `class="w-full sm:w-auto"`, icono `PlusIcon`), a la derecha de la fila de filtros.
- Estado local (`$state`): lista, `currentPage`, `perPage`, `totalPages`, `total`, `isLoading`, `loadError`, y los objetos de cada diálogo.
- `loadXxx(page)` con `lastRequestId` para que una respuesta lenta no pise a la nueva; carga en `onMount`.
- Cambiar filtro o `perPage` vuelve a la página 1; al cambiar de filtro se vacía la lista para mostrar el esqueleto.
- Tras crear/editar/eliminar se **actualiza la lista localmente** (anteponer, reemplazar, quitar y ajustar `total`/`totalPages`; recargar solo si la página quedó vacía) en vez de volver a pedirla. Si el elemento ya no cumple el filtro, quitarlo de la vista.
- Permisos: `can($currentRole, Module.X, Action.Y)` para mostrar botones y pasar (o no) los handlers `onEdit/onDelete…` (`undefined` = no se muestra). Si la acción depende del objeto (p. ej. jerarquía de roles), decídelo dentro de `xxxActions`.

## 4. Servicios y datos

- Una clase por área en `services/`, `requireAuth: true`, rutas con la barra final que define la API (`/usuarios/`), `PATCH` envía solo lo modificado.
- Listados paginados: `PaginatedResponse<T>` y `buildPaginationQuery` (de `#lib/utils/index.ts`).
- Los límites de validación espejan los de la API; expórtalos como constante (`USUARIO_LIMITS`).
- `validateSchema(schema, values)` devuelve `{ success, data | errors }` (errores por campo, solo el primero).
- Opcionales vacíos se envían como `null` (transform en el schema).

## 5. Alta de un módulo nuevo (checklist)

1. Permisos: `Module` en `config/permissions.config.ts` (y `ROLE_PERMISSIONS` por rol) si no existe.
2. Acceso a la página: `config/routeAccess.config.ts` (`ROLE_ACCESS`).
3. Menú: item en `PANEL_NAVIGATION` (`config/navigation.config.ts`), con `children` solo si hay sub-páginas reales.
4. Interfaz → schema → servicio → (formateadores) → skeleton → componentes del módulo → página.
5. Tests (vitest, proyecto `server`): `<modulo>.schema.spec.ts` y `<modulo>.service.spec.ts` (mock con `vi.mock('#lib/config/index.ts', …)` y `vi.hoisted`), más specs de utilidades nuevas.
6. Verificar (abajo) y revisar que el módulo no dejó archivos sueltos fuera de su carpeta.

## 6. Estilo y accesibilidad

- Solo colores de la paleta de `src/routes/layout.css`: `light-one…light-black`, `dark-one…dark-black` (con sufijo `_d`), `bg-light-error`, etc. Nada de `gray-*`, `slate-*`, `red-*`, `muted`. Cada clase clara lleva su par `dark:`.
- Esquinas rectas (el proyecto las quitó a propósito). Excepciones: la tarjeta principal del panel, el menú de tienda y `Avatar`.
- Esqueletos con `animate-pulse` y `bg-light-one_d dark:bg-dark-one_d`, con las mismas columnas que la tabla real y `role="status"` + texto `sr-only`.
- Botones solo con icono: `aria-label`. Listas ocupadas: `aria-busy`. Errores: `role="alert"`.
- Contraste y tamaño táctil: controles de al menos `size-9`; inputs ya cumplen 16px en táctil.

## 7. Verificación antes de dar el módulo por terminado

```sh
npx prettier --write <solo los archivos nuevos o modificados>   # nunca sobre todo components/ui: reformatea archivos ajenos
npx eslint <carpetas tocadas>
pnpm check                                                       # debe terminar sin errores ni avisos
npx vitest --run --project server
```

Si no pudiste abrir la página en el navegador (requiere sesión contra la API), dilo explícitamente en lugar de afirmar que funciona.

## 8. Detalles de Svelte que ya nos dieron problemas

- Los barrels forman ciclos (p. ej. `services` ↔ `utils` ↔ `stores`) que funcionan mientras lo importado se use al ejecutar funciones y no al evaluar el módulo; no uses valores de otro barrel a nivel superior de un módulo de `services/` o `stores/`.
- `{#each { length: n }, i (i)}` para repetir sin variable sobrante.
- `$props.id()` para ids únicos de formularios; `Button type="submit" form={FORM_ID}` para el botón del footer.
- `Select` sin `label` + `<label for>` propio cuando etiqueta y select van en una fila.
- `bind:isOpen` del `DropdownMenu`: una instancia por fila (`xxxActions`) está bien.
- Props `$bindable` reciben `value={x}` + `onchange` cuando el padre necesita reaccionar al cambio.
