'use client';

import { useState, useRef, useEffect } from 'react';
import { useVideoStudioStore } from '@/lib/video/store';
import { Send } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a video production assistant. You help users refine their prompts for AI video generation. When given a rough idea, suggest a detailed, cinematic prompt. You can also suggest camera movements, duration, and settings. Keep responses concise and actionable. Always respond in the same language as the user.`;

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'O que voce quer criar? Descreva a cena do seu video e eu ajudo a refinar o prompt.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setPrompt, setCamera, setDuration } = useVideoStudioStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/video/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      const data = await response.json();
      const assistantMessage = data.reply || 'Desculpe, nao consegui processar.';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }]);

      const promptMatch = assistantMessage.match(/Prompt:?\s*["'](.+?)["']/i);
      if (promptMatch) {
        setPrompt(promptMatch[1]);
      }

      const cameraMatch = assistantMessage.match(/Camera:?\s*(pan|tilt|zoom|orbit|static)/i);
      if (cameraMatch) {
        setCamera({ type: cameraMatch[1].toLowerCase() as any });
      }

      const durationMatch = assistantMessage.match(/Duracao:?\s*(\d+)s/i);
      if (durationMatch) {
        setDuration(parseInt(durationMatch[1]));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro ao conectar com o assistente. Verifique sua API key.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950/50">
      <div className="px-4 py-3 border-b border-zinc-800/60">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">AI Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl px-4 py-3 max-w-[90%] ${
              msg.role === 'assistant'
                ? 'bg-zinc-900 text-zinc-300'
                : 'bg-emerald-600 text-white ml-auto'
            }`}
          >
            {msg.role === 'assistant' && (
              <p className="text-[10px] text-zinc-500 mb-1 font-medium">AI</p>
            )}
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="bg-zinc-900 rounded-xl px-4 py-3 max-w-[90%]">
            <p className="text-[10px] text-zinc-500 mb-1 font-medium">AI</p>
            <p className="text-sm text-zinc-400 animate-pulse">Pensando...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800/60">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl p-3 text-white transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
