import KnowledgeChunk from '../../models/KnowledgeChunk.js';
import { embedText, cosineSimilarity } from './embeddingService.js';

const ACCESS = {
  public: ['public'],
  forecaster: ['public', 'forecaster'],
  admin: ['public', 'forecaster', 'admin'],
};

const SCORE_THRESHOLDS = {
  public: 0.15,
  forecaster: 0.12,
  admin: 0.10,
};

const normalizeContent = (text = '') => text.replace(/\s+/g, ' ').trim().toLowerCase();

const lexicalBoost = (query = '', content = '') => {
  const q = normalizeContent(query);
  const c = normalizeContent(content);
  if (!q || !c) return 0;
  if (c.includes(q)) return 0.12;
  const terms = q.split(' ').filter((term) => term.length > 3);
  const matches = terms.filter((term) => c.includes(term)).length;
  return Math.min(0.12, matches * 0.04);
};

export const retrieveContext = async (query, policy) => {
  const corpora = policy?.corpora || ['public'];
  const allowed = [...new Set(corpora.flatMap((tier) => ACCESS[tier] || [tier]))];
  const threshold = SCORE_THRESHOLDS[policy?.tier] ?? 0.15;
  const queryEmbedding = await embedText(query);
  const docs = await KnowledgeChunk.find({ tier: { $in: allowed } }).lean();

  const ranked = docs
    .map((doc) => {
      const semantic = cosineSimilarity(queryEmbedding, doc.embedding);
      const lexical = lexicalBoost(query, doc.content);
      return { ...doc, score: semantic + lexical };
    })
    .filter((doc) => doc.score >= threshold)
    .sort((a, b) => b.score - a.score);

  const seenContent = new Set();
  const seenSources = new Set();
  const deduped = [];

  for (const doc of ranked) {
    const normalized = normalizeContent(doc.content);
    const sourceKey = doc.source || '';
    if (seenContent.has(normalized)) continue;
    if (sourceKey && seenSources.has(sourceKey)) continue;
    seenContent.add(normalized);
    if (sourceKey) seenSources.add(sourceKey);
    deduped.push(doc);
    if (deduped.length >= 4) break;
  }

  return {
    corpora,
    threshold,
    hasContext: deduped.length > 0,
    context: deduped.map((doc) => doc.content).join('\n\n'),
    sources: deduped.map((doc) => doc.source).filter(Boolean),
  };
};
