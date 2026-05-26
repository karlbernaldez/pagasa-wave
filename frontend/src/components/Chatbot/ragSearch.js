import RAW_DOCS from './docs';

const TOP_K = 6;
const MAX_CHUNK_CHARS = 1800;

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','need',
  'how','what','when','where','who','which','why','this','that','these','those',
  'it','its','i','you','we','they','he','she','my','your','our','their',
]);

const SYNONYMS = {
  submit: ['submitted', 'submission', 'review'],
  revise: ['revision', 'revision requested', 'needs revision'],
  edit: ['modify', 'change', 'update'],
  project: ['forecast project', 'chart project'],
  review: ['approval', 'admin review'],
  studio: ['workspace', 'editor'],
  map: ['studio', 'workspace'],
  publish: ['published', 'finalized'],
  locked: ['read only', 'readonly', 'restricted'],
  chatbot: ['assistant', 'help bot'],
  wavelab: ['marine forecast platform', 'forecast workflow', 'forecast operations'],
};

let _chunks = null;
let _idf = null;

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

const expandQueryTerms = (terms) => {
  const expanded = new Set(terms);
  for (const term of terms) {
    if (SYNONYMS[term]) {
      tokenize(SYNONYMS[term].join(' ')).forEach((t) => expanded.add(t));
    }
  }
  return [...expanded];
};

const buildChunks = () => {
  if (_chunks) return _chunks;

  const lines = RAW_DOCS.split('\n');
  const chunks = [];
  let currentTitle = 'Introduction';
  let currentLines = [];
  let source = 'general';

  const flush = () => {
    const text = currentLines.join('\n').trim();
    if (text.length > 60) {
      chunks.push({
        title: currentTitle,
        source,
        text: text.length > MAX_CHUNK_CHARS ? text.slice(0, MAX_CHUNK_CHARS) + '…' : text,
      });
    }
  };

  for (const line of lines) {
    if (line.startsWith('# Source:')) source = line.toLowerCase();

    if (/^#{1,4}\s+.+$/.test(line)) {
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

const fuzzyMatch = (term, candidate) => {
  if (candidate.includes(term)) return true;
  if (term.length >= 5 && candidate.startsWith(term.slice(0, 4))) return true;
  return false;
};

const scoreChunk = (chunk, queryTerms, idf, rawQuery) => {
  const chunkTerms = tokenize(chunk.text + ' ' + chunk.title);
  let score = 0;

  for (const qt of queryTerms) {
    for (const ct of chunkTerms) {
      if (fuzzyMatch(qt, ct)) score += idf[qt] || 1;
    }

    if (chunk.title.toLowerCase().includes(qt)) score += 3;
  }

  if (chunk.source.includes('faq')) score += 2;
  if (chunk.source.includes('glossary')) score += 2;
  if (chunk.source.includes('troubleshooting')) score += 2;

  if (rawQuery.includes('wavelab')) {
    if (chunk.source.includes('identity')) score += 50;
    if (chunk.source.includes('overview')) score += 25;
  }

  return score;
};

export const retrieve = (query, k = TOP_K) => {
  const chunks = buildChunks();
  if (!_idf) _idf = buildIDF(chunks);

  const rawQuery = query.toLowerCase();
  const queryTerms = expandQueryTerms(tokenize(query));

  const scored = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTerms, _idf, rawQuery) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored
    .map(({ chunk }) => `### ${chunk.title}\n${chunk.text}`)
    .join('\n\n---\n\n');
};

export const getChunkCount = () => buildChunks().length;
