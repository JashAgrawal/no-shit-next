'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OracleVerdict = 'TRASH' | 'MID' | 'VIABLE' | 'FIRE' | null;

export interface DashboardData {
  scores: {
    problemClarity: number;
    marketSize: number;
    uniqueness: number;
    businessModel: number;
    executionFeasibility: number;
    overall: number;
  };
  pros: string[];
  cons: string[];
  flags: {
    red: string[];
    yellow: string[];
    green: string[];
  };
  summary: string;
  conclusion: string;
  recommendedPath: string;
}

export interface Idea {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  assignedAgents: string[];
  validated: boolean;
  verdict: OracleVerdict;
  validationData?: {
    problem: string;
    targetMarket: string;
    businessModel: string;
    competitors: string;
    growthPlan: string;
    legalChecks: string;
    fundingNeeds: string;
    prosAndCons: string;
    brutalReview: string;
  };
  dashboardData?: DashboardData;
  context: Array<{
    agentId: string;
    message: string;
    timestamp: number;
  }>;
}

interface IdeaState {
  ideas: Idea[];
  activeIdeaId: string | null;
  createIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'validated' | 'context'>, id?: string) => string;
  updateIdea: (id: string, updates: Partial<Idea>) => void;
  deleteIdea: (id: string) => void;
  setActiveIdea: (id: string | null) => void;
  addContextToIdea: (ideaId: string, agentId: string, message: string) => void;
  getActiveIdea: () => Idea | null;
  syncFromServer: (ideas: Idea[]) => void;
}

export const useIdeaStore = create<IdeaState>()(
  persist(
    (set, get) => ({
      ideas: [],
      activeIdeaId: null,
      
      createIdea: (idea, providedId) => {
        const id = providedId || crypto.randomUUID();
        const newIdea: Idea = {
          ...idea,
          id,
          createdAt: Date.now(),
          validated: false,
          verdict: null,
          context: [],
        };

        set((state) => ({
          ideas: [...state.ideas, newIdea],
          activeIdeaId: id,
        }));

        return id;
      },
      
      updateIdea: (id, updates) => {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === id ? { ...idea, ...updates } : idea
          ),
        }));
      },
      
      deleteIdea: (id) => {
        set((state) => ({
          ideas: state.ideas.filter((idea) => idea.id !== id),
          activeIdeaId: state.activeIdeaId === id ? null : state.activeIdeaId,
        }));
      },
      
      setActiveIdea: (id) => {
        set({ activeIdeaId: id });
      },
      
      addContextToIdea: (ideaId, agentId, message) => {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === ideaId
              ? {
                  ...idea,
                  context: [
                    ...idea.context,
                    {
                      agentId,
                      message,
                      timestamp: Date.now(),
                    },
                  ],
                }
              : idea
          ),
        }));
      },
      
      getActiveIdea: () => {
        const state = get();
        return state.ideas.find((idea) => idea.id === state.activeIdeaId) || null;
      },

      syncFromServer: (ideas) => {
        set({ ideas });
      },
    }),
    {
      name: 'noshit-ideas-storage',
    }
  )
);

