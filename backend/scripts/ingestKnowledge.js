import fs from 'fs';
import path from 'path';
import connectDB from '../config/db.js';
import KnowledgeChunk from '../models/KnowledgeChunk.js';
import { chunkText } from '../chat/services/chunkService.js';
import { embedText } from '../chat/services/embeddingService.js';

const tiers = ['public', 'forecaster', 'admin'];
const baseDir = path.resolve('knowledge');

const ingest = async () => {
  await connectDB();

  console.log('Clearing stale knowledge corpus...');
  await KnowledgeChunk.deleteMany({});

  let totalChunks = 0;

  for (const tier of tiers) {
    const dir = path.join(baseDir, tier);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      console.log(`Ingesting ${tier}/${file}`);

      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const chunks = chunkText(content);

      for (const chunk of chunks) {
        const embedding = await embedText(chunk);

        await KnowledgeChunk.create({
          tier,
          source: file,
          content: chunk,
          embedding,
          metadata: {
            sourceType: 'file',
          },
        });

        totalChunks++;
      }
    }
  }

  console.log(`Knowledge ingestion complete: ${totalChunks} chunks`);
  process.exit(0);
};

ingest();