'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  agentId?: string;
}

interface IdeaChats {
  [ideaId: string]: Message[];
}

interface AgentChats {
  [ideaId: string]: {
    [agentId: string]: Message[];
  };
}

interface ChatState {
  oracleChats: IdeaChats;
  agentChats: AgentChats;
  hivemindChats: IdeaChats;
  boardroomChats: IdeaChats;
  isLoading: boolean;

  addOracleMessage: (ideaId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  getOracleMessages: (ideaId: string) => Message[];
  clearOracleChat: (ideaId: string) => void;

  addAgentMessage: (ideaId: string, agentId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  getAgentMessages: (ideaId: string, agentId: string) => Message[];
  clearAgentChat: (ideaId: string, agentId: string) => void;

  addHivemindMessage: (ideaId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  getHivemindMessages: (ideaId: string) => Message[];
  clearHivemindChat: (ideaId: string) => void;

  addBoardroomMessage: (ideaId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  getBoardroomMessages: (ideaId: string) => Message[];
  clearBoardroomChat: (ideaId: string) => void;

  getAssistantContext: (ideaId: string) => {
    oracle: Message[];
    agents: { [agentId: string]: Message[] };
    hivemind: Message[];
    boardroom: Message[];
  };

  getSharedContext: (ideaId: string) => {
    hivemind: Message[];
    boardroom: Message[];
  };

  setLoading: (loading: boolean) => void;
  deleteIdeaChats: (ideaId: string) => void;
  syncFromServer: (ideaId: string, chatType: string, messages: Message[], agentId?: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      oracleChats: {},
      agentChats: {},
      hivemindChats: {},
      boardroomChats: {},
      isLoading: false,

      addOracleMessage: (ideaId, message) =>
        set((state) => ({
          oracleChats: {
            ...state.oracleChats,
            [ideaId]: [
              ...(state.oracleChats[ideaId] || []),
              {
                ...message,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
              },
            ],
          },
        })),

      getOracleMessages: (ideaId) => {
        const state = get();
        return state.oracleChats[ideaId] || [];
      },

      clearOracleChat: (ideaId) =>
        set((state) => ({
          oracleChats: {
            ...state.oracleChats,
            [ideaId]: [],
          },
        })),

      addAgentMessage: (ideaId, agentId, message) =>
        set((state) => ({
          agentChats: {
            ...state.agentChats,
            [ideaId]: {
              ...(state.agentChats[ideaId] || {}),
              [agentId]: [
                ...((state.agentChats[ideaId]?.[agentId]) || []),
                {
                  ...message,
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  agentId,
                },
              ],
            },
          },
        })),

      getAgentMessages: (ideaId, agentId) => {
        const state = get();
        return state.agentChats[ideaId]?.[agentId] || [];
      },

      clearAgentChat: (ideaId, agentId) =>
        set((state) => ({
          agentChats: {
            ...state.agentChats,
            [ideaId]: {
              ...(state.agentChats[ideaId] || {}),
              [agentId]: [],
            },
          },
        })),

      addHivemindMessage: (ideaId, message) =>
        set((state) => ({
          hivemindChats: {
            ...state.hivemindChats,
            [ideaId]: [
              ...(state.hivemindChats[ideaId] || []),
              {
                ...message,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
              },
            ],
          },
        })),

      getHivemindMessages: (ideaId) => {
        const state = get();
        return state.hivemindChats[ideaId] || [];
      },

      clearHivemindChat: (ideaId) =>
        set((state) => ({
          hivemindChats: {
            ...state.hivemindChats,
            [ideaId]: [],
          },
        })),

      addBoardroomMessage: (ideaId, message) =>
        set((state) => ({
          boardroomChats: {
            ...state.boardroomChats,
            [ideaId]: [
              ...(state.boardroomChats[ideaId] || []),
              {
                ...message,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
              },
            ],
          },
        })),

      getBoardroomMessages: (ideaId) => {
        const state = get();
        return state.boardroomChats[ideaId] || [];
      },

      clearBoardroomChat: (ideaId) =>
        set((state) => ({
          boardroomChats: {
            ...state.boardroomChats,
            [ideaId]: [],
          },
        })),

      getAssistantContext: (ideaId) => {
        const state = get();
        return {
          oracle: state.oracleChats[ideaId] || [],
          agents: state.agentChats[ideaId] || {},
          hivemind: state.hivemindChats[ideaId] || [],
          boardroom: state.boardroomChats[ideaId] || [],
        };
      },

      getSharedContext: (ideaId) => {
        const state = get();
        return {
          hivemind: state.hivemindChats[ideaId] || [],
          boardroom: state.boardroomChats[ideaId] || [],
        };
      },

      setLoading: (loading) => set({ isLoading: loading }),

      deleteIdeaChats: (ideaId) =>
        set((state) => {
          const newOracleChats = { ...state.oracleChats };
          const newAgentChats = { ...state.agentChats };
          const newHivemindChats = { ...state.hivemindChats };
          const newBoardroomChats = { ...state.boardroomChats };

          delete newOracleChats[ideaId];
          delete newAgentChats[ideaId];
          delete newHivemindChats[ideaId];
          delete newBoardroomChats[ideaId];

          return {
            oracleChats: newOracleChats,
            agentChats: newAgentChats,
            hivemindChats: newHivemindChats,
            boardroomChats: newBoardroomChats,
          };
        }),

      syncFromServer: (ideaId, chatType, messages, agentId) => {
        set((state) => {
          if (chatType === 'oracle') {
            return {
              oracleChats: {
                ...state.oracleChats,
                [ideaId]: messages,
              },
            };
          } else if (chatType === 'hivemind') {
            return {
              hivemindChats: {
                ...state.hivemindChats,
                [ideaId]: messages,
              },
            };
          } else if (chatType === 'boardroom') {
            return {
              boardroomChats: {
                ...state.boardroomChats,
                [ideaId]: messages,
              },
            };
          } else if (chatType === 'agent' && agentId) {
            return {
              agentChats: {
                ...state.agentChats,
                [ideaId]: {
                  ...(state.agentChats[ideaId] || {}),
                  [agentId]: messages,
                },
              },
            };
          }
          return state;
        });
      },
    }),
    {
      name: 'noshit-chats-storage',
    }
  )
);


