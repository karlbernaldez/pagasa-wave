import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema({
  tier: { type: String, enum: ['public', 'forecaster', 'admin'], required: true, index: true },
  source: { type: String, required: true, index: true },
  content: { type: String, required: true },
  embedding: { type: [Number], default: [] },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
