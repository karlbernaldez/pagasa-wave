import { pipeline } from '@xenova/transformers';

let extractorPromise;

const getExtractor = async () => {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5');
  }
  return extractorPromise;
};

export const embedText = async (text) => {
  const input = String(text || '').trim();
  if (!input) return [];

  const extractor = await getExtractor();
  const output = await extractor(input, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data || []);
};

export const cosineSimilarity = (a = [], b = []) => {
  if (!a.length || !b.length) return 0;

  const len = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (!magA || !magB) return 0;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};
