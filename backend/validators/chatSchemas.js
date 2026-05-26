import { throwError } from '../utils/errorHelper.js';

const ALLOWED_MODELS = new Set([
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'groq/compound',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
]);

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_CHARS = 20000;

export function validateChatRequest(body = {}) {
  const model = String(body?.model || '');
  if (!ALLOWED_MODELS.has(model)) {
    throwError('Unsupported chat model.', 400);
  }

  if (!Array.isArray(body?.messages)) {
    throwError('messages must be an array', 400);
  }

  const messages = body.messages
    .slice(-MAX_MESSAGES)
    .map((message) => {
      const role = ['user', 'assistant'].includes(message?.role) ? message.role : 'user';
      const content = String(message?.content || '').slice(0, MAX_MESSAGE_CHARS);
      return { role, content };
    })
    .filter((message) => message.content.trim());

  if (messages.length === 0) {
    throwError('At least one message is required.', 400);
  }

  const totalChars = messages.reduce((sum, message) => sum + message.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    throwError('Chat request too large.', 400);
  }

  return { model, messages };
}
