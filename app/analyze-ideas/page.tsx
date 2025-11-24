"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIdeaStore } from "@/src/stores/ideaStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Eye } from "lucide-react";

import { useSession } from "@/lib/auth-client";

export default function AnalyzeIdeas() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { ideas, setActiveIdea, deleteIdea, syncFromServer } = useIdeaStore();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!session) return;

    const loadIdeas = async () => {
      try {
        const res = await fetch("/api/ideas");
        if (res.ok) {
          const data = await res.json();
          syncFromServer(data.ideas || []);
        }
      } catch (_) {}
    };
    loadIdeas();
  }, [syncFromServer, session]);

  const getVerdictColor = (verdict: string | null) => {
    switch (verdict) {
      case "FIRE":
        return "text-green-500";
      case "VIABLE":
        return "text-blue-500";
      case "MID":
        return "text-yellow-500";
      case "TRASH":
        return "text-red-500";
      default:
        return "text-zinc-400";
    }
  };

  const getVerdictEmoji = (verdict: string | null) => {
    switch (verdict) {
      case "FIRE":
        return "🔥";
      case "VIABLE":
        return "✅";
      case "MID":
        return "⚠️";
      case "TRASH":
        return "🗑️";
      default:
        return "⏳";
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-mono font-bold">MY IDEAS</h1>
          <div className="w-20" />
        </div>

        {ideas.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl font-mono text-muted-foreground">
              No ideas yet.
            </p>
            <p className="text-sm font-mono text-muted-foreground mt-2">
              Submit your first idea to the Oracle.
            </p>
            <Button onClick={() => router.push("/")} className="mt-6">
              Submit Idea
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map((idea) => (
              <Card key={idea.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl ${getVerdictColor(idea.verdict)}`}
                      >
                        {getVerdictEmoji(idea.verdict)}
                      </span>
                      <CardTitle className="text-lg font-mono">
                        {idea.name}
                      </CardTitle>
                    </div>
                  </div>
                  {idea.verdict && (
                    <p
                      className={`text-sm font-mono font-bold ${getVerdictColor(
                        idea.verdict
                      )}`}
                    >
                      {idea.verdict}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {idea.description}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveIdea(idea.id);
                        if (
                          idea.verdict === "VIABLE" ||
                          idea.verdict === "FIRE"
                        ) {
                          router.push("/dashboard");
                        } else {
                          router.push("/oracle-chat");
                        }
                      }}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!confirm("Delete this idea?")) return;
                        try {
                          const res = await fetch(`/api/ideas?id=${idea.id}`, {
                            method: "DELETE",
                          });
                          if (res.ok) {
                            deleteIdea(idea.id);
                          }
                        } catch (_) {}
                      }}
                      className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
