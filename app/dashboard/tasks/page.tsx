"use client";

import { useEffect, useMemo, useState } from "react";
import { useIdeaStore } from "@/src/stores/ideaStore";
import { useTaskStore, Task } from "@/src/stores/taskStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGENTS } from "@/src/lib/agents";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Trash2,
  Plus,
} from "lucide-react";
import { CreateTaskDialog } from "@/src/components/tasks/CreateTaskDialog";
import { TaskDetailsDialog } from "@/src/components/tasks/TaskDetailsDialog";

export default function TasksPage() {
  const { activeIdeaId } = useIdeaStore();
  const { getTasksByIdea, updateTask, deleteTask, syncFromServer } =
    useTaskStore();
  const [filter, setFilter] = useState<"all" | Task["status"]>("all");

  useEffect(() => {
    const fetchTasks = async () => {
      if (!activeIdeaId) return;
      const res = await fetch(`/api/tasks?ideaId=${activeIdeaId}`);
      if (res.ok) {
        const data = await res.json();
        // API returns DB rows; map minimal fields for store
        const mapped = (data.tasks || []).map((t: any) => ({
          id: t.id,
          ideaId: t.ideaId,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assignedTo: t.assignedTo ?? undefined,
          createdAt: t.createdAt ?? Date.now(),
          updatedAt: t.updatedAt ?? Date.now(),
          dueDate: t.dueDate ?? undefined,
          tags: t.tags ? JSON.parse(t.tags) : undefined,
        }));
        syncFromServer(mapped);
      }
    };
    fetchTasks();
  }, [activeIdeaId, syncFromServer]);

  if (!activeIdeaId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground font-mono">
          No active idea selected
        </p>
      </div>
    );
  }

  const allTasks = getTasksByIdea(activeIdeaId);
  const tasks =
    filter === "all" ? allTasks : allTasks.filter((t) => t.status === filter);

  const statusCounts = {
    all: allTasks.length,
    todo: allTasks.filter((t) => t.status === "todo").length,
    "in-progress": allTasks.filter((t) => t.status === "in-progress").length,
    done: allTasks.filter((t) => t.status === "done").length,
    blocked: allTasks.filter((t) => t.status === "blocked").length,
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return "bg-green-500/10 text-green-500 border-green-500/50";
      case "in-progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/50";
      case "blocked":
        return "bg-red-500/10 text-red-500 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-500 border-red-500/50";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/50";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const markDone = async (id: string) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "done" }),
    });
    updateTask(id, { status: "done" });
  };

  const removeTask = async (id: string) => {
    await fetch(`/api/tasks?id=${id}&ideaId=${activeIdeaId}`, {
      method: "DELETE",
    });
    deleteTask(id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold text-primary">
            📋 TASKS
          </h1>
          <p className="text-sm font-mono text-muted-foreground mt-1">
            Track progress. Get shit done.
          </p>
        </div>
        <CreateTaskDialog />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="font-mono"
        >
          ALL ({statusCounts.all})
        </Button>
        <Button
          variant={filter === "todo" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("todo")}
          className="font-mono"
        >
          TODO ({statusCounts.todo})
        </Button>
        <Button
          variant={filter === "in-progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("in-progress")}
          className="font-mono"
        >
          IN PROGRESS ({statusCounts["in-progress"]})
        </Button>
        <Button
          variant={filter === "done" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("done")}
          className="font-mono"
        >
          DONE ({statusCounts.done})
        </Button>
        <Button
          variant={filter === "blocked" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("blocked")}
          className="font-mono"
        >
          BLOCKED ({statusCounts.blocked})
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="font-mono text-muted-foreground">
              {filter === "all"
                ? "No tasks yet. Assistant will create them automatically, or you can add manually."
                : `No ${filter} tasks.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const agent = task.assignedTo ? AGENTS[task.assignedTo] : null;
            return (
              <TaskDetailsDialog key={task.id} task={task}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-mono font-semibold text-sm">
                              {task.title}
                            </h3>
                            <p className="text-xs font-mono text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status.toUpperCase()}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority.toUpperCase()}
                          </Badge>
                          {agent && (
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {agent.emoji} {agent.name}
                            </Badge>
                          )}
                          {task.tags?.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status !== "done" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              markDone(task.id);
                            }}
                            className="font-mono text-xs"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> DONE
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTask(task.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TaskDetailsDialog>
            );
          })}
        </div>
      )}
    </div>
  );
}
