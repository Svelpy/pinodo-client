<script lang="ts">
	import { goto } from '$app/navigation';
	import { AlertBox, Button, Heading } from '#lib/components/ui/index.ts';
	import { LegalLinks } from '#lib/components/features/legal/index.ts';
	import {
		AlertTriangleIcon,
		EyeIcon,
		EyeOffIcon,
		LockIcon,
		UserIcon
	} from '#lib/icons/outline/index.ts';
	import { errorService } from '#lib/services/index.ts';
	import { authStore, currentRole } from '#lib/stores/index.ts';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { asset, match, resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		canAccessRoute,
		getHomeRoute,
		isSafeRedirect,
		isSignInReason,
		SIGN_IN_REASON_MESSAGES,
		SIGN_IN_REASON_PARAM,
		validateSchema
	} from '#lib/utils/index.ts';
	import { signInSchema } from '#lib/zod/auth.schema.ts';

	let username = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	// Aviso de por qué se llegó aquí (sesión expirada o página protegida); solo motivos conocidos
	const reason = $derived.by(() => {
		const value = page.url.searchParams.get(SIGN_IN_REASON_PARAM);
		return isSignInReason(value) ? value : null;
	});

	// Vuelve a la página pedida antes del login solo si es interna y el rol puede abrirla;
	// si no, a la página de inicio del rol
	async function getRedirectAfterLogin(): Promise<string | null> {
		const role = $currentRole;
		if (!role) return null;

		const redirectTo = page.url.searchParams.get('redirectTo');
		if (isSafeRedirect(redirectTo)) {
			const target = await match(redirectTo);
			if (target && canAccessRoute(role, target.id)) return redirectTo;
		}
		return resolve(getHomeRoute(role));
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';

		const result = validateSchema(signInSchema, { username: username.trim(), password });
		if (!result.success) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};

		isLoading = true;
		try {
			await authStore.login({ username: result.data.username, password: result.data.password });
			const destination = await getRedirectAfterLogin();
			if (!destination) {
				// Rol que el frontend no conoce: sin páginas a las que entrar
				authStore.logout();
				formError = 'Tu usuario no tiene acceso a esta aplicación.';
				return;
			}
			// destination ya viene resuelto (resolve() o una URL interna validada con isSafeRedirect)
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			await goto(destination, { replaceState: true });
		} catch (error) {
			formError = errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}

	const togglePassword = (): void => {
		showPassword = !showPassword;
	};
</script>

<MainLayout
	title="Iniciar sesión"
	class="container mx-auto flex min-h-dvh items-center justify-center bg-light-one dark:bg-dark-one"
>
	<section class="flex w-full justify-center px-4">
		<form
			onsubmit={handleSubmit}
			novalidate
			class="relative w-full max-w-md self-start rounded-3xl bg-light-one p-6 md:self-auto md:p-8 md:shadow-2xl md:ring-1 md:ring-light-four dark:bg-dark-one md:dark:ring-dark-four"
		>
			<img
				src={asset('images/logo_app.webp')}
				alt="Logo de la aplicación"
				width="96"
				height="96"
				class="mx-auto mb-4 size-20 rounded-2xl object-cover shadow-lg ring-1 ring-light-four md:mb-6 md:size-24 dark:ring-dark-four"
			/>
			<Heading level="h4" class="text-center text-light-two dark:text-dark-two"
				>Iniciar sesión</Heading
			>
			{#if reason && !formError}
				<AlertBox variant="warning" class="mt-6">{SIGN_IN_REASON_MESSAGES[reason]}</AlertBox>
			{/if}
			{#if formError}
				<div
					role="alert"
					class="mt-6 flex items-start gap-2.5 rounded-xl border border-light-error bg-light-error/10 p-3 text-sm text-light-error dark:border-dark-error dark:bg-dark-error/10 dark:text-dark-error"
				>
					<AlertTriangleIcon class="mt-0.5 size-5 shrink-0" />
					<span>{formError}</span>
				</div>
			{/if}

			<div class="mt-6 space-y-5">
				<div class="space-y-1">
					<label for="ci" class="text-sm font-medium text-light-two dark:text-dark-two"
						>Usuario</label
					>
					<div class="relative">
						<span class="absolute top-3 left-0 text-light-four dark:text-dark-four"
							><UserIcon /></span
						>
						<input
							id="ci"
							type="text"
							bind:value={username}
							placeholder="Ingresa tu usuario"
							aria-invalid={!!fieldErrors.ci}
							aria-describedby={fieldErrors.ci ? 'ci-error' : undefined}
							class={[
								'w-full border-t-0 border-r-0 border-b border-l-0 bg-transparent py-3 pl-8 text-light-two placeholder-light-four outline-0 transition-colors duration-200 outline-none focus:ring-0 focus:outline-0 dark:text-dark-two dark:placeholder-dark-four',
								fieldErrors.ci
									? 'border-light-error dark:border-dark-error'
									: 'border-light-four_d focus:border-b-light-three dark:focus:border-b-dark-three'
							]}
							disabled={isLoading}
							required
						/>
					</div>
					{#if fieldErrors.ci}
						<p id="ci-error" class="text-xs text-light-error dark:text-dark-error">
							{fieldErrors.ci}
						</p>
					{/if}
				</div>

				<div class="space-y-1">
					<label for="password" class="text-sm font-medium text-light-two dark:text-dark-two"
						>Contraseña</label
					>
					<div class="relative">
						<span class="absolute top-3 left-0 text-light-four dark:text-dark-four"
							><LockIcon /></span
						>
						<input
							id="password"
							type={showPassword ? 'text' : 'password'}
							bind:value={password}
							placeholder="Ingresa tu contraseña"
							aria-invalid={!!fieldErrors.password}
							aria-describedby={fieldErrors.password ? 'password-error' : undefined}
							class={[
								'w-full border-t-0 border-r-0 border-b border-l-0 bg-transparent py-3 pr-12 pl-8 text-light-two placeholder-light-four transition-colors duration-200 outline-none focus:ring-0 focus:outline-0 dark:text-dark-two dark:placeholder-dark-four',
								fieldErrors.password
									? 'border-light-error dark:border-dark-error'
									: 'border-light-four focus:border-b-light-four_d'
							]}
							disabled={isLoading}
							required
						/>
						<button
							type="button"
							onclick={togglePassword}
							class="absolute top-3 right-0 text-light-three transition-colors hover:text-light-three_d dark:text-dark-three dark:hover:text-dark-three_d"
							disabled={isLoading}
						>
							{#if showPassword}
								<EyeIcon />
							{:else}
								<EyeOffIcon />
							{/if}
						</button>
					</div>
					{#if fieldErrors.password}
						<p id="password-error" class="text-xs text-light-error dark:text-dark-error">
							{fieldErrors.password}
						</p>
					{/if}
					<div class="pt-2 text-right">
						<a
							href={resolve('/auth/forgot-password')}
							class="text-xs text-light-two_d transition-colors hover:text-light-two_d dark:text-dark-two_d dark:hover:text-dark-two_d"
						>
							Olvidé mi contraseña
						</a>
					</div>
				</div>
			</div>

			<Button type="submit" variant="primary" size="lg" fullWidth loading={isLoading} class="mt-8">
				Ingresar
			</Button>

			<LegalLinks class="mt-6" />
		</form>
	</section>
</MainLayout>
