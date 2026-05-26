const tokenize = (text) => String(text || '').toLowerCase().split(/\W+/).filter(Boolean);
const hashToken = (token) => token.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 128;
export const embedText = async (text) => {
  const vector = new Array(128).fill(0);
  tokenize(text).forEach((token) => { vector[hashToken(token)] += 1; });
  return vector;
};
export const cosineSimilarity = (a = [], b = []) => {
  const len = Math.max(a.length, b.length);
  let dot = 0; let magA = 0; let magB = 0;
  for (let i = 0; i < len; i += 1) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};
