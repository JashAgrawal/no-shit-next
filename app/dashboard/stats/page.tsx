'use client';

import { useMemo } from 'react';
import { useIdeaStore } from '@/src/stores/ideaStore';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

export default function IdeaStatsPage() {
  const { ideas, activeIdeaId } = useIdeaStore();
  const activeIdea = useMemo(() => ideas.find((i) => i.id === activeIdeaId), [ideas, activeIdeaId]);

  const totalIdeas = ideas.length;
  const validatedIdeas = ideas.filter((i) => i.validated).length;
  const totalAgentInteractions = ideas.reduce((sum, idea) => sum + idea.context.length, 0);
  const avgAgentsPerIdea = totalIdeas > 0
    ? Math.round(ideas.reduce((sum, idea) => sum + idea.assignedAgents.length, 0) / totalIdeas)
    : 0;

  const stats = [
    { label: 'TOTAL IDEAS', value: totalIdeas, icon: BarChart3, color: 'text-primary' },
    { label: 'VALIDATED', value: validatedIdeas, icon: TrendingUp, color: 'text-accent' },
    { label: 'AGENT INTERACTIONS', value: totalAgentInteractions, icon: Users, color: 'text-foreground' },
    { label: 'AVG AGENTS/IDEA', value: avgAgentsPerIdea, icon: Clock, color: 'text-muted-foreground' },
  ];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="border border-border p-6">
          <h1 className="text-2xl font-mono font-bold text-primary mb-2">📊 IDEA STATISTICS</h1>
          <p className="text-sm font-mono text-muted-foreground">Oracle-approved ideas and agent activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 border-border">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                <span className={`text-3xl font-mono font-bold ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-xs font-mono text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        {activeIdea && (
          <div className="border border-border p-6 space-y-4">
            <h2 className="text-lg font-mono font-bold text-foreground">ACTIVE IDEA</h2>
            <div className="space-y-2">
              <div>
                <span className="text-xs font-mono text-muted-foreground">NAME:</span>
                <p className="text-sm font-mono">{activeIdea.name}</p>
              </div>
              <div>
                <span className="text-xs font-mono text-muted-foreground">DESCRIPTION:</span>
                <p className="text-sm font-mono">{activeIdea.description}</p>
              </div>
              <div>
                <span className="text-xs font-mono text-muted-foreground">ASSIGNED AGENTS:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {activeIdea.assignedAgents.map((agentId) => (
                    <span key={agentId} className="bg-muted px-2 py-1 text-xs font-mono">
                      {agentId.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-mono text-muted-foreground">STATUS:</span>
                <p className={`text-sm font-mono ${activeIdea.validated ? 'text-accent' : 'text-muted-foreground'}`}>
                  {activeIdea.validated ? 'VALIDATED ✓' : 'IN PROGRESS'}
                </p>
              </div>
            </div>
          </div>
        )}

        {ideas.length > 0 && (
          <div className="border border-border p-6 space-y-4">
            <h2 className="text-lg font-mono font-bold text-foreground">ALL IDEAS</h2>
            <div className="space-y-2">
              {ideas.map((idea) => (
                <div key={idea.id} className="border border-border p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono font-bold">{idea.name}</p>
                    <span className={`text-xs font-mono ${idea.validated ? 'text-accent' : 'text-muted-foreground'}`}>
                      {idea.validated ? '✓' : '○'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{idea.description}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {idea.context.length} interactions • {idea.assignedAgents.length} agents
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
