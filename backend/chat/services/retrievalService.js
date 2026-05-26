import { PUBLIC_CORPUS } from '../corpora/publicCorpus.js';
import { FORECASTER_CORPUS } from '../corpora/forecasterCorpus.js';
import { ADMIN_CORPUS } from '../corpora/adminCorpus.js';

const CORPUS_MAP = {
  public: PUBLIC_CORPUS,
  forecaster: FORECASTER_CORPUS,
  admin: ADMIN_CORPUS,
};

export const retrieveContext = async (query, policy) => {
  const corpora = policy?.corpora || ['public'];
  const accessibleDocs = corpora.flatMap((name) => CORPUS_MAP[name] || []);
  const lowered = String(query || '').toLowerCase();
  const matches = accessibleDocs.filter((doc) => lowered && doc?.content?.toLowerCase().includes(lowered)).slice(0, 3);
  const context = matches.map((doc) => doc.content).join('\n');
  return { corpora, context };
};
