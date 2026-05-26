import KnowledgeChunk from '../../models/KnowledgeChunk.js';
import { embedText, cosineSimilarity } from './embeddingService.js';

const ACCESS = {
  public: ['public'],
  forecaster: ['public', 'forecaster'],
  admin: ['public', 'forecaster', 'admin'],
};

const normalizeContent = (text = '') =>
  text.replace(/\s+/g, ' ').trim().toLowerCase();

export const retrieveContext = async (query, policy) => {
  const corpora = policy?.corpora || ['public'];
  const allowed = [...new Set(corpora.flatMap((tier) => ACCESS[tier] || [tier]))];

  const queryEmbedding = await embedText(query);
  const docs = await KnowledgeChunk.find({ tier: { $in: allowed } }).lean();

  const ranked = docs
    .map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }))
    .filter((doc) => doc.score > 0)
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

    if (deduped.length >= 3) break;
  }

  return {
    corpora,
    context: deduped.map((doc) => doc.content).join('\n\n'),
    sources: deduped.map((doc) => doc.source).filter(Boolean),
  };
};
