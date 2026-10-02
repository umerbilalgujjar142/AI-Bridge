import { useEffect, useRef, useState } from 'react';
import { sendChatMessage } from './api/chat';
import './App.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const { answer } = await sendChatMessage(text);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: answer }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
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
          <div key={m.id} className={`message message--${m.role}`}>
            {m.content}
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
