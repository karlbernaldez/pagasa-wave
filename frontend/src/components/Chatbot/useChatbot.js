import { useState, useCallback, useRef } from 'react';
import { retrieve } from './ragSearch';

// ─── Config ───────────────────────────────────────────────────────────────────
const CHAT_COMPLETIONS_URL = `${import.meta.env.VITE_API_URL || ''}/api/chat/completions`;

const MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'groq/compound',
  'llama-3.3-70b-versatile', // best quality — tried first
  'llama-3.1-8b-instant',    // fastest — fallback #1
  'mixtral-8x7b-32768',      // long context — fallback #2
];

const modelCooldowns = {};

const getAvailableModel = () => {
  const now = Date.now();
  return MODELS.find((m) => !modelCooldowns[m] || modelCooldowns[m] < now) ?? null;
};

const cooldownModel = (model, retryAfterSeconds = 60) => {
  modelCooldowns[model] = Date.now() + retryAfterSeconds * 1000;
  console.warn(`[Chatbot] "${model}" rate limited — cooling down for ${retryAfterSeconds}s`);
};

// ─── Dynamic system prompt (only relevant chunks) ─────────────────────────────

const buildSystemPrompt = (query) => {
  const context = retrieve(query);
  return `You are a friendly and approachable assistant for WaveLab. Your job is to help users understand how to use the platform in a simple, clear, and welcoming way.

When answering:
- Use plain, everyday language. Avoid jargon and technical terms unless necessary — and if you must use one, briefly explain what it means.
- Be warm and conversational, like a helpful teammate — not a manual.
- Keep answers short and easy to follow. Use bullet points or numbered steps when walking through how to do something.
- If the user seems confused, reassure them and break things down further.

FORMATTING RULES — follow these strictly:
- Never use markdown symbols like #, ##, ###, ####, ---, or **** in your response.
- For bullet points, use a dash and space: "- item"
- For numbered steps, use "1. step"
- For bold/emphasis, just write the word normally — do not wrap in asterisks.
- Do not add section headers or dividers.

If the answer is not in the documentation, say: "Hmm, I'm not sure about that one! It might be best to reach out to the support team for help."

Only answer based on the documentation below. Do not make anything up.

---
${context}
---`;
};


// ─── Core fetch (single model attempt) ───────────────────────────────────────

const fetchGroq = async (model, systemPrompt, messages, signal) => {
  const response = await fetch(CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal,
    body: JSON.stringify({
      model,
      systemPrompt,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 503)
      throw new Error('FATAL:Chat service is not configured. Check GROQ_API_KEY on the backend.');
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('retry-after') ?? '60', 10);
      cooldownModel(model, retryAfter);
      throw new Error('RATE_LIMITED');
    }
    throw new Error(body?.error?.message || `Groq error: ${response.status}`);
  }

  return response;
};

// ─── SSE stream reader ────────────────────────────────────────────────────────

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
        if (token) {
          accumulated += token;
          onToken(accumulated);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return accumulated;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

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
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    abortRef.current = new AbortController();

    // Build a focused system prompt using only relevant doc chunks for this query
    const systemPrompt = buildSystemPrompt(text.trim());

    let lastError = null;

    for (const model of MODELS) {
      const now = Date.now();
      if (modelCooldowns[model] && modelCooldowns[model] >= now) continue;

      try {
        setActiveModel(model);

        const response = await fetchGroq(model, systemPrompt, updatedMessages, abortRef.current.signal);

        const accumulated = await readStream(response, (partial) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: partial, isStreaming: true };
            return updated;
          });
        });

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });

        setIsLoading(false);
        return;
      } catch (err) {
        if (err.name === 'AbortError') { setIsLoading(false); return; }
        if (err.message.startsWith('FATAL:')) { lastError = err.message.replace('FATAL:', ''); break; }
        if (err.message === 'RATE_LIMITED') { lastError = null; continue; }
        lastError = err.message;
        break;
      }
    }

    const allCooled = MODELS.every((m) => modelCooldowns[m] && modelCooldowns[m] >= Date.now());
    setError(
      lastError ||
      (allCooled
        ? 'All models are rate-limited. Please wait a minute and try again.'
        : 'Something went wrong. Please try again.')
    );
    setMessages((prev) => prev.slice(0, -1));
    setIsLoading(false);
  }, [messages, isLoading]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput('');
  }, []);

  return { messages, input, setInput, isLoading, error, activeModel, sendMessage, clearChat };
};
