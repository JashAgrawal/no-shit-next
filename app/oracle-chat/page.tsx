'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useIdeaStore } from '@/src/stores/ideaStore';
import { useChatStore } from '@/src/stores/chatStore';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/src/components/ChatMessage';
import { ChatInput } from '@/src/components/ChatInput';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function OracleChat() {
  const router = useRouter();
  const { getActiveIdea, updateIdea, activeIdeaId } = useIdeaStore();
  const { getOracleMessages, addOracleMessage, isLoading, setLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationTurns, setConversationTurns] = useState(0);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  const currentIdea = getActiveIdea();
  const currentIdeaId = activeIdeaId;
  const messages = useChatStore((state) => {
    if (!currentIdeaId) return [] as ReturnType<typeof getOracleMessages>;
    return state.oracleChats[currentIdeaId] || [];
  });

  useEffect(() => {
    if (!currentIdeaId) {
      router.push('/analyze-ideas');
    }
  }, [currentIdeaId, router]);

  // Hydrate oracle messages from server on mount
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentIdeaId) return;
      try {
        const res = await fetch(`/api/messages?ideaId=${currentIdeaId}&chatType=oracle`);
        if (res.ok) {
          const data = await res.json();
          useChatStore.getState().syncFromServer(currentIdeaId, 'oracle', data.messages || []);
        }
      } catch (_) {}
    };
    fetchHistory();
  }, [currentIdeaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingMessage]);

  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    setConversationTurns(userMessages.length);
  }, [messages]);

  const handleChatMessage = async (content: string) => {
    if (!currentIdeaId) return;

    addOracleMessage(currentIdeaId, {
      role: 'user',
      content,
    });

    setLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/chat/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          ideaId: currentIdeaId,
          conversationHistory: messages,
          shouldJudge: conversationTurns >= 2,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Oracle response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullResponse = '';
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
              if (data.chunk) {
                fullResponse += data.chunk;
                setStreamingMessage(fullResponse);
              }
              if (data.done) {
                addOracleMessage(currentIdeaId, { role: 'assistant', content: fullResponse, agentId: 'oracle' });
                setStreamingMessage('');
                if (data.verdict) {
                  updateIdea(currentIdeaId, {
                    verdict: data.verdict,
                    validated: true,
                    dashboardData: data.dashboardData,
                  });
                  if (data.verdict === 'VIABLE' || data.verdict === 'FIRE') {
                    toast.success('Idea approved! Dashboard unlocked.');
                    setTimeout(() => router.push('/dashboard'), 2000);
                  } else {
                    toast.error('Idea rejected. Try again or improve it.');
                  }
                }
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
            fullResponse += data.chunk;
            setStreamingMessage(fullResponse);
          }
          if (data.done) {
            addOracleMessage(currentIdeaId, { role: 'assistant', content: fullResponse, agentId: 'oracle' });
            setStreamingMessage('');
            if (data.verdict) {
              updateIdea(currentIdeaId, {
                verdict: data.verdict,
                validated: true,
                dashboardData: data.dashboardData,
              });
              if (data.verdict === 'VIABLE' || data.verdict === 'FIRE') {
                toast.success('Idea approved! Dashboard unlocked.');
                setTimeout(() => router.push('/dashboard'), 2000);
              } else {
                toast.error('Idea rejected. Try again or improve it.');
              }
            }
          }
        } catch {}
      }

    } catch (error) {
      toast.error('Oracle is offline. Check API configuration.');
      console.error(error);
      setStreamingMessage('');
    } finally {
      setLoading(false);
    }
  };

  if (!currentIdea) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-mono font-bold">ORACLE JUDGMENT</h1>
          <div className="w-20" />
        </div>

        <div className="space-y-4 min-h-[60vh] max-h-[70vh] overflow-y-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onResend={handleChatMessage}
              isResending={isLoading}
            />
          ))}
          {streamingMessage && (
            <ChatMessage
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingMessage,
                timestamp: Date.now(),
                agentId: 'oracle',
              }}
            />
          )}
          {isLoading && !streamingMessage && (
            <div className="font-mono text-sm text-muted-foreground animate-pulse">
              Oracle is thinking...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border pt-4">
          <ChatInput
            onSend={handleChatMessage}
            disabled={isLoading}
            placeholder="Answer the Oracle's questions honestly..."
          />
        </div>

        {conversationTurns >= 2 && !currentIdea.verdict && (
          <div className="text-center text-sm font-mono text-muted-foreground">
            Oracle is ready to judge. Send your final response.
          </div>
        )}
      </div>
    </div>
  );
}

