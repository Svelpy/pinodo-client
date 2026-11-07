import { goto } from '$app/navigation';
import type { ResolvedPathname } from '$app/types';

/** Recibe una ruta ya resuelta: redirect(resolve('/app')) */
export const redirect = (url: ResolvedPathname, replaceState: boolean = false): void => {
	// url ya viene resuelta (ResolvedPathname), que es lo que la regla exige
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	goto(url, { replaceState });
};
