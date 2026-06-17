import fetch from 'node-fetch';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const streamChatCompletion = async ({ apiKey, model, maxTokens, messages, signal }) => fetch(GROQ_URL, { method: 'POST', signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, stream: true, max_tokens: maxTokens, messages }) });
