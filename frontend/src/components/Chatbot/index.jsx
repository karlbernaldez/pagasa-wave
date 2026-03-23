import { useEffect, useRef, useState } from 'react';
import { useChatbot } from './useChatbot';
import { useTheme } from '@/app/providers/ThemeProvider';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconChat = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const IconWave = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 10c1.5 0 1.5-2 3-2s1.5 2 3 2 1.5-2 3-2 1.5 2 3 2 1.5-2 3-2M3 16c1.5 0 1.5-2 3-2s1.5 2 3 2 1.5-2 3-2 1.5 2 3 2 1.5-2 3-2" />
  </svg>
);

// ─── Typing Dots ──────────────────────────────────────────────────────────────

const TypingDots = () => (
  <div className="flex items-center gap-1.5 px-1 py-1">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-bounce"
        style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.85s' }}
      />
    ))}
  </div>
);

// ─── Markdown Renderer ────────────────────────────────────────────────────────

const FormattedMessage = ({ content, isUser }) => {
  if (!content) return null;

  const cleaned = content
    .replace(/^---+\s*$/gm, '')
    .replace(/^#{1,4}\s*/gm, '')
    .trim();

  const lines = cleaned.split('\n');
  const elements = [];
  let i = 0;

  const inlineFormat = (text, key) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j} className="font-semibold">{p.slice(2, -2)}</strong>
            : p
        )}
      </span>
    );
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-outside pl-4 space-y-1">
          {items.map((item, j) => <li key={j}>{inlineFormat(item, j)}</li>)}
        </ol>
      );
      continue;
    }

    if (/^[-*]\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-outside pl-4 space-y-1">
          {items.map((item, j) => <li key={j}>{inlineFormat(item, j)}</li>)}
        </ul>
      );
      continue;
    }

    elements.push(<p key={i}>{inlineFormat(trimmed, i)}</p>);
    i++;
  }

  return <div className="space-y-2 text-sm leading-relaxed break-words">{elements}</div>;
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = ({ message, isDarkMode }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ animation: 'msgIn 0.22s cubic-bezier(0.34,1.2,0.64,1) both' }}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <IconWave />
        </div>
      )}

      <div className={`
        max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm shadow-sm
        ${isUser
          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-br-sm shadow-blue-500/30 leading-relaxed'
          : isDarkMode
            ? 'bg-[#1e2d47] text-slate-200 rounded-bl-sm border border-blue-900/60'
            : 'bg-white text-slate-700 rounded-bl-sm border border-slate-200 shadow-slate-200/80'
        }
      `}>
        {message.isStreaming && !message.content
          ? <TypingDots />
          : isUser
            ? <span className="whitespace-pre-wrap break-words">{message.content}</span>
            : <FormattedMessage content={message.content} isDarkMode={isDarkMode} />
        }
      </div>
    </div>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'How do I get started?',
  'What features are available?',
  'How do I troubleshoot issues?',
];

const EmptyState = ({ onSuggest, isDarkMode }) => (
  <div className="flex flex-col items-center justify-center h-full gap-5 px-3 text-center">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl ${
      isDarkMode
        ? 'bg-gradient-to-br from-blue-600/30 to-cyan-600/20 border border-blue-500/30'
        : 'bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200'
    }`}>
      <span className="text-3xl">🌊</span>
    </div>

    <div>
      <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        Ask me anything about WaveLab
      </p>
      <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        Answers based on the documentation
      </p>
    </div>

    <div className="flex flex-col gap-2 w-full">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          onClick={() => onSuggest(s)}
          className={`
            text-xs text-left px-3.5 py-2.5 rounded-xl border font-medium
            transition-all duration-200 hover:scale-[1.015]
            ${isDarkMode
              ? 'bg-[#1e2d47] border-blue-900/60 text-slate-300 hover:bg-blue-900/40 hover:border-blue-500/50 hover:text-blue-300'
              : 'bg-white border-slate-200 text-slate-600 shadow-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
            }
          `}
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Chatbot = () => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, setInput, isLoading, error, activeModel, sendMessage, clearChat } = useChatbot();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          50%       { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
        }
        .chatbot-scrollbar::-webkit-scrollbar { width: 4px; }
        .chatbot-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .chatbot-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,179,237,0.3); border-radius: 99px; }
      `}</style>

      {/* ── Panel ── */}
      <div
        className={`
          fixed bottom-24 right-5 z-50
          w-[370px] h-[580px]
          flex flex-col overflow-hidden rounded-2xl
          transition-all duration-300 ease-out origin-bottom-right
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
          ${isDarkMode
            ? 'bg-[#0f1c2e] border border-blue-900/50'
            : 'bg-[#f0f6ff] border border-blue-100'
          }
        `}
        style={{
          boxShadow: isDarkMode
            ? '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
            : '0 25px 60px rgba(59,130,246,0.2), 0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(59,130,246,0.1)',
          ...(isOpen ? { animation: 'panelIn 0.28s cubic-bezier(0.34,1.1,0.64,1) both' } : {}),
        }}
      >
        {/* Top gradient bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 flex-shrink-0" />

        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-4 py-3 flex-shrink-0 ${
          isDarkMode
            ? 'bg-[#0d1a2b] border-b border-blue-900/40'
            : 'bg-white border-b border-blue-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/40">
                <IconWave />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                WaveLab Assistant
              </p>
              <p className={`text-[10px] font-mono mt-0.5 truncate max-w-[170px] ${isDarkMode ? 'text-blue-400/70' : 'text-blue-500/70'}`}>
                {activeModel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                title="Clear chat"
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'text-slate-500 hover:text-red-400 hover:bg-red-400/10'
                    : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <IconTrash />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                isDarkMode
                  ? 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <IconClose />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 chatbot-scrollbar ${
          isDarkMode ? 'bg-[#0f1c2e]' : 'bg-[#f0f6ff]'
        }`}>
          {messages.length === 0 ? (
            <EmptyState onSuggest={(t) => sendMessage(t)} isDarkMode={isDarkMode} />
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} isDarkMode={isDarkMode} />
            ))
          )}

          {error && (
            <div className={`text-xs text-center rounded-xl px-3 py-2.5 border ${
              isDarkMode
                ? 'bg-red-900/20 text-red-400 border-red-800/40'
                : 'bg-red-50 text-red-500 border-red-100'
            }`}>
              ⚠️ {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input ── */}
        <div className={`px-3 pt-3 pb-3 flex-shrink-0 ${
          isDarkMode
            ? 'bg-[#0d1a2b] border-t border-blue-900/40'
            : 'bg-white border-t border-blue-100'
        }`}>

          {/* Hint row */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              ↵ to send · shift+↵ for new line
            </span>
            <span className={`text-[10px] font-mono ${
              input.length > 400
                ? 'text-amber-400'
                : isDarkMode ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {input.length}/500
            </span>
          </div>

          {/* Input row */}
          <div
            className={`
              flex items-end gap-2 rounded-2xl border-2 px-4 py-3
              transition-all duration-200
              ${isDarkMode
                ? 'bg-[#1a2a40] border-blue-900/40 focus-within:border-blue-500/70 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'
                : 'bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]'
              }
            `}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about WaveLab..."
              rows={1}
              disabled={isLoading}
              className={`
                flex-1 resize-none text-sm bg-transparent outline-none
                max-h-24 disabled:opacity-40 leading-relaxed
                ${isDarkMode
                  ? 'text-slate-100 placeholder-slate-600'
                  : 'text-slate-800 placeholder-slate-400'
                }
              `}
              style={{ lineHeight: '1.55' }}
            />

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className={`
                flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                transition-all duration-200 active:scale-90
                ${input.trim() && !isLoading
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 cursor-pointer'
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }
              `}
            >
              {isLoading
                ? (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )
                : <IconSend />
              }
            </button>
          </div>

          {/* Footer */}
          <p className={`text-center text-[10px] mt-2 tracking-wide ${
            isDarkMode ? 'text-slate-700' : 'text-slate-400'
          }`}>
            Answers grounded in WaveLab documentation
          </p>
        </div>
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        style={{
          boxShadow: isOpen
            ? '0 8px 24px rgba(0,0,0,0.3)'
            : '0 8px 32px rgba(59,130,246,0.5), 0 4px 12px rgba(0,0,0,0.2)',
          animation: !isOpen ? 'fabPulse 3s ease-in-out infinite' : 'none',
        }}
        className={`
          fixed bottom-5 right-5 z-50
          w-14 h-14 rounded-2xl
          flex items-center justify-center text-white
          transition-all duration-300
          ${isOpen
            ? isDarkMode ? 'bg-[#1e2d47]' : 'bg-slate-600'
            : 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover:scale-110'
          }
        `}
      >
        <div className={`transition-all duration-300 ${isOpen ? 'rotate-90 scale-90' : 'rotate-0 scale-100'}`}>
          {isOpen ? <IconClose /> : <IconChat />}
        </div>

        {!isOpen && messages.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">
              {messages.filter(m => m.role === 'assistant').length}
            </span>
          </span>
        )}
      </button>
    </>
  );
};

export default Chatbot;