import { useState, useCallback, useRef } from 'react';
import { retrieve } from './ragSearch';

const API_BASE = `${import.meta.env.VITE_API_URL || ''}`;
const PUBLIC_URL = `${API_BASE}/api/chat/public`;
const INTERNAL_URL = `${API_BASE}/api/chat/internal`;
const AUTH_CHECK_URL = `${API_BASE}/api/auth/check`;

const PUBLIC_MODELS = ['llama-3.1-8b-instant'];
const FORECASTER_MODELS = ['llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
const ADMIN_MODELS = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'];

const normalizeResponse = (text) => {
  if (!text) return text;
  return [...new Set(text.split('\n').map((line) => line.trim()).filter(Boolean))].join('\n');
};

const mergeStreamingText = (existing, incoming) => {
  if (!existing) return incoming;
  if (!incoming) return existing;
  if (incoming.startsWith(existing)) return incoming;
  if (existing.startsWith(incoming)) return existing;
  return existing + incoming;
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
      if (!trimmed.startsWith('data: ')) continue;
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

const getAuthProfile = async () => {
  try {
    const response = await fetch(AUTH_CHECK_URL, { credentials: 'include' });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.user || null;
  } catch {
    return null;
  }
};

export const useChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeModel, setActiveModel] = useState(PUBLIC_MODELS[0]);
  const [assistantLabel, setAssistantLabel] = useState('WaveLab Public Assistant');
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const user = await getAuthProfile();
    const role = user?.role || null;
    const isInternal = !!role;

    let models = PUBLIC_MODELS;
    let label = 'WaveLab Public Assistant';

    if (role === 'forecaster') {
      models = FORECASTER_MODELS;
      label = 'WaveLab Forecaster Assistant';
    }

    if (role === 'admin') {
      models = ADMIN_MODELS;
      label = 'WaveLab Admin Assistant';
    }

    const endpoint = isInternal ? INTERNAL_URL : PUBLIC_URL;
    const model = models[0];

    setActiveModel(model);
    setAssistantLabel(label);

    const userMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '', isStreaming: true }]);
    setInput('');
    setIsLoading(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model,
          systemPrompt: `${label} context:\n${retrieve(text.trim())}`,
          messages: [userMessage],
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || `Chat error: ${response.status}`);
      }

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
  }, [isLoading]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput('');
  }, []);

  return { messages, input, setInput, isLoading, error, activeModel, assistantLabel, sendMessage, clearChat, setActiveModel };
};
