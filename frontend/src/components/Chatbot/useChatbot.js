import { useState, useCallback, useRef } from 'react';
import { retrieve } from './ragSearch';

const CHAT_COMPLETIONS_URL = `${import.meta.env.VITE_API_URL || ''}/api/chat/completions`;

const MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'groq/compound',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
];

const modelCooldowns = {};

const cooldownModel = (model, retryAfterSeconds = 60) => {
  modelCooldowns[model] = Date.now() + retryAfterSeconds * 1000;
  console.warn(`[Chatbot] "${model}" rate limited — cooling down for ${retryAfterSeconds}s`);
};

const buildSystemPrompt = (query) => {
  const context = retrieve(query);

  return `You are the WaveLab assistant.

Your purpose is to help users understand WaveLab features, workflows, terminology, and documented marine forecasting concepts.

Behavior rules:
- Answer only using the provided documentation context.
- Never invent features, workflows, permissions, scientific thresholds, or operational behavior.
- If documentation is incomplete, clearly say the documentation does not provide enough information.
- Prefer WaveLab-specific definitions over generic explanations.
- Prefer glossary definitions when explaining terminology.
- Prefer FAQ and troubleshooting guidance when users describe problems.
- Prefer operational workflow explanations over general assumptions.
- If a user asks about marine forecasting terminology, explain using documented WaveLab-compatible definitions.
- If a question involves live forecast values or external operational systems not documented here, say that information is unavailable.

Response style:
- Use plain, clear language.
- Keep answers concise but useful.
- Use numbered steps for instructions.
- Use bullet points for explanations.
- Briefly explain technical terms.
- Be helpful and professional.

Formatting rules:
- Do not use markdown headings.
- Do not use markdown separators.
- Do not use bold markdown syntax.

Fallback response:
If the answer is not supported by documentation, say:
"I couldn't find enough information in the WaveLab documentation to answer that accurately."

Documentation context:
${context}`;
};

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
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    abortRef.current = new AbortController();
    const systemPrompt = buildSystemPrompt(text.trim());

    let lastError = null;

    for (const model of MODELS) {
      if (modelCooldowns[model] && modelCooldowns[model] >= Date.now()) continue;

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
        if (err.name === 'AbortError') {
          setIsLoading(false);
          return;
        }
        if (err.message.startsWith('FATAL:')) {
          lastError = err.message.replace('FATAL:', '');
          break;
        }
        if (err.message === 'RATE_LIMITED') {
          continue;
        }
        lastError = err.message;
        break;
      }
    }

    const allCooled = MODELS.every((m) => modelCooldowns[m] && modelCooldowns[m] >= Date.now());

    setError(
      lastError ||
      (allCooled
        ? 'All chat models are temporarily rate-limited. Please try again shortly.'
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
