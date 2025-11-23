"use client";

import { useState } from "react";
import { useTaskStore } from "@/src/stores/taskStore";
import { useIdeaStore } from "@/src/stores/ideaStore";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function CreateTaskDialog() {
  const { addTask } = useTaskStore();
  const { activeIdeaId } = useIdeaStore();
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [assignedTo, setAssignedTo] = useState<string>("assistant");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIdeaId) return;

    const taskId = addTask({
      ideaId: activeIdeaId,
      title,
      description,
      status: "todo",
      priority,
      assignedTo,
    });

    // Persist to DB
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: taskId,
        ideaId: activeIdeaId,
        title,
        description,
        status: "todo",
        priority,
        assignedTo,
      }),
    });

    setOpen(false);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignedTo("assistant");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-mono">
          <Plus className="mr-2 h-4 w-4" />
          NEW TASK
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-mono">Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-mono">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-mono">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="font-mono">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(v: any) => setPriority(v)}
              >
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="font-mono">
                    Low
                  </SelectItem>
                  <SelectItem value="medium" className="font-mono">
                    Medium
                  </SelectItem>
                  <SelectItem value="high" className="font-mono">
                    High
                  </SelectItem>
                  <SelectItem value="urgent" className="font-mono">
                    Urgent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo" className="font-mono">
                Assignee
              </Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="font-mono">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AGENTS).map((agent) => (
                    <SelectItem
                      key={agent.id}
                      value={agent.id}
                      className="font-mono"
                    >
                      {agent.emoji} {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="font-mono w-full">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
