'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { CpuChip01, MessageChatCircle, Send01, Stop, User01 } from '@untitledui/icons';
import { ConnectWalletButton } from './connect-wallet-button';
import { MarkdownContent } from './markdown-content';
import { ThemeToggle } from './theme-toggle';

function getMessageText(parts: UIMessage['parts']): string {
  return parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

function getReasoningParts(parts: UIMessage['parts']): Array<{ text: string; state?: 'streaming' | 'done' }> {
  return parts.filter(
    (part): part is { type: 'reasoning'; text: string; state?: 'streaming' | 'done' } => part.type === 'reasoning'
  );
}

export function Chat() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput('');
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 text-zinc-900 dark:bg-[#0d0d0d] dark:text-zinc-100">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-200 px-4 py-3 dark:border-white/10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-semibold tracking-tight">Your Portfolio Advisor</h1>
          <div className="flex items-center gap-2">
            <ConnectWalletButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-zinc-500">
              <div className="rounded-full bg-zinc-200/80 p-4 dark:bg-white/5">
                <MessageChatCircle className="h-6 w-6 text-zinc-500 dark:text-zinc-400" size={24} />
              </div>
              <p className="text-sm">Send a message to start the conversation.</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isStreaming && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
                <CpuChip01 size={16} className="text-emerald-400" />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl rounded-tl-sm bg-zinc-200/80 px-4 py-3 dark:bg-white/5">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-sm text-zinc-500">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="shrink-0 border-t border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="text-sm text-red-600 dark:text-red-400">Something went wrong. Please try again.</p>
          <button
            type="button"
            onClick={() => regenerate()}
            className="mt-2 text-sm font-medium text-red-500 underline hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-white/10">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
          <div className="flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-100/80 px-4 py-2 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 dark:border-white/10 dark:bg-white/5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message to your advisor..."
              rows={1}
              disabled={isStreaming}
              className="min-h-[44px] max-h-[200px] w-full resize-none bg-transparent py-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none disabled:opacity-60 dark:text-zinc-100"
            />
            <div className="flex shrink-0 items-end pb-2">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition-colors hover:bg-red-500/30"
                  aria-label="Stop generating"
                >
                  <Stop className="h-4 w-4" size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Send message"
                >
                  <Send01 className="h-4 w-4" size={16} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  const text = getMessageText(message.parts);
  const reasoningParts = getReasoningParts(message.parts);

  if (message.role === 'system') return null;

  return (
    <div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* AI: avatar left, message right. User: message left of avatar, row pushed right (order + justify-end). */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'order-2 bg-emerald-600/30 text-emerald-700 dark:text-emerald-300' : 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400'
        }`}
      >
        {isUser ? <User01 size={16} /> : <CpuChip01 size={16} />}
      </div>
      <div
        className={`flex min-w-0 max-w-[85%] flex-col gap-2 ${isUser ? 'order-1 items-end' : 'items-start'}`}
      >
        {reasoningParts.length > 0 && !isUser && (
          <div className="w-full rounded-2xl rounded-tl-sm border border-zinc-200 bg-zinc-100/80 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">Reasoning</p>
            <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{reasoningParts.map((p) => p.text).join('')}</p>
          </div>
        )}
        {text && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'rounded-tr-sm bg-emerald-600/20 text-emerald-900 dark:text-emerald-100'
                : 'rounded-tl-sm bg-zinc-200/80 text-zinc-900 dark:bg-white/5 dark:text-zinc-100'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
            ) : (
              <MarkdownContent content={text} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
