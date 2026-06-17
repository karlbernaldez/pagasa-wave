import { pipeline } from 'stream/promises';
import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import { validateChatRequest } from '../validators/chatSchemas.js';
import { buildChatRequest } from '../chat/services/chatService.js';
import { streamChatCompletion } from '../chat/services/providerService.js';
import { logChatEvent } from '../chat/services/chatAuditService.js';
const REQUEST_TIMEOUT_MS = 45000;
export const proxyChatCompletion = asyncHandler(async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throwError('Chat service is not configured.', 503);
  const inferredTier = !req.user ? 'public' : req.user.role === 'admin' ? 'admin' : req.user.role === 'forecaster' ? 'forecaster' : 'public';
  const { model, messages } = validateChatRequest(req.body, inferredTier);
  const chatRequest = await buildChatRequest({ user: req.user, model, messages });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  req.on('close', () => controller.abort());
  try {
    logChatEvent({ tier: chatRequest.tier, userId: req.user?.id || null, model, ip: req.ip, status: 'started' });
    const providerResponse = await streamChatCompletion({ apiKey, model: chatRequest.model, maxTokens: chatRequest.policy.maxTokens, messages: [{ role: 'system', content: chatRequest.systemPrompt }, ...chatRequest.messages], signal: controller.signal });
    if (!providerResponse.ok) {
      logChatEvent({ tier: chatRequest.tier, userId: req.user?.id || null, model, ip: req.ip, status: 'provider_error' });
      const body = await providerResponse.text().catch(() => '');
      res.status(providerResponse.status).type('application/json').send(body || JSON.stringify({ message: 'Chat provider request failed.' }));
      return;
    }
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    await pipeline(providerResponse.body, res);
    logChatEvent({ tier: chatRequest.tier, userId: req.user?.id || null, model, ip: req.ip, status: 'success' });
  } catch (error) {
    if (error.message === 'Unauthorized chat tier') throwError('Chat access denied.', 403);
    if (error.name === 'AbortError') throwError('Chat request timed out or was cancelled.', 504);
    logChatEvent({ tier: inferredTier, userId: req.user?.id || null, model, ip: req.ip, status: 'failed' });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
});
