import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { ChatMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { request } from '../../lib/api';
const suggestions = [
'Summarize my projects',
'Summarize my tasks',
'What is my workload?',
'What is at risk?',
'What changed recently?'];

export function ChatBot() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [large, setLarge] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
  {
    id: 'm0',
    role: 'assistant',
    content: `Ayubowan ${currentUser?.name?.split(' ')[0] || 'there'} 👋 I'm your T LAB assistant. Ask me for a summary or insight.`
  }]
  );
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, loading]);
  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: 'user',
      content: text
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await request('/ai-assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      }, true);

      setMessages((m) => [
        ...m,
        {
          id: `a${Date.now()}`,
          role: 'assistant' as const,
          content: data.reply || data.message || "I don't have information about that"
        }
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to contact the assistant.';
      setMessages((m) => [
        ...m,
        {
          id: `a${Date.now()}`,
          role: 'assistant' as const,
          content: `Sorry, I couldn't reach the assistant. ${message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <motion.button
        whileHover={{
          scale: 1.05
        }}
        whileTap={{
          scale: 0.95
        }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg">
        
        {open ? <X size={24} /> : <Bot size={24} />}
      </motion.button>

      <AnimatePresence>
        {open &&
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.96
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            y: 20,
            scale: 0.96
          }}
          transition={{
            duration: 0.2
          }}
          className={cn(
            'fixed bottom-24 right-6 z-40 bg-bg border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden',
            large ?
            'w-[calc(100vw-3rem)] max-w-2xl h-[calc(100vh-9rem)] max-h-[44rem]' :
            'w-[calc(100vw-3rem)] max-w-sm h-[32rem]'
          )}>
          
            <div className="flex items-center gap-2 px-4 h-14 border-b border-line bg-card shrink-0">
              <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center text-black">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-maintext leading-none">
                  T LAB Assistant
                </p>
                <p className="text-[11px] text-secondary mt-0.5">
                  Summaries, risks & insights
                </p>
              </div>
              <button
              onClick={() => setLarge((l) => !l)}
              aria-label={large ? 'Shrink chat window' : 'Expand chat window'}
              className="ml-auto p-1.5 rounded-lg text-secondary hover:text-accent">
              
                {large ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m) =>
            <div
              key={m.id}
              className={
              m.role === 'user' ?
              'flex justify-end' :
              'flex justify-start'
              }>
              
                  <div
                className={
                m.role === 'user' ?
                'bg-accent text-black rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm max-w-[85%] whitespace-pre-line' :
                'bg-card text-maintext border border-line rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm max-w-[90%] whitespace-pre-line'
                }>
                
                    {m.content}
                  </div>
                </div>
            )}
              {loading &&
            <div className="flex justify-start">
                  <div
                className="bg-card border border-line rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5"
                aria-label="Assistant is typing">
                
                    {[0, 1, 2].map((i) =>
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                  animate={{
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2
                  }} />

                )}
                  </div>
                </div>
            }
              <div ref={endRef} />
            </div>

            <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
              {suggestions.slice(0, large ? 7 : 3).map((s) =>
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs border border-accent text-accent rounded-full px-3 py-1.5 hover:bg-accent hover:text-black transition-colors">
              
                  {s}
                </button>
            )}
            </div>

            <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="p-3 border-t border-line flex items-center gap-2 shrink-0">
            
              <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a summary or insight…"
              aria-label="Message"
              className="flex-1 bg-card border border-line rounded-xl px-3 py-2 text-sm text-maintext placeholder:text-secondary/60 focus:outline-none focus:border-accent" />
            
              <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="h-9 w-9 rounded-xl bg-accent text-black flex items-center justify-center disabled:opacity-50 shrink-0">
              
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}