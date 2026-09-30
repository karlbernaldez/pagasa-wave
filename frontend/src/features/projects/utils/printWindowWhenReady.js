const waitForFrame = (printWindow) =>
  new Promise((resolve) => {
    if (typeof printWindow?.requestAnimationFrame === 'function') {
      printWindow.requestAnimationFrame(() => resolve());
      return;
    }
    printWindow?.setTimeout?.(resolve, 0) ?? resolve();
  });

const waitForImage = async (image) => {
  if (!image) return;

  if (!image.complete) {
    await new Promise((resolve) => {
      const finish = () => resolve();
      image.addEventListener?.('load', finish, { once: true });
      image.addEventListener?.('error', finish, { once: true });
    });
  }

  if (typeof image.decode === 'function') {
    try {
      await image.decode();
    } catch {
      // Printing should still proceed when a non-critical image cannot be decoded.
    }
  }
};

export async function printWindowWhenReady(printWindow) {
  if (!printWindow || printWindow.closed) {
    throw new Error('The PDF print window is no longer available.');
  }

  const document = printWindow.document;
  const images = Array.from(document?.images || []);

  await Promise.all(images.map(waitForImage));

  try {
    await document?.fonts?.ready;
  } catch {
    // Font readiness is best-effort; browser fallback fonts remain printable.
  }

  await waitForFrame(printWindow);
  await waitForFrame(printWindow);

  if (printWindow.closed) {
    throw new Error('The PDF print window was closed before printing.');
  }

  printWindow.focus?.();
  printWindow.print?.();
}
