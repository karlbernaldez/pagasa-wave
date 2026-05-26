export const chunkText = (text, chunkSize = 400) => {
  const clean = String(text || '').trim();
  const chunks = [];
  for (let i = 0; i < clean.length; i += chunkSize) {
    chunks.push(clean.slice(i, i + chunkSize));
  }
  return chunks;
};
