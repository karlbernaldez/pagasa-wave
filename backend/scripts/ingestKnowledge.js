import fs from 'fs';
import path from 'path';
import { chunkText } from '../chat/services/chunkService.js';
import { embedText } from '../chat/services/embeddingService.js';
import { KNOWLEDGE_STORE } from '../chat/services/knowledgeStore.js';
const tiers = ['public', 'forecaster', 'admin'];
const baseDir = path.resolve('backend/knowledge');
const ingest = async () => {
  for (const tier of tiers) {
    const dir = path.join(baseDir, tier);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const chunks = chunkText(content);
      for (const chunk of chunks) {
        KNOWLEDGE_STORE.push({ tier, source: file, content: chunk, embedding: await embedText(chunk) });
      }
    }
  }
  console.log(`Ingested ${KNOWLEDGE_STORE.length} chunks`);
};
ingest();
