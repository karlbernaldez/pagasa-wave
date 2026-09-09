import { describe, expect, it, vi } from 'vitest';

import { loadImage } from './imageLoader';

describe('loadImage', () => {
  it('registers an image name immediately so persisted symbol layers can restore safely', async () => {
    const images = new Map();
    let loadCallback;

    const map = {
      hasImage: vi.fn((name) => images.has(name)),
      addImage: vi.fn((name, image) => images.set(name, image)),
      updateImage: vi.fn((name, image) => images.set(name, image)),
      loadImage: vi.fn((_path, callback) => {
        loadCallback = callback;
      }),
    };

    const promise = loadImage(map, 'less_1', '/L1.png');

    expect(map.addImage).toHaveBeenCalledTimes(1);
    expect(map.hasImage('less_1')).toBe(true);

    const loadedImage = { width: 16, height: 16, data: new Uint8Array(16 * 16 * 4) };
    loadCallback(null, loadedImage);

    await expect(promise).resolves.toBe(true);
    expect(map.updateImage).toHaveBeenCalledWith('less_1', loadedImage);
  });

  it('does not reload an image that is already registered', async () => {
    const map = {
      hasImage: vi.fn(() => true),
      addImage: vi.fn(),
      updateImage: vi.fn(),
      loadImage: vi.fn(),
    };

    await expect(loadImage(map, 'typhoon', '/hurricane.png')).resolves.toBe(true);

    expect(map.loadImage).not.toHaveBeenCalled();
    expect(map.addImage).not.toHaveBeenCalled();
  });
});
