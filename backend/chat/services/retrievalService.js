export const retrieveContext = async (_query, policy) => {
  const corpora = policy?.corpora || ['public'];
  return { corpora, context: '' };
};
