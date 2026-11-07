// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/** Evento con el que Chrome/Edge/Samsung Internet permiten abrir su diálogo de instalación */
	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	}

	interface WindowEventMap {
		beforeinstallprompt: BeforeInstallPromptEvent;
	}

	interface Window {
		/** Guardado en `app.html` si el navegador lo emite antes de que cargue la app */
		__installPrompt?: BeforeInstallPromptEvent;
	}

	interface Navigator {
		/** Solo Safari en iOS: `true` si la página se abrió desde la pantalla de inicio */
		standalone?: boolean;
	}
}

export {};
