import { PUBLIC_CORPUS } from '../corpora/publicCorpus.js';
import { FORECASTER_CORPUS } from '../corpora/forecasterCorpus.js';
import { ADMIN_CORPUS } from '../corpora/adminCorpus.js';
const CORPUS_MAP = { public: PUBLIC_CORPUS, forecaster: FORECASTER_CORPUS, admin: ADMIN_CORPUS };
const tokenize = (text) => String(text || '').toLowerCase().split(/\W+/).filter(Boolean);
export const retrieveContext = async (query, policy) => {
const corpora = policy?.corpora || ['public'];
const docs = corpora.flatMap((name) => CORPUS_MAP[name] || []);
const queryTokens = tokenize(query);
const ranked = docs.map((doc) => {
const docTokens = tokenize(doc.content);
const score = queryTokens.reduce((sum, token) => sum + (docTokens.includes(token) ? 1 : 0), 0);
return { ...doc, score };
}).filter((doc) => doc.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
return { corpora, context: ranked.map((doc) => doc.content).join('\n'), sources: ranked.map((doc) => doc.id) };
};
