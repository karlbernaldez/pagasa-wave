import { describe, expect, it, vi } from 'vitest';

import { loadImage } from './imageLoader';

describe('loadImage', () => {
  it('waits for the real image before marking it loaded', async () => {
    const images = new Map();
    let loadCallback;

    const map = {
      hasImage: vi.fn((name) => images.has(name)),
      addImage: vi.fn((name, image) => images.set(name, image)),
      removeImage: vi.fn((name) => images.delete(name)),
      loadImage: vi.fn((_path, callback) => {
        loadCallback = callback;
      }),
    };

    const promise = loadImage(map, 'less_1', '/L1.png');

    expect(map.loadImage).toHaveBeenCalledTimes(1);
    expect(map.addImage).not.toHaveBeenCalled();

    const loadedImage = { width: 16, height: 16, data: new Uint8Array(16 * 16 * 4) };
    loadCallback(null, loadedImage);

    await expect(promise).resolves.toBe(true);
    expect(map.addImage).toHaveBeenCalledWith('less_1', loadedImage);
    expect(map.hasImage('less_1')).toBe(true);
  });

  it('shares one in-flight request across repeated callers', async () => {
    const images = new Map();
    let loadCallback;

    const map = {
      hasImage: vi.fn((name) => images.has(name)),
      addImage: vi.fn((name, image) => images.set(name, image)),
      removeImage: vi.fn((name) => images.delete(name)),
      loadImage: vi.fn((_path, callback) => {
        loadCallback = callback;
      }),
    };

    const first = loadImage(map, 'low_pressure', '/LPA.png');
    const second = loadImage(map, 'low_pressure', '/LPA.png');

    expect(map.loadImage).toHaveBeenCalledTimes(1);

    const loadedImage = { width: 32, height: 32, data: new Uint8Array(32 * 32 * 4) };
    loadCallback(null, loadedImage);

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(map.addImage).toHaveBeenCalledTimes(1);
  });

  it('replaces a stale registered image with the real asset', async () => {
    const images = new Map([['less_1', { width: 1, height: 1 }]]);
    let loadCallback;

    const map = {
      hasImage: vi.fn((name) => images.has(name)),
      addImage: vi.fn((name, image) => images.set(name, image)),
      removeImage: vi.fn((name) => images.delete(name)),
      loadImage: vi.fn((_path, callback) => {
        loadCallback = callback;
      }),
    };

    const promise = loadImage(map, 'less_1', '/L1.png');
    const loadedImage = { width: 24, height: 24, data: new Uint8Array(24 * 24 * 4) };
    loadCallback(null, loadedImage);

    await expect(promise).resolves.toBe(true);
    expect(map.removeImage).toHaveBeenCalledWith('less_1');
    expect(map.addImage).toHaveBeenCalledWith('less_1', loadedImage);
  });
});
