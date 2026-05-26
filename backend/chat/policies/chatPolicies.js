export const CHAT_POLICIES = {
  public: {
    allowedModels: ['llama-3.1-8b-instant'],
    maxMessages: 8,
    maxMessageChars: 1000,
    maxTotalChars: 6000,
    maxTokens: 512,
    corpora: ['public'],
  },
  forecaster: {
    allowedModels: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
    maxMessages: 20,
    maxMessageChars: 4000,
    maxTotalChars: 20000,
    maxTokens: 1024,
    corpora: ['public', 'forecaster'],
  },
  admin: {
    allowedModels: ['meta-llama/llama-4-scout-17b-16e-instruct', 'groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    maxMessages: 30,
    maxMessageChars: 6000,
    maxTotalChars: 40000,
    maxTokens: 2048,
    corpora: ['public', 'forecaster', 'admin'],
  },
};
