"use client";

import { useState } from "react";
import { Task, useTaskStore } from "@/src/stores/taskStore";
import { AGENTS } from "@/src/lib/agents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Trash2, Calendar, User, Tag } from "lucide-react";

export function TaskDetailsDialog({
  task,
  children,
}: {
  task: Task;
  children: React.ReactNode;
}) {
  const { updateTask, deleteTask } = useTaskStore();
  const [open, setOpen] = useState(false);

  const agent = task.assignedTo ? AGENTS[task.assignedTo] : null;

  const handleStatusChange = async (status: Task["status"]) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, status }),
    });
    updateTask(task.id, { status });
    setOpen(false);
  };

  const handleDelete = async () => {
    await fetch(`/api/tasks?id=${task.id}&ideaId=${task.ideaId}`, {
      method: "DELETE",
    });
    deleteTask(task.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 mr-4">
            <DialogTitle className="font-mono text-xl">
              {task.title}
            </DialogTitle>
            <Badge
              variant="outline"
              className={`font-mono ${
                task.priority === "urgent"
                  ? "text-red-500 border-red-500"
                  : task.priority === "high"
                  ? "text-orange-500 border-orange-500"
                  : task.priority === "medium"
                  ? "text-yellow-500 border-yellow-500"
                  : "text-muted-foreground"
              }`}
            >
              {task.priority.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <h4 className="text-sm font-mono text-muted-foreground">
              DESCRIPTION
            </h4>
            <p className="font-mono text-sm whitespace-pre-wrap">
              {task.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                <User className="h-3 w-3" /> ASSIGNEE
              </h4>
              {agent ? (
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span>{agent.emoji}</span>
                  <span>{agent.name}</span>
                </div>
              ) : (
                <span className="font-mono text-sm text-muted-foreground">
                  Unassigned
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" /> CREATED
              </h4>
              <span className="font-mono text-sm">
                {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                <Tag className="h-3 w-3" /> TAGS
              </h4>
              <div className="flex gap-2 flex-wrap">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="font-mono text-xs"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex !justify-between items-center mt-6 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive font-mono"
          >
            <Trash2 className="h-4 w-4 mr-2" /> DELETE
          </Button>

          <div className="flex gap-2">
            {task.status !== "todo" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("todo")}
                className="font-mono"
              >
                TODO
              </Button>
            )}
            {task.status !== "in-progress" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("in-progress")}
                className="font-mono text-blue-500 hover:text-blue-600"
              >
                <Clock className="h-4 w-4 mr-2" /> IN PROGRESS
              </Button>
            )}
            {task.status !== "done" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleStatusChange("done")}
                className="font-mono bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> DONE
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
