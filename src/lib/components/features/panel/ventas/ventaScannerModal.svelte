<script lang="ts" module>
	// BarcodeDetector aún no está en los tipos del DOM de TypeScript
	interface DetectedBarcode {
		rawValue: string;
	}
	interface BarcodeDetectorInstance {
		detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
	}
	interface BarcodeDetectorConstructor {
		new (options?: { formats?: string[] }): BarcodeDetectorInstance;
		getSupportedFormats?: () => Promise<string[]>;
	}

	function getDetector(): BarcodeDetectorConstructor | null {
		const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
		return ctor ?? null;
	}

	/** true si el navegador puede leer códigos con la cámara (Chrome/Android, Edge…) */
	export function soportaEscaneoCamara(): boolean {
		return (
			typeof navigator !== 'undefined' &&
			!!navigator.mediaDevices?.getUserMedia &&
			getDetector() !== null
		);
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, Sheet } from '#lib/components/ui/index.ts';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		/** Código leído; el modal se cierra solo */
		onDetected: (codigo: string) => void;
	}

	let { isOpen, onClose, onDetected }: Props = $props();

	const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'];

	let video = $state<HTMLVideoElement>();
	let error = $state('');
	let iniciando = $state(false);

	$effect(() => {
		if (!isOpen || !video) return;
		const element = video;
		let stream: MediaStream | null = null;
		let frame = 0;
		let activo = true;

		untrack(() => {
			error = '';
			iniciando = true;
		});

		(async () => {
			const Detector = getDetector();
			if (!Detector) {
				error =
					'Este navegador no puede leer códigos con la cámara. Usa el lector o escribe el código.';
				iniciando = false;
				return;
			}
			try {
				const soportados = (await Detector.getSupportedFormats?.()) ?? FORMATOS;
				const detector = new Detector({
					formats: FORMATOS.filter((formato) => soportados.includes(formato))
				});
				stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: 'environment' } },
					audio: false
				});
				if (!activo) return;
				element.srcObject = stream;
				await element.play();
				iniciando = false;

				const leer = async () => {
					if (!activo) return;
					try {
						if (element.readyState >= 2) {
							const [codigo] = await detector.detect(element);
							if (codigo?.rawValue && activo) {
								activo = false;
								navigator.vibrate?.(80);
								onDetected(codigo.rawValue.trim());
								return;
							}
						}
					} catch {
						// Un fotograma que no se pudo analizar: se intenta con el siguiente
					}
					frame = requestAnimationFrame(leer);
				};
				frame = requestAnimationFrame(leer);
			} catch (cause) {
				iniciando = false;
				const name = cause instanceof DOMException ? cause.name : '';
				error =
					name === 'NotAllowedError'
						? 'No se dio permiso para usar la cámara. Habilítalo en la configuración del navegador.'
						: name === 'NotFoundError'
							? 'No se encontró ninguna cámara en este dispositivo.'
							: 'No se pudo abrir la cámara.';
			}
		})();

		// Al cerrar se libera la cámara (se apaga su luz)
		return () => {
			activo = false;
			cancelAnimationFrame(frame);
			stream?.getTracks().forEach((track) => track.stop());
			element.srcObject = null;
		};
	});
</script>

<Sheet
	open={isOpen}
	title="Escanear código"
	description="Apunta la cámara al código de barras de la etiqueta."
	{onClose}
>
	{#if error}
		<AlertBox>{error}</AlertBox>
	{/if}
	<div class="relative aspect-4/3 w-full overflow-hidden bg-light-black">
		<video bind:this={video} class="size-full object-cover" playsinline muted></video>
		{#if !error}
			<!-- Guía de encuadre -->
			<div
				class="pointer-events-none absolute inset-x-[12%] top-1/2 h-1/3 -translate-y-1/2 border-2 border-light-one/80"
				aria-hidden="true"
			>
				<div class="absolute inset-x-0 top-1/2 h-0.5 animate-pulse bg-light-error"></div>
			</div>
		{/if}
		{#if iniciando}
			<p class="absolute inset-0 flex items-center justify-center text-sm text-light-one">
				Abriendo la cámara…
			</p>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="outline" fullWidth onclick={onClose}>Cancelar</Button>
	{/snippet}
</Sheet>
