import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { imagenService } from './imagen.service';

describe('imagenService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('upload envía el archivo como multipart en el campo `file`', async () => {
		api.post.mockResolvedValue({ url: 'https://cdn.test/a.jpg' });
		const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });

		const result = await imagenService.upload(file);

		expect(result).toEqual({ url: 'https://cdn.test/a.jpg' });
		const [endpoint, body, options] = api.post.mock.calls[0];
		expect(endpoint).toBe('/imagenes/uploads');
		expect(body).toBeInstanceOf(FormData);
		expect((body as FormData).get('file')).toBe(file);
		expect(options).toEqual({ requireAuth: true });
	});
});
