import RAW_DOCS from './docs';

// ─── Config ───────────────────────────────────────────────────────────────────

const TOP_K = 4;          // number of chunks to retrieve per query
const MAX_CHUNK_CHARS = 1500; // trim chunks longer than this

// Common words to ignore during scoring
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','need',
  'how','what','when','where','who','which','why','this','that','these','those',
  'it','its','i','you','we','they','he','she','my','your','our','their',
  'not','no','yes','if','then','so','as','by','from','about','into','through',
]);

// ─── Chunker ──────────────────────────────────────────────────────────────────

let _chunks = null;

const buildChunks = () => {
  if (_chunks) return _chunks;

  // Split on any markdown heading line
  const headingRegex = /^#{1,4}\s+.+$/m;
  const lines = RAW_DOCS.split('\n');

  const chunks = [];
  let currentTitle = 'Introduction';
  let currentLines = [];

  const flush = () => {
    const text = currentLines.join('\n').trim();
    if (text.length > 60) { // skip tiny/empty chunks
      chunks.push({
        title: currentTitle,
        text: text.length > MAX_CHUNK_CHARS ? text.slice(0, MAX_CHUNK_CHARS) + '…' : text,
      });
    }
  };

  for (const line of lines) {
    if (headingRegex.test(line)) {
      flush();
      // Clean markdown syntax from the title
      currentTitle = line.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '').replace(/\{.*?\}/g, '').trim();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }
  flush(); // last chunk

  _chunks = chunks;
  return chunks;
};

// ─── TF-IDF Scorer ────────────────────────────────────────────────────────────

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

const buildIDF = (chunks) => {
  const docFreq = {};
  for (const chunk of chunks) {
    const terms = new Set(tokenize(chunk.text + ' ' + chunk.title));
    for (const term of terms) {
      docFreq[term] = (docFreq[term] || 0) + 1;
    }
  }
  const N = chunks.length;
  const idf = {};
  for (const [term, df] of Object.entries(docFreq)) {
    idf[term] = Math.log((N + 1) / (df + 1)) + 1;
  }
  return idf;
};

let _idf = null;

const scoreChunk = (chunk, queryTerms, idf) => {
  const chunkTerms = tokenize(chunk.text + ' ' + chunk.title);
  const termFreq = {};
  for (const t of chunkTerms) termFreq[t] = (termFreq[t] || 0) + 1;

  let score = 0;
  for (const qt of queryTerms) {
    if (termFreq[qt]) {
      const tf = termFreq[qt] / chunkTerms.length;
      const idfVal = idf[qt] || 1;
      score += tf * idfVal;
      // Bonus: exact match in title
      if (chunk.title.toLowerCase().includes(qt)) score += idfVal * 0.5;
    }
  }
  return score;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * retrieve(query, k?) → string
 * Returns the top-k most relevant doc chunks joined as a string.
 * Pass this as the context in your system prompt instead of the full docs.
 */
export const retrieve = (query, k = TOP_K) => {
  const chunks = buildChunks();

  if (!_idf) _idf = buildIDF(chunks);

  const queryTerms = tokenize(query);

  if (queryTerms.length === 0) {
    // No meaningful terms — return the first few chunks as a fallback
    return chunks.slice(0, k).map((c) => `### ${c.title}\n${c.text}`).join('\n\n---\n\n');
  }

  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTerms, _idf) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored
    .map(({ chunk }) => `### ${chunk.title}\n${chunk.text}`)
    .join('\n\n---\n\n');
};

/**
 * getChunkCount() → number
 * Useful for debugging — shows how many chunks your docs were split into.
 */
export const getChunkCount = () => buildChunks().length;