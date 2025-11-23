import { AGENTS } from "../lib/agents";

interface AgentBadgeProps {
  agentId: string;
  showFull?: boolean;
}

export function AgentBadge({ agentId, showFull = false }: AgentBadgeProps) {
  const agent = AGENTS[agentId];
  
  if (!agent) return null;
  
  if (showFull) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/30 bg-background/50">
        <span className="text-base">{agent.emoji}</span>
        <div className="flex flex-col">
          <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
            {agent.name}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {agent.role}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-primary/20 bg-background/30">
      <span className="text-sm">{agent.emoji}</span>
      <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider">
        {agent.name}
      </span>
    </div>
  );
}
