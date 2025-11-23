'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIdeaStore } from '@/src/stores/ideaStore';
import { useChatStore } from '@/src/stores/chatStore';
import { ChatMessage } from '@/src/components/ChatMessage';
import { ChatInput } from '@/src/components/ChatInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DashboardHome() {
  const router = useRouter();
  const { activeIdeaId, getActiveIdea } = useIdeaStore();
  const { getHivemindMessages, addHivemindMessage, clearHivemindChat, isLoading, setLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messages = useChatStore((state) => {
    if (!activeIdeaId) return [] as ReturnType<typeof getHivemindMessages>;
    return state.hivemindChats[activeIdeaId] || [];
  });

  useEffect(() => {
    const idea = getActiveIdea();
    if (!idea) router.push('/analyze-ideas');
  }, [getActiveIdea, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingMessage]);

  // Hydrate hivemind chat history from server
  useEffect(() => {
    const fetchHistory = async () => {
      if (!activeIdeaId) return;
      try {
        const res = await fetch(`/api/messages?ideaId=${activeIdeaId}&chatType=hivemind`);
        if (res.ok) {
          const data = await res.json();
          useChatStore.getState().syncFromServer(activeIdeaId, 'hivemind', data.messages || []);
        }
      } catch {}
    };
    fetchHistory();
  }, [activeIdeaId]);

  // const handleSend = async (content: string) => {
  //   if (!activeIdeaId) {
  //     toast.error('No active idea selected');
  //     return;
  //   }

  //   addHivemindMessage(activeIdeaId, { role: 'user', content });
  //   setLoading(true);
  //   setStreamingMessage('');

  //   try {
  //     const response = await fetch('/api/chat/hivemind', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ message: content, ideaId: activeIdeaId, conversationHistory: messages }),
  //     });
  //     if (!response.ok || !response.body) throw new Error('Failed');
  //     const reader = response.body.getReader();
  //     const decoder = new TextDecoder();
  //     let full = '';
  //     let routedAgentId: string | undefined = undefined;
  //     let buffer = '';
  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;
  //       buffer += decoder.decode(value, { stream: true });
  //       let lineBreakIndex;
  //       while ((lineBreakIndex = buffer.indexOf('\n')) !== -1) {
  //         const line = buffer.slice(0, lineBreakIndex).trimEnd();
  //         buffer = buffer.slice(lineBreakIndex + 1);
  //         if (line.startsWith('data: ')) {
  //           try {
  //             const data = JSON.parse(line.slice(6));
  //             if (data.route && data.agentId) {
  //               routedAgentId = data.agentId as string;
  //             }
  //             if (data.chunk) {
  //               full += data.chunk;
  //               setStreamingMessage(full);
  //             }
  //             if (data.done) {
  //               addHivemindMessage(activeIdeaId, { role: 'assistant', content: full, agentId: routedAgentId });
  //               setStreamingMessage('');
  //             }
  //           } catch {}
  //         }
  //       }
  //     }
  //     // Flush any remaining buffered line
  //     const rem = buffer.trim();
  //     if (rem.startsWith('data: ')) {
  //       try {
  //         const data = JSON.parse(rem.slice(6));
  //         if (data.route && data.agentId) routedAgentId = data.agentId as string;
  //         if (data.chunk) {
  //           full += data.chunk;
  //           setStreamingMessage(full);
  //         }
  //         if (data.done) {
  //           addHivemindMessage(activeIdeaId, { role: 'assistant', content: full, agentId: routedAgentId });
  //           setStreamingMessage('');
  //         }
  //       } catch {}
  //     }
  //   } catch {
  //     toast.error('HiveMind is offline. Check API configuration.');
  //     setStreamingMessage('');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const handleSend = async (content: string) => {
    if (!activeIdeaId) {
      toast.error('No active idea selected');
      return;
    }

    addHivemindMessage(activeIdeaId, { role: 'user', content });
    setLoading(true);
    setStreamingMessage('');

    try {
      const response = await fetch('/api/chat/hivemind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, ideaId: activeIdeaId, conversationHistory: messages }),
      });
      if (!response.ok || !response.body) throw new Error('Failed to get streaming response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let routedAgentId: string | undefined = undefined;
      let buffer = '';
      let streamDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let lineBreakIndex;

        // Process all complete lines in the buffer
        while ((lineBreakIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, lineBreakIndex).trimEnd();
          buffer = buffer.slice(lineBreakIndex + 1);

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.route && data.agentId) {
                routedAgentId = data.agentId as string;
              }
              
              if (data.chunk) {
                full += data.chunk;
                setStreamingMessage(full);
              }
              
              if (data.done) {
                // Final message received, add to store and reset streaming state
                addHivemindMessage(activeIdeaId, { role: 'assistant', content: full, agentId: routedAgentId });
                setStreamingMessage('');
                streamDone = true;
              }
            } catch (e) {
              console.error('Error parsing streaming JSON line:', e, line);
              // Silently ignore parsing errors for non-critical lines
            }
          }
        }
        if (streamDone) break;
      }
      
      // No extra flush; we rely on newline-delimited events and done flag

    } catch (e) {
      console.error('Streaming API call failed:', e);
      toast.error('HiveMind is offline. Check API configuration.');
      setStreamingMessage('');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground font-mono text-sm py-12 space-y-4">
            <p className="text-lg font-bold text-primary">🧠 HIVEMIND ACTIVE</p>
            <p>AI Delegator routes your questions to the right expert.</p>
            <p className="text-xs">9 agents ready. Ask anything.</p>
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-xs">
              <div className="border border-border p-2">👔 CEO</div>
              <div className="border border-border p-2">⚡ CTO</div>
              <div className="border border-border p-2">🎨 CMO</div>
              <div className="border border-border p-2">💰 CFO</div>
              <div className="border border-border p-2">🎤 Pitch</div>
              <div className="border border-border p-2">⚖️ Legal</div>
              <div className="border border-border p-2">📈 Growth</div>
              <div className="border border-border p-2">🧠 Psych</div>
              <div className="border border-border p-2">🎯 Ops</div>
            </div>
          </div>
        )}
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} onResend={handleSend} isResending={isLoading} />
          ))}
          {streamingMessage && (
            <ChatMessage
              message={{ id: 'stream', role: 'assistant', content: streamingMessage, timestamp: Date.now() }}
            />
          )}
          {isLoading && !streamingMessage && (
            <div className="font-mono text-sm text-muted-foreground animate-pulse">
              🎯 HiveMind Delegator analyzing request...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <div className="flex-1">
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => { 
              if (activeIdeaId) { 
                clearHivemindChat(activeIdeaId); 
                setStreamingMessage(''); 
                try {
                  await fetch(`/api/messages?ideaId=${activeIdeaId}&chatType=hivemind`, {
                    method: 'DELETE',
                  });
                  toast.success('Hivemind chat cleared');
                } catch (error) {
                  console.error('Failed to clear hivemind chat:', error);
                  toast.error('Failed to clear chat from server');
                }
              } 
            }}
            disabled={!activeIdeaId}
          >
            CLEAR
          </Button>
        </div>
      </div>
    </div>
  );
}
