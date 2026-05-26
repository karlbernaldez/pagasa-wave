import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE = `${import.meta.env.VITE_API_URL || ''}`;
const PUBLIC_URL = `${API_BASE}/api/chat/public`;
const INTERNAL_URL = `${API_BASE}/api/chat/internal`;
const AUTH_CHECK_URL = `${API_BASE}/api/auth/check`;
const MEMORY_WINDOW = 10;

const PUBLIC_MODELS = ['llama-3.1-8b-instant'];
const FORECASTER_MODELS = ['mixtral-8x7b-32768', 'llama-3.1-8b-instant'];
const ADMIN_MODELS = ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama-3.1-8b-instant'];

const normalizeResponse = (text) => text ? text.trim() : text;

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
        accumulated += token;
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

  useEffect(() => {
    const initAssistant = async () => {
      const user = await getAuthProfile();
      const role = user?.role || null;

      if (role === 'admin') {
        setAssistantLabel('WaveLab Admin Assistant');
        setActiveModel(ADMIN_MODELS[0]);
        return;
      }
      if (role === 'forecaster') {
        setAssistantLabel('WaveLab Forecaster Assistant');
        setActiveModel(FORECASTER_MODELS[0]);
        return;
      }
      setAssistantLabel('WaveLab Public Assistant');
      setActiveModel(PUBLIC_MODELS[0]);
    };

    initAssistant();
  }, []);

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
    const userMessage = { role: 'user', content: text.trim() };
    const conversationHistory = [...messages, userMessage]
      .filter((m) => m.content && !m.isStreaming)
      .slice(-MEMORY_WINDOW);

    setActiveModel(model);
    setAssistantLabel(label);
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
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || `Chat error: ${response.status}`);
      }

      const accumulated = await readStream(response, (partial) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: normalizeResponse(partial),
            isStreaming: true,
          };
          return updated;
        });
      });

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: normalizeResponse(accumulated),
        };
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
  }, [isLoading, messages]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput('');
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    error,
    activeModel,
    assistantLabel,
    sendMessage,
    clearChat,
    setActiveModel,
  };
};
