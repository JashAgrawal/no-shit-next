import { useState } from 'react';
import { useIdeaStore } from '@/src/stores/ideaStore';
import { AGENTS } from '@/src/lib/agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AgentBadge } from './AgentBadge';
import { X } from 'lucide-react';

interface IdeaWorkspaceProps {
  onClose: () => void;
}

export function IdeaWorkspace({ onClose }: IdeaWorkspaceProps) {
  const { ideas, activeIdeaId, createIdea, setActiveIdea, deleteIdea, updateIdea, getActiveIdea } = useIdeaStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newIdeaName, setNewIdeaName] = useState('');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');
  
  const activeIdea = getActiveIdea();
  
  const handleCreate = () => {
    if (!newIdeaName.trim()) return;
    
    createIdea({
      name: newIdeaName.trim(),
      description: newIdeaDesc.trim(),
      assignedAgents: ['ceo', 'cto', 'cmo', 'cfo'], // Default agents
      verdict: null,
    });
    
    setNewIdeaName('');
    setNewIdeaDesc('');
    setIsCreating(false);
  };
  
  const toggleAgent = (agentId: string) => {
    if (!activeIdea) return;
    
    const newAgents = activeIdea.assignedAgents.includes(agentId)
      ? activeIdea.assignedAgents.filter(id => id !== agentId)
      : [...activeIdea.assignedAgents, agentId];
    
    updateIdea(activeIdea.id, { assignedAgents: newAgents });
  };
  
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-mono font-bold text-primary">IDEA WORKSPACE</h2>
          <p className="text-xs font-mono text-muted-foreground">Manage your startup ideas</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Ideas List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
              Your Ideas ({ideas.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              + NEW IDEA
            </Button>
          </div>
          
          {isCreating && (
            <div className="border border-accent p-4 space-y-3 bg-background/50">
              <Input
                placeholder="Idea name..."
                value={newIdeaName}
                onChange={(e) => setNewIdeaName(e.target.value)}
                className="font-mono text-sm"
              />
              <Textarea
                placeholder="Quick description..."
                value={newIdeaDesc}
                onChange={(e) => setNewIdeaDesc(e.target.value)}
                className="font-mono text-sm min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!newIdeaName.trim()}>
                  CREATE
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  CANCEL
                </Button>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className={`border p-3 cursor-pointer transition-colors ${
                  activeIdeaId === idea.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setActiveIdea(idea.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-mono font-bold text-sm text-foreground">
                      {idea.name}
                    </h4>
                    {idea.description && (
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {idea.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {idea.assignedAgents.map((agentId) => (
                        <AgentBadge key={agentId} agentId={agentId} />
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteIdea(idea.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            {ideas.length === 0 && !isCreating && (
              <div className="text-center text-muted-foreground font-mono text-sm py-8 border border-dashed border-border">
                No ideas yet. Create one to start.
              </div>
            )}
          </div>
        </div>
        
        {/* Active Idea Details */}
        {activeIdea && (
          <div className="border border-primary/30 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-primary uppercase tracking-wider mb-2">
                Active: {activeIdea.name}
              </h3>
              <p className="text-xs font-mono text-muted-foreground">
                {activeIdea.description || 'No description'}
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider mb-2">
                Assigned Agents
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(AGENTS).map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`p-2 border font-mono text-xs transition-colors ${
                      activeIdea.assignedAgents.includes(agent.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{agent.emoji}</span>
                      <span className="font-bold">{agent.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {activeIdea.context.length > 0 && (
              <div>
                <h4 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider mb-2">
                  Shared Context ({activeIdea.context.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeIdea.context.map((ctx, idx) => (
                    <div key={idx} className="border-l-2 border-accent pl-3 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AgentBadge agentId={ctx.agentId} />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(ctx.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-foreground">
                        {ctx.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
