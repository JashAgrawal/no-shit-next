'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Task {
  id: string;
  ideaId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  tags?: string[];
}

interface TaskState {
  tasks: Task[];
  
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (taskId: string) => void;
  getTask: (taskId: string) => Task | undefined;
  
  getTasksByIdea: (ideaId: string) => Task[];
  getTasksByStatus: (ideaId: string, status: Task['status']) => Task[];
  getTasksByAgent: (ideaId: string, agentId: string) => Task[];
  
  syncFromServer: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));

        return newTask.id;
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updatedAt: Date.now() }
              : task
          ),
        }));
      },

      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
        }));
      },

      getTask: (taskId) => {
        const state = get();
        return state.tasks.find((task) => task.id === taskId);
      },

      getTasksByIdea: (ideaId) => {
        const state = get();
        return state.tasks
          .filter((task) => task.ideaId === ideaId)
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },

      getTasksByStatus: (ideaId, status) => {
        const state = get();
        return state.tasks
          .filter((task) => task.ideaId === ideaId && task.status === status)
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },

      getTasksByAgent: (ideaId, agentId) => {
        const state = get();
        return state.tasks
          .filter((task) => task.ideaId === ideaId && task.assignedTo === agentId)
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },

      syncFromServer: (tasks) => {
        set({ tasks });
      },
    }),
    {
      name: 'task-storage',
    }
  )
);

