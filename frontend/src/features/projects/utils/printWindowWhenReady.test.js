import { describe, expect, it, vi } from 'vitest';

import { printWindowWhenReady } from './printWindowWhenReady';

function createPrintWindow({ images = [], fontsReady = Promise.resolve() } = {}) {
  const frameCallbacks = [];
  return {
    closed: false,
    document: {
      images,
      fonts: { ready: fontsReady },
    },
    requestAnimationFrame: vi.fn((callback) => {
      frameCallbacks.push(callback);
      callback();
      return frameCallbacks.length;
    }),
    focus: vi.fn(),
    print: vi.fn(),
  };
}

describe('printWindowWhenReady', () => {
  it('waits for image decode, fonts, and two paint frames before printing', async () => {
    const decode = vi.fn().mockResolvedValue();
    const image = { complete: true, decode };
    const printWindow = createPrintWindow({ images: [image] });

    await printWindowWhenReady(printWindow);

    expect(decode).toHaveBeenCalledTimes(1);
    expect(printWindow.requestAnimationFrame).toHaveBeenCalledTimes(2);
    expect(printWindow.focus).toHaveBeenCalledTimes(1);
    expect(printWindow.print).toHaveBeenCalledTimes(1);
  });

  it('waits for a pending image load before decoding and printing', async () => {
    let loadHandler;
    const image = {
      complete: false,
      decode: vi.fn().mockResolvedValue(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'load') loadHandler = handler;
      }),
    };
    const printWindow = createPrintWindow({ images: [image] });

    const ready = printWindowWhenReady(printWindow);
    expect(printWindow.print).not.toHaveBeenCalled();

    loadHandler();
    await ready;

    expect(image.decode).toHaveBeenCalledTimes(1);
    expect(printWindow.print).toHaveBeenCalledTimes(1);
  });

  it('continues printing when image decode rejects', async () => {
    const image = {
      complete: true,
      decode: vi.fn().mockRejectedValue(new Error('decode failed')),
    };
    const printWindow = createPrintWindow({ images: [image] });

    await expect(printWindowWhenReady(printWindow)).resolves.toBeUndefined();
    expect(printWindow.print).toHaveBeenCalledTimes(1);
  });

  it('fails if the print window is already closed', async () => {
    const printWindow = createPrintWindow();
    printWindow.closed = true;

    await expect(printWindowWhenReady(printWindow)).rejects.toThrow(
      'The PDF print window is no longer available.'
    );
    expect(printWindow.print).not.toHaveBeenCalled();
  });
});
