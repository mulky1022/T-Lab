import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageSquareText, Send, Sparkles, Zap } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { request } from '../lib/api';
import { ChatMessage } from '../types';

const suggestions = [
  'Summarize my projects',
  'Summarize my tasks',
  'What is my workload?',
  'What is at risk?',
  'What changed recently?',
];

function AssistantPageContent() {
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Ayubowan ${currentUser?.name?.split(' ')[0] || 'there'} 👋 I can help you review progress, spot risks, and summarize priorities.`,
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await request('/ai-assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      }, true);

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply || data.message || "I don't have information about that.",
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to contact the assistant.';
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I couldn't reach the assistant. ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        subtitle="Ask for summaries, risks, and team insights in one place."
      />
      <p className="text-sm text-secondary">This conversation stays in your browser for this session only.</p>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-black">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="font-semibold text-maintext">Assistant mode</h2>
                <p className="text-sm text-secondary">Context-aware support for your workspace</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-secondary">
              <div className="rounded-2xl border border-line bg-bg p-3">
                <div className="flex items-center gap-2 text-maintext">
                  <Zap size={16} className="text-accent" />
                  <span className="font-medium">Good prompts</span>
                </div>
                <p className="mt-2">Try asking for project summaries, task priorities, or recent changes.</p>
              </div>
              <div className="rounded-2xl border border-line bg-bg p-3">
                <div className="flex items-center gap-2 text-maintext">
                  <MessageSquareText size={16} className="text-accent" />
                  <span className="font-medium">Use it for</span>
                </div>
                <ul className="mt-2 space-y-1">
                  <li>• Weekly updates</li>
                  <li>• Team workload review</li>
                  <li>• Delivery risk overview</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-maintext">Popular prompts</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="secondary"
                  size="sm"
                  className="rounded-full"
                  onClick={() => send(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        <Card className="flex h-[640px] flex-col overflow-hidden">
          <div className="border-b border-line bg-bg/70 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-black">
                <Bot size={18} />
              </div>
              <div>
                <p className="font-semibold text-maintext">T LAB Assistant</p>
                <p className="text-sm text-secondary">Live workspace insights</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-bg/40 px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={message.role === 'user'
                    ? 'max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-sm text-black'
                    : 'max-w-[90%] rounded-2xl rounded-bl-md border border-line bg-card px-3.5 py-2.5 text-sm text-maintext'}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-line bg-card px-4 py-3 text-sm text-secondary">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line p-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask for a summary or insight…"
                className="flex-1 rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-maintext placeholder:text-secondary/70 focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <AppLayout>
      <AssistantPageContent />
    </AppLayout>
  );
}
