'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIdeaStore } from '@/src/stores/ideaStore';
import { useChatStore } from '@/src/stores/chatStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, XCircle, Sparkles, List, ExternalLink } from 'lucide-react';

export default function LandingClient() {
  const router = useRouter();
  const { ideas, createIdea, setActiveIdea } = useIdeaStore();
  const { addOracleMessage } = useChatStore();
  const [initialIdea, setInitialIdea] = useState('');
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);

  const handleInitialSubmit = async () => {
    if (!initialIdea.trim()) {
      toast.error('Please enter your startup idea');
      return;
    }

    setIsSubmittingIdea(true);

    try {
      // First, create the idea in the database
      const createResponse = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: initialIdea.split('\n')[0].substring(0, 50) || 'New Idea',
          description: initialIdea,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create idea');
      }

      const { idea } = await createResponse.json();
      const ideaId = idea.id;

      // Create idea in local store with the same ID from database
      createIdea({
        name: idea.name,
        description: idea.description,
        assignedAgents: ['oracle'],
        verdict: null,
      }, ideaId);

      // Add user's initial idea as a message
      addOracleMessage(ideaId, {
        role: 'user',
        content: initialIdea,
      });

      // Call API to get Oracle's response
      const response = await fetch('/api/chat/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: initialIdea,
          ideaId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get Oracle response');
      }

      const data = await response.json();

      addOracleMessage(ideaId, {
        role: 'assistant',
        content: data.response,
        agentId: 'oracle',
      });

      // Set as active idea and navigate to Oracle chat
      setActiveIdea(ideaId);
      setInitialIdea('');
      toast.success('Oracle is asking questions. Answer them honestly.');
      router.push('/oracle-chat');

    } catch (error) {
      toast.error('Oracle is offline. Check API configuration.');
      console.error(error);
    } finally {
      setIsSubmittingIdea(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-mono font-bold text-primary mb-4">
            NO SHIT
          </h1>
          <p className="text-2xl font-mono text-foreground">
            Submit your idea to the Oracle.
          </p>
          <p className="text-lg font-mono text-muted-foreground">
            Only the strongest ideas survive.
          </p>
        </div>

        {/* Idea Input */}
        <div className="border border-border p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-mono text-muted-foreground block">
              YOUR STARTUP IDEA
            </label>
            <Textarea
              value={initialIdea}
              onChange={(e) => setInitialIdea(e.target.value)}
              placeholder="Describe your startup idea. Be specific. The Oracle doesn't waste time on vague pitches."
              className="font-mono text-sm min-h-[200px] resize-none"
              disabled={isSubmittingIdea}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleInitialSubmit();
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleInitialSubmit}
              disabled={isSubmittingIdea || !initialIdea.trim()}
              className="text-lg py-6"
              size="lg"
            >
              {isSubmittingIdea ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  ANALYZE IDEA
                </>
              )}
            </Button>

            <Button
              onClick={() => router.push('/analyze-ideas')}
              variant="outline"
              className="text-lg py-6"
              size="lg"
            >
              <List className="mr-2 h-5 w-5" />
              VIEW MY IDEAS
            </Button>
          </div>

          <p className="text-xs font-mono text-muted-foreground text-center">
            Press Cmd/Ctrl + Enter to analyze. The Oracle will judge your idea.
          </p>
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="border border-border p-4">
            <p className="text-2xl font-bold text-foreground">9</p>
            <p className="text-xs font-mono text-muted-foreground">AI Agents</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-2xl font-bold text-foreground">100%</p>
            <p className="text-xs font-mono text-muted-foreground">Brutal Honesty</p>
          </div>
          <div className="border border-border p-4">
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs font-mono text-muted-foreground">Bullshit</p>
          </div>
        </div>

        {/* Idea Graveyard */}
        {ideas.filter(i => i.verdict === 'TRASH' || i.verdict === 'MID').length > 0 && (
          <div className="border border-red-500/30 p-6 space-y-4 bg-red-500/5">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-mono font-bold text-red-500">IDEA GRAVEYARD</h2>
            </div>
            <p className="text-sm font-mono text-zinc-400">
              Your past failures. Learn from them.
            </p>
            <div className="space-y-2">
              {ideas
                .filter(i => i.verdict === 'TRASH' || i.verdict === 'MID')
                .slice(-5)
                .map((idea) => (
                  <div
                    key={idea.id}
                    className="border border-border p-3 bg-card/50 hover:bg-card transition-colors cursor-pointer"
                    onClick={() => router.push('/analyze-ideas')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {idea.verdict === 'TRASH' ? (
                            <span className="text-xs font-mono font-bold text-destructive">🗑️ TRASH</span>
                          ) : (
                            <span className="text-xs font-mono font-bold text-accent">⚠️ MID</span>
                          )}
                          <span className="text-xs font-mono text-muted-foreground">
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm font-mono font-bold text-foreground">{idea.name}</p>
                        <p className="text-xs font-mono text-muted-foreground line-clamp-2 mt-1">
                          {idea.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border pt-6 mt-8">
          <div className="flex items-center justify-center gap-2 text-sm font-mono text-muted-foreground">
            <span>Built by</span>
            <a
              href="https://jashagrawal.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline font-bold inline-flex items-center gap-1"
            >
              Jash Agrawal
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

