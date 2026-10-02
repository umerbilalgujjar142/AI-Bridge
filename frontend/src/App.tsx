import { useEffect, useRef, useState } from 'react';
import { sendChatMessage, type ChatSource } from './api/chat';
import './App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[]; // which knowledge base sections the answer came from
  failed?: boolean; // the request for this message never got an answer
}

const MAX_LENGTH = 2000; // matches the backend DTO's @MaxLength

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function send() {
    const text = input.trim();
    if (!text || isLoading) return;

    // Generate the id outside the updater: React may call an updater twice in
    // development, and the id must stay the same so we can mark it failed later.
    const messageId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: messageId, role: 'user', content: text }]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const { answer, sources } = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: answer, sources },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      // The error banner is cleared by the next send, so mark the message
      // itself — otherwise the history shows an unanswered question as normal.
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, failed: true } : m)),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="chat">
      <header className="chat__header">
        <h1>AI Bridge</h1>
        <p>Knowledge base assistant</p>
      </header>

      <main className="chat__messages" aria-live="polite">
        {messages.length === 0 && <p className="chat__empty">Ask a question to get started.</p>}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`message message--${m.role}${m.failed ? ' message--failed' : ''}`}
          >
            {m.content}
            {m.failed && <span className="message__failed" title="This message was not answered"> · not sent</span>}
            {m.sources && m.sources.length > 0 && (
              <div className="message__sources">
                <span className="message__sources-label">Sources</span>
                {m.sources.map((s) => (
                  <span key={`${s.documentId}-${s.section}`} className="source" title={`${s.title} · similarity ${s.score}`}>
                    {s.section}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && <div className="message message--assistant message--loading">Thinking…</div>}
        <div ref={bottomRef} />
      </main>

      {error && (
        <div className="chat__error" role="alert">
          {error}
        </div>
      )}

      <form
        className="chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder="Ask something… (Enter to send, Shift+Enter for a new line)"
          maxLength={MAX_LENGTH}
          rows={2}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
