import { throwError } from '../utils/errorHelper.js';

const POLICY = {
  public: { models: new Set(['llama-3.1-8b-instant']), maxMessages: 8, maxMessageChars: 1000, maxTotalChars: 6000 },
  forecaster: { models: new Set(['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768']), maxMessages: 20, maxMessageChars: 4000, maxTotalChars: 20000 },
  admin: { models: new Set(['meta-llama/llama-4-scout-17b-16e-instruct', 'groq/compound', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']), maxMessages: 30, maxMessageChars: 6000, maxTotalChars: 40000 },
};

export function validateChatRequest(body = {}, tier = 'public') {
  const config = POLICY[tier] || POLICY.public;
  const model = String(body?.model || '');
  if (!config.models.has(model)) throwError('Unsupported chat model for access level.', 400);
  if (!Array.isArray(body?.messages)) throwError('messages must be an array', 400);
  const messages = body.messages.slice(-config.maxMessages).map((message) => {
    const role = ['user', 'assistant'].includes(message?.role) ? message.role : 'user';
    const content = String(message?.content || '').slice(0, config.maxMessageChars);
    return { role, content };
  }).filter((message) => message.content.trim());
  if (!messages.length) throwError('At least one message is required.', 400);
  const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalChars > config.maxTotalChars) throwError('Chat request too large.', 400);
  return { model, messages };
}
