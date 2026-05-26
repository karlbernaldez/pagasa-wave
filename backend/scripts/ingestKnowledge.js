import fs from 'fs';
import path from 'path';
import connectDB from '../config/db.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { chunkText } from '../chat/services/chunkService.js';
import { embedText } from '../chat/services/embeddingService.js';
const tiers = ['public', 'forecaster', 'admin'];
const baseDir = path.resolve('backend/knowledge');
const ingest = async () => {
  await connectDB();
  for (const tier of tiers) {
    const dir = path.join(baseDir, tier);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const chunks = chunkText(content);
      for (const chunk of chunks) {
        const embedding = await embedText(chunk);
        await KnowledgeChunk.updateOne(
          { tier, source: file, content: chunk },
          { $set: { embedding, metadata: { sourceType: 'file' } } },
          { upsert: true }
        );
      }
    }
  }
  console.log('Knowledge ingestion complete');
  process.exit(0);
};
ingest();
