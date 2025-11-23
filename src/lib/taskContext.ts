import { Task } from '@/src/stores/taskStore';
import { AGENTS } from './agents';

/**
 * Format tasks into a readable context string for AI agents
 */
export function formatTasksForContext(tasks: Task[]): string {
  if (tasks.length === 0) {
    return 'CURRENT TASKS: No tasks yet.';
  }

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    done: tasks.filter(t => t.status === 'done'),
    blocked: tasks.filter(t => t.status === 'blocked'),
  };

  const formatTask = (task: Task) => {
    const agent = task.assignedTo ? AGENTS[task.assignedTo] : null;
    const assignedText = agent ? `, Assigned: ${agent.name}` : '';
    const priorityText = `Priority: ${task.priority.toUpperCase()}`;
    
    return `- ${task.title} (${priorityText}${assignedText})
  ${task.description}`;
  };

  const sections: string[] = ['CURRENT TASKS:'];

  if (tasksByStatus.todo.length > 0) {
    sections.push('\n[TODO]');
    sections.push(tasksByStatus.todo.map(formatTask).join('\n\n'));
  }

  if (tasksByStatus['in-progress'].length > 0) {
    sections.push('\n[IN PROGRESS]');
    sections.push(tasksByStatus['in-progress'].map(formatTask).join('\n\n'));
  }

  if (tasksByStatus.blocked.length > 0) {
    sections.push('\n[BLOCKED]');
    sections.push(tasksByStatus.blocked.map(formatTask).join('\n\n'));
  }

  if (tasksByStatus.done.length > 0) {
    sections.push('\n[DONE]');
    sections.push(tasksByStatus.done.map(formatTask).join('\n\n'));
  }

  return sections.join('\n');
}

