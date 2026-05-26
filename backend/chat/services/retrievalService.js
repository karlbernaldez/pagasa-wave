import { KNOWLEDGE_STORE } from './knowledgeStore.js';
import { embedText, cosineSimilarity } from './embeddingService.js';
const ACCESS = { public: ['public'], forecaster: ['public', 'forecaster'], admin: ['public', 'forecaster', 'admin'] };
export const retrieveContext = async (query, policy) => {
const corpora = policy?.corpora || ['public'];
const allowed = new Set(corpora.flatMap((tier) => ACCESS[tier] || [tier]));
const queryEmbedding = await embedText(query);
const ranked = KNOWLEDGE_STORE.filter((doc) => allowed.has(doc.tier)).map((doc) => ({ ...doc, score: cosineSimilarity(queryEmbedding, doc.embedding) })).filter((doc) => doc.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
return { corpora, context: ranked.map((doc) => doc.content).join('\n'), sources: ranked.map((doc) => doc.source) };
};
