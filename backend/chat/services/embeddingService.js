const tokenize = (text) => String(text || '').toLowerCase().split(/\W+/).filter(Boolean);
export const embedText = async (text) => {
  const tokens = tokenize(text);
  const vector = new Map();
  tokens.forEach((token) => vector.set(token, (vector.get(token) || 0) + 1));
  return vector;
};
export const cosineSimilarity = (a, b) => {
  const keys = new Set([...a.keys(), ...b.keys()]);
  let dot = 0; let magA = 0; let magB = 0;
  keys.forEach((key) => {
    const av = a.get(key) || 0;
    const bv = b.get(key) || 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  });
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};
