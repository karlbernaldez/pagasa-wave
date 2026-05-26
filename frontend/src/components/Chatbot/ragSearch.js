import RAW_DOCS from './docs';

const TOP_K = 5;
const MAX_CHUNK_CHARS = 1600;

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','need',
  'this','that','these','those','it','its','i','you','we','they'
]);

let _chunks = null;

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

const buildChunks = () => {
  if (_chunks) return _chunks;

  const lines = RAW_DOCS.split('\n');
  const chunks = [];
  let currentTitle = 'General';
  let currentLines = [];
  let source = 'general';

  const flush = () => {
    const text = currentLines.join('\n').trim();
    if (text.length > 80) chunks.push({ title: currentTitle, source, text });
  };

  for (const line of lines) {
    if (line.startsWith('# Source:')) source = line.toLowerCase();

    if (/^#{1,4}\s+/.test(line)) {
      flush();
      currentTitle = line.replace(/^#{1,4}\s+/, '').trim();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }

  flush();
  _chunks = chunks;
  return chunks;
};

const scoreChunk = (chunk, rawQuery, terms) => {
  const haystack = `${chunk.title} ${chunk.text}`.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (haystack.includes(term)) score += 5;
  }

  if (rawQuery.includes('what is wavelab') || rawQuery.includes('what does wavelab do')) {
    if (chunk.source.includes('identity')) score += 100;
    if (chunk.source.includes('overview')) score += 80;
  }

  if (rawQuery.includes('create project')) {
    if (chunk.source.includes('project-library')) score += 100;
  }

  if (rawQuery.includes('login') || rawQuery.includes('logged out')) {
    if (chunk.source.includes('authentication')) score += 80;
  }

  if (rawQuery.includes('error') || rawQuery.includes('issue') || rawQuery.includes('problem')) {
    if (chunk.source.includes('troubleshooting')) score += 80;
  }

  if (chunk.source.includes('faq')) score += 10;
  if (chunk.source.includes('glossary')) score += 10;

  return score;
};

export const retrieve = (query, k = TOP_K) => {
  const rawQuery = query.toLowerCase();
  const terms = tokenize(query);
  const chunks = buildChunks();

  return chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, rawQuery, terms) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ chunk }) => `### ${chunk.title}\n${chunk.text.slice(0, MAX_CHUNK_CHARS)}`)
    .join('\n\n---\n\n');
};

export const getChunkCount = () => buildChunks().length;
