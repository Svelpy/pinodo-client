import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tienda } from '#lib/interfaces/index.ts';

const { service } = vi.hoisted(() => ({
	service: {
		get: vi.fn(),
		getCached: vi.fn(),
		setCached: vi.fn(),
		clearCached: vi.fn()
	}
}));

vi.mock('#lib/services/index.ts', () => ({ tiendaService: service }));

import { currentTiendaStore, tiendaStore } from './tienda.store';

const tienda = { nombre_tienda: 'Tienda Moda' } as Tienda;

describe('tiendaStore', () => {
	beforeEach(() => {
		tiendaStore.clear();
		vi.clearAllMocks();
		service.get.mockResolvedValue(tienda);
	});

	it('ensure pide la tienda a la API y la guarda cuando no está en el store', async () => {
		await expect(tiendaStore.ensure()).resolves.toEqual(tienda);
		expect(get(currentTiendaStore)).toEqual(tienda);
		expect(service.setCached).toHaveBeenCalledWith(tienda);
	});

	it('ensure no vuelve a pedirla si ya está cargada', async () => {
		tiendaStore.set(tienda);
		await tiendaStore.ensure();
		expect(service.get).not.toHaveBeenCalled();
	});

	it('las cargas simultáneas comparten una sola petición', async () => {
		await Promise.all([tiendaStore.refresh(), tiendaStore.ensure()]);
		expect(service.get).toHaveBeenCalledTimes(1);
	});

	it('si la API falla devuelve null sin lanzar y deja el store vacío', async () => {
		service.get.mockRejectedValue(new Error('network'));
		await expect(tiendaStore.ensure()).resolves.toBeNull();
		expect(get(currentTiendaStore)).toBeNull();
	});

	it('una respuesta que llega después de limpiar no repuebla el store', async () => {
		const pending = tiendaStore.refresh();
		tiendaStore.clear();
		await pending;
		expect(get(currentTiendaStore)).toBeNull();
		expect(service.setCached).not.toHaveBeenCalled();
	});

	it('clear borra el store y lo guardado en localStorage', () => {
		tiendaStore.set(tienda);
		tiendaStore.clear();
		expect(get(currentTiendaStore)).toBeNull();
		expect(service.clearCached).toHaveBeenCalled();
	});
});
