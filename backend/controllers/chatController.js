import fetch from 'node-fetch';
import { pipeline } from 'stream/promises';
import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import { validateChatRequest } from '../validators/chatSchemas.js';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 45000;
const SYSTEM_PROMPT = 'You are the WaveLab assistant for product support.';
export const proxyChatCompletion = asyncHandler(async (req, res) => {
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throwError('Chat service is not configured.', 503);
const { model, messages } = validateChatRequest(req.body);
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
req.on('close', () => controller.abort());
try {
const groqResponse = await fetch(GROQ_URL, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, stream: true, max_tokens: 1024, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages] }) });
if (!groqResponse.ok) {
const body = await groqResponse.text().catch(() => '');
res.status(groqResponse.status).type('application/json').send(body || JSON.stringify({ message: 'Chat provider request failed.' }));
return;
}
res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
res.setHeader('Cache-Control', 'no-cache, no-transform');
res.setHeader('Connection', 'keep-alive');
res.setHeader('X-Accel-Buffering', 'no');
await pipeline(groqResponse.body, res);
} catch (error) {
if (error.name === 'AbortError') throwError('Chat request timed out or was cancelled.', 504);
throw error;
} finally { clearTimeout(timeout); }
});