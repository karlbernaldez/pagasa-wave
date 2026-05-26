import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

export const embedText = async (text) => {
  const input = String(text || '').trim();
  if (!input) return [];

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await client.embeddings.create({
    model: MODEL,
    input,
  });

  return response.data?.[0]?.embedding || [];
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
