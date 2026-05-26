const markdownModules = import.meta.glob('../../../docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const staticFallback = `# WaveLab\nWaveLab is a marine forecast operations platform.`;

const docsCorpus = Object.entries(markdownModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, content]) => `# Source: ${path}\n${content}`)
  .join('\n\n');

export default docsCorpus || staticFallback;
