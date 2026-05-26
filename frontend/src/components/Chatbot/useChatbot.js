import { useState, useCallback, useRef } from 'react';
import { retrieve } from './ragSearch';

const CHAT_COMPLETIONS_URL = `${import.meta.env.VITE_API_URL || ''}/api/chat/public`;

const MODELS = [
  'llama-3.1-8b-instant',
];

const modelCooldowns = {};

const cooldownModel = (model, retryAfterSeconds = 60) => {
  modelCooldowns[model] = Date.now() + retryAfterSeconds * 1000;
};

const normalizeResponse = (text) => {
  if (!text) return text;
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const deduped = [];
  for (const line of lines) {
    if (deduped[deduped.length - 1] !== line) deduped.push(line);
  }
  return deduped.join('\n');
};

const mergeStreamingText = (existing, incoming) => {
  if (!existing) return incoming;
  if (!incoming) return existing;
  if (incoming.startsWith(existing)) return incoming;
  if (existing.startsWith(incoming)) return existing;
  const maxOverlap = Math.min(existing.length, incoming.length);
  for (let i = maxOverlap; i > 0; i--) {
    if (existing.slice(-i) === incoming.slice(0, i)) return existing + incoming.slice(i);
  }
  return existing + incoming;
};

const buildSystemPrompt = (query) => {
  const context = retrieve(query);
  return `Public marine assistant context:\n${context}`;
};

const fetchGroq = async (model, systemPrompt, messages, signal) => {
  const response = await fetch(CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    signal,
    body: JSON.stringify({ model, systemPrompt, messages: messages.map(({ role, content }) => ({ role, content })) }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 503) throw new Error('FATAL:Chat service is not configured.');
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') ?? '60', 10);
      cooldownModel(model, retryAfter);
      throw new Error('RATE_LIMITED');
    }
    throw new Error(body?.error?.message || body?.message || `Chat error: ${response.status}`);
  }

  return response;
};

const readStream = async (response, onToken) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return accumulated;
      try {
        const parsed = JSON.parse(data);
        const token = parsed?.choices?.[0]?.delta?.content ?? '';
        if (!token) continue;
        accumulated = mergeStreamingText(accumulated, token);
        onToken(accumulated);
      } catch {}
    }
  }
  return accumulated;
};

export const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState(MODELS[0]);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;
    const userMessage = { role: 'user', content: text.trim() };
    const assistantPlaceholder = { role: 'assistant', content: '', isStreaming: true };
    setMessages([...messages, userMessage, assistantPlaceholder]);
    setInput('');
    setIsLoading(true);
    setError(null);
    abortRef.current = new AbortController();
    const systemPrompt = buildSystemPrompt(text.trim());
    try {
      const response = await fetchGroq(MODELS[0], systemPrompt, [userMessage], abortRef.current.signal);
      const accumulated = await readStream(response, (partial) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: normalizeResponse(partial), isStreaming: true };
          return updated;
        });
      });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: normalizeResponse(accumulated) };
        return updated;
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong.');
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput('');
  }, []);

  return { messages, input, setInput, isLoading, error, activeModel, sendMessage, clearChat };
};
