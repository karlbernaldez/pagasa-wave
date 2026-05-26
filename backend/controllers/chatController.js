import fetch from 'node-fetch';
import { pipeline } from 'stream/promises';

import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const ALLOWED_MODELS = new Set([
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'groq/compound',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
]);

function normalizeMessages(messages = []) {
  if (!Array.isArray(messages)) {
    throwError('messages must be an array', 400);
  }

  return messages.slice(-20).map((message) => {
    const role = ['user', 'assistant'].includes(message?.role) ? message.role : 'user';
    const content = String(message?.content || '').slice(0, 4_000);
    return { role, content };
  }).filter((message) => message.content.trim());
}

export const proxyChatCompletion = asyncHandler(async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throwError('Chat service is not configured.', 503); 
  }

  const model = String(req.body?.model || '');
  if (!ALLOWED_MODELS.has(model)) {
    throwError('Unsupported chat model.', 400);
  }

  const systemPrompt = String(req.body?.systemPrompt || '').slice(0, 20_000);
  if (!systemPrompt.trim()) {
    throwError('systemPrompt is required.', 400);
  }

  const messages = normalizeMessages(req.body?.messages);
  if (messages.length === 0) {
    throwError('At least one message is required.', 400);
  }

  const groqResponse = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!groqResponse.ok) {
    const body = await groqResponse.text().catch(() => '');
    res.status(groqResponse.status).type('application/json').send(body || JSON.stringify({
      message: 'Chat provider request failed.',
    }));
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  await pipeline(groqResponse.body, res);
});
