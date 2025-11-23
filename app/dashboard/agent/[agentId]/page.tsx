'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIdeaStore } from '@/src/stores/ideaStore';
import { useChatStore, type Message } from '@/src/stores/chatStore';
import { AGENTS } from '@/src/lib/agents';
import { ChatMessage } from '@/src/components/ChatMessage';
import { ChatInput } from '@/src/components/ChatInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AgentChatPage() {
  const router = useRouter();
  const params = useParams<{ agentId: string }>();
  const agentId = params?.agentId as string | undefined;
  const agent = agentId ? AGENTS[agentId] : null;
  const activeIdeaId = useIdeaStore((s) => s.activeIdeaId);
  const getActiveIdea = useIdeaStore((s) => s.getActiveIdea);
  const addAgentMessage = useChatStore((s) => s.addAgentMessage);
  const clearAgentChat = useChatStore((s) => s.clearAgentChat);
  const isLoading = useChatStore((s) => s.isLoading);
  const setLoading = useChatStore((s) => s.setLoading);
  const getSharedContext = useChatStore((s) => s.getSharedContext);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  // stable empty array to avoid new reference on each selector run
  const emptyMessagesRef = useRef<Message[]>([]);
  const messages = useChatStore((state): Message[] => {
    if (!activeIdeaId || !agentId) return emptyMessagesRef.current;
    return state.agentChats[activeIdeaId]?.[agentId] || emptyMessagesRef.current;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingMessage]);

  useEffect(() => {
    const idea = getActiveIdea();
    if (!idea) {
      router.push('/analyze-ideas');
      return;
    }
    const fetchHistory = async () => {
      if (!activeIdeaId || !agentId) return;
      try {
        const res = await fetch(`/api/messages?ideaId=${activeIdeaId}&chatType=agent&agentId=${agentId}`);
        if (res.ok) {
          const data = await res.json();
          useChatStore.getState().syncFromServer(activeIdeaId, 'agent', data.messages, agentId);
        }
      } catch {}
    };
    fetchHistory();
  }, [activeIdeaId, agentId, getActiveIdea, router]);

  const handleSend = async (content: string) => {
    if (!agent || !activeIdeaId || !agentId) {
      toast.error('Agent not available or no active idea');
      return;
    }

    addAgentMessage(activeIdeaId, agent.id, { role: 'user', content });
    setLoading(true);
    setStreamingMessage('');

    try {
      const context = getSharedContext(activeIdeaId);
      const response = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, agentId, ideaId: activeIdeaId, context }),
      });
      if (!response.ok || !response.body) throw new Error('Failed');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lineBreakIndex;
        while ((lineBreakIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, lineBreakIndex).trimEnd();
          buffer = buffer.slice(lineBreakIndex + 1);
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                full += data.chunk;
                console.log(data.chunk)
                setStreamingMessage(full);
              }
              if (data.done) {
                addAgentMessage(activeIdeaId, agent.id, { role: 'assistant', content: full, agentId: agent.id });
                setStreamingMessage('');
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
          if (data.chunk) {
            full += data.chunk;
            setStreamingMessage(full);
          }
          if (data.done) {
            addAgentMessage(activeIdeaId, agent.id, { role: 'assistant', content: full, agentId: agent.id });
            setStreamingMessage('');
          }
        } catch {}
      }
    } catch (e) {
      toast.error(`${agent.name} is offline. Check API configuration.`);
      setStreamingMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (activeIdeaId && agentId) {
      clearAgentChat(activeIdeaId, agentId);
      setStreamingMessage('');
      
      try {
        await fetch(`/api/messages?ideaId=${activeIdeaId}&chatType=agent&agentId=${agentId}`, {
          method: 'DELETE',
        });
        toast.success('Chat history cleared');
      } catch (error) {
        console.error('Failed to clear chat history:', error);
        toast.error('Failed to clear chat history from server');
      }
    }
  };

  if (!agent) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 && agent && (
            <div className="text-center py-12 space-y-4 max-w-2xl mx-auto">
              <div className="text-6xl mb-4">{agent.emoji}</div>
              <h2 className="text-2xl font-mono font-bold text-primary">{agent.name}</h2>
              <p className="text-sm font-mono text-muted-foreground">{agent.role}</p>
              <div className="border border-border p-4 text-left">
                <p className="text-xs font-mono text-muted-foreground mb-2">EXPERTISE:</p>
                <div className="flex flex-wrap gap-2">
                  {agent.expertise.map((exp) => (
                    <span key={exp} className="text-xs font-mono bg-muted px-2 py-1">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm font-mono text-muted-foreground">
                Direct line to {agent.name}. Ask anything about {agent.expertise[0]}.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} onResend={handleSend} isResending={isLoading} />
          ))}
          {streamingMessage && (
            <ChatMessage
              message={{ id: 'stream', role: 'assistant', content: streamingMessage, timestamp: Date.now(), agentId: agent.id }}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <div className="flex-1">
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
          <Button variant="outline" size="sm" onClick={handleClear}>CLEAR</Button>
        </div>
      </div>
    </div>
  );
}
