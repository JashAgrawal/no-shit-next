'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIdeaStore } from '@/src/stores/ideaStore';
import { useChatStore } from '@/src/stores/chatStore';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/src/components/ChatInput';
import { AgentBadge } from '@/src/components/AgentBadge';
import { toast } from 'sonner';

export default function BoardroomPage() {
  const router = useRouter();
  const { activeIdeaId, getActiveIdea } = useIdeaStore();
  const { getBoardroomMessages, addBoardroomMessage, isLoading, setLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useChatStore((state) => {
    if (!activeIdeaId) return [] as ReturnType<typeof getBoardroomMessages>;
    return state.boardroomChats[activeIdeaId] || [];
  });

  const [streamingByAgent, setStreamingByAgent] = useState<Record<string, string>>({});

  useEffect(() => {
    const idea = getActiveIdea();
    if (!idea) router.push('/analyze-ideas');
  }, [getActiveIdea, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingByAgent]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeIdeaId) return;
      try {
        const res = await fetch(`/api/messages?ideaId=${activeIdeaId}&chatType=boardroom`);
        if (res.ok) {
          const data = await res.json();
          useChatStore.getState().syncFromServer(activeIdeaId, 'boardroom', data.messages);
        }
      } catch {}
    };
    fetchHistory();
  }, [activeIdeaId]);

  const handleSend = async (content: string) => {
    if (!activeIdeaId) return;

    // Add the user's discussion opener
    addBoardroomMessage(activeIdeaId, { role: 'user', content });
    setLoading(true);
    setStreamingByAgent({});

    try {
      const response = await fetch('/api/chat/boardroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, ideaId: activeIdeaId, conversationHistory: messages }),
      });
      if (!response.ok || !response.body) throw new Error('Failed');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const accum: Record<string, string> = {};
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, idx).trimEnd();
          buffer = buffer.slice(idx + 1);
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.agentId && data.chunk) {
                accum[data.agentId] = (accum[data.agentId] || '') + data.chunk;
                setStreamingByAgent({ ...accum });
              }
              if (data.agentId === 'assistant' && data.summary) {
                addBoardroomMessage(activeIdeaId, { role: 'assistant', content: data.summary, agentId: 'assistant' });
              }
              if (data.done) {
                Object.entries(accum).forEach(([aid, text]) => {
                  addBoardroomMessage(activeIdeaId, { role: 'assistant', content: text, agentId: aid });
                });
                setStreamingByAgent({});
              }
            } catch {}
          }
        }
      }
      // Flush any remaining buffered line
      const rem = buffer.trim();
      if (rem.startsWith('data: ')) {
        try {
          const data = JSON.parse(rem.slice(6));
          if (data.agentId && data.chunk) {
            const text = (accum[data.agentId] || '') + data.chunk;
            accum[data.agentId] = text;
            setStreamingByAgent({ ...accum });
          }
          if (data.agentId === 'assistant' && data.summary) {
            addBoardroomMessage(activeIdeaId, { role: 'assistant', content: data.summary, agentId: 'assistant' });
          }
          if (data.done) {
            Object.entries(accum).forEach(([aid, text]) => {
              addBoardroomMessage(activeIdeaId, { role: 'assistant', content: text, agentId: aid });
            });
            setStreamingByAgent({});
          }
        } catch {}
      }
    } catch (e) {
      toast.error('Boardroom is offline. Check API configuration.');
      setStreamingByAgent({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="border border-border p-6 space-y-4">
            <h1 className="text-2xl font-mono font-bold text-primary">🏛️ BOARDROOM</h1>
            <p className="text-sm font-mono text-muted-foreground">Agents debate. HiveMind orchestrates. You decide.</p>
            <div className="border-t border-border pt-4">
              <ChatInput onSend={handleSend} disabled={isLoading} placeholder="Enter the topic for boardroom discussion..." />
            </div>
          </div>

          {/* Messages */}
          {messages.length > 0 && (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="border border-border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {message.agentId && <AgentBadge agentId={message.agentId} />}
                  </div>
                  <p className="text-sm font-mono whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Streaming tiles per agent */}
          {Object.entries(streamingByAgent).length > 0 && (
            <div className="space-y-2">
              {Object.entries(streamingByAgent).map(([aid, text]) => (
                <div key={`stream-${aid}`} className="border border-border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AgentBadge agentId={aid} />
                    <span className="text-xs font-mono text-accent animate-pulse">SPEAKING...</span>
                  </div>
                  <p className="text-sm font-mono whitespace-pre-wrap">{text}</p>
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
