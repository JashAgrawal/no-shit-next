"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIdeaStore } from "@/src/stores/ideaStore";
import { useChatStore } from "@/src/stores/chatStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  Terminal,
  BrainCircuit,
  Gavel,
  Skull,
  TrendingUp,
  Users,
  Zap,
  ShieldAlert,
  ChevronDown,
  History,
} from "lucide-react";
import Link from "next/link";
import { AGENTS } from "@/src/lib/agents";
import { useSession, signOut } from "@/lib/auth-client";

export default function LandingClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const { createIdea, setActiveIdea } = useIdeaStore();
  const { addOracleMessage } = useChatStore();
  const [initialIdea, setInitialIdea] = useState("");
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false);

  const handleInitialSubmit = async () => {
    if (!session) {
      toast.error("ACCESS DENIED: LOGIN REQUIRED");
      router.push("/sign-in");
      return;
    }

    if (!initialIdea.trim()) {
      toast.error("INPUT REQUIRED");
      return;
    }

    setIsSubmittingIdea(true);

    try {
      const createResponse = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: initialIdea.split("\n")[0].substring(0, 50) || "New Idea",
          description: initialIdea,
        }),
      });

      if (!createResponse.ok)
        throw new Error("SYSTEM FAILURE: COULD NOT CREATE IDEA");

      const { idea } = await createResponse.json();
      const ideaId = idea.id;

      createIdea(
        {
          name: idea.name,
          description: idea.description,
          assignedAgents: ["oracle"],
          verdict: null,
        },
        ideaId
      );

      addOracleMessage(ideaId, { role: "user", content: initialIdea });

      const response = await fetch("/api/chat/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: initialIdea, ideaId }),
      });

      if (!response.ok) throw new Error("ORACLE DISCONNECTED");

      const data = await response.json();

      addOracleMessage(ideaId, {
        role: "assistant",
        content: data.response,
        agentId: "oracle",
      });

      setActiveIdea(ideaId);
      setInitialIdea("");
      router.push("/oracle-chat");
    } catch (error) {
      toast.error("SYSTEM ERROR: ORACLE OFFLINE");
      console.error(error);
    } finally {
      setIsSubmittingIdea(false);
    }
  };

  const handleViewIdeas = () => {
    if (!session) {
      toast.error("ACCESS DENIED: LOGIN REQUIRED");
      router.push("/sign-in");
      return;
    }
    router.push("/analyze-ideas");
  };

  const scrollToInput = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const input = document.querySelector("textarea");
    if (input) input.focus();
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Global Effects */}
      <div className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="fixed inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>

      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
          <span className="font-mono font-bold text-lg tracking-tighter">
            NO SHIT
          </span>
        </div>
        <div>
          {session ? (
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="font-mono uppercase tracking-widest text-xs hover:text-primary hover:bg-transparent"
            >
              Logout
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push("/sign-in")}
              className="font-mono uppercase tracking-widest text-xs hover:text-primary hover:bg-transparent"
            >
              Sign In
            </Button>
          )}
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-4 pt-20 border-b border-border/40">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>

        <div className="max-w-4xl w-full space-y-12 z-10 relative text-center">
          <div className="space-y-6 py-6">
            <a
              href="https://www.producthunt.com/products/no-shit?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-no&#0045;shit"
              target="_blank"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1041562&theme=dark&t=1763940181918"
                alt="No&#0032;Shit - Brutal&#0032;oracle&#0032;for&#0032;builders | Product Hunt"
                // style="width: 250px; height: 54px;"
                // style={{
                //   borderRadius: 99,
                // }}
                // width="250"
                // height="54"
                className="w-full h-14 rounded-full"
              />
            </a>
            <div className="inline-block border border-primary/30 bg-primary/5 px-4 py-1 rounded-full backdrop-blur-sm mb-4">
              <span className="text-xs font-mono text-primary tracking-widest uppercase flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                System Online // v1.0.0
              </span>
            </div>

            <h1
              className="text-7xl md:text-9xl font-mono font-black tracking-tighter text-glitch select-none leading-[0.8]"
              data-text="NO SHIT"
            >
              NO SHIT
            </h1>

            <p className="text-xl md:text-3xl font-mono text-muted-foreground tracking-tight max-w-2xl mx-auto">
              The{" "}
              <span className="text-foreground font-bold">
                Startup Judgment Engine
              </span>{" "}
              that destroys weak ideas before the market does.
            </p>
          </div>

          {/* Main Input Area */}
          <div className="max-w-2xl mx-auto space-y-6 text-left">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-destructive to-primary opacity-20 group-hover:opacity-50 transition duration-500 blur-lg"></div>
              <div className="relative bg-black border border-border group-hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    input.txt
                  </span>
                </div>
                <Textarea
                  value={initialIdea}
                  onChange={(e) => setInitialIdea(e.target.value)}
                  placeholder="> My idea is Uber for..."
                  className="font-mono text-lg min-h-[160px] resize-none bg-transparent border-0 focus:ring-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/30 p-6 rounded-none"
                  disabled={isSubmittingIdea}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleInitialSubmit();
                    }
                  }}
                />
              </div>
            </div>

            <Button
              onClick={handleInitialSubmit}
              disabled={isSubmittingIdea || !initialIdea.trim()}
              className="w-full text-xl py-8 font-mono font-bold uppercase tracking-[0.2em] rounded-none border-2 border-primary bg-primary hover:bg-red-600 text-black transition-all hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] active:translate-y-1 relative overflow-hidden group"
              size="lg"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              {isSubmittingIdea ? (
                <span className="flex items-center gap-3 animate-pulse">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  PROCESSING JUDGMENT...
                </span>
              ) : (
                <span className="flex items-center gap-3 relative z-10">
                  <Gavel className="h-6 w-6" />
                  JUDGE MY IDEA
                </span>
              )}
            </Button>

            <Button
              onClick={handleViewIdeas}
              className="w-full bg-black text-xl mt-4 py-8 font-mono font-bold uppercase tracking-[0.2em] rounded-none border-2 border-primary bg-black text-red-600 transition-all hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] active:translate-y-1 relative overflow-hidden group"
              size="lg"
            >
              <div className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>

              <span className="flex items-center gap-3 relative z-10">
                <History className="h-6 w-6" />
                View My Ideas
              </span>
            </Button>

            <p className="text-xs py-24 font-mono text-muted-foreground/50 text-center uppercase tracking-widest">
              [ 100% BRUTAL HONESTY GUARANTEED ]
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 animate-bounce">
          <ChevronDown className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </section>

      {/* --- SOCIAL PROOF (NEGATIVE) --- */}
      <section className="py-12 border-b border-border/40 bg-muted/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <h3 className="text-4xl font-mono font-bold text-foreground">
                12,403
              </h3>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Ideas Destroyed
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-mono font-bold text-primary">0%</h3>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Sugar Coating
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-mono font-bold text-foreground">
                9
              </h3>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Hostile Agents
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-mono font-bold text-foreground">
                $0
              </h3>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Cost to Cry
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- THE PROBLEM --- */}
      <section className="py-24 border-b border-border/40 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8 mb-16">
            <h2 className="text-4xl md:text-5xl font-mono font-bold uppercase tracking-tight">
              Your Friends Are{" "}
              <span className="text-destructive line-through decoration-4 decoration-white">
                Lying
              </span>{" "}
              To You
            </h2>
            <p className="text-xl font-mono text-muted-foreground leading-relaxed">
              "That's a great idea!" — No, it's not. They just don't want to
              hurt your feelings. We don't care about your feelings. We care
              about saving you 6 months of building a product nobody wants.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BrainCircuit className="h-10 w-10 text-primary" />,
                title: "The Oracle",
                desc: "A ruthless gatekeeper that analyzes your raw idea. If it's trash, you don't even get to meet the board.",
              },
              {
                icon: <Users className="h-10 w-10 text-primary" />,
                title: "The Boardroom",
                desc: "9 specialized AI agents (CEO, CTO, CMO...) that will tear your business model apart from every angle.",
              },
              {
                icon: <Skull className="h-10 w-10 text-primary" />,
                title: "The Verdict",
                desc: "Get a clear GO / NO-GO signal. Detailed reports on why you will fail, or how you might actually succeed.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="border border-border bg-card/50 p-8 hover:bg-card hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="mb-6 p-4 bg-background border border-border inline-block group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-mono font-bold mb-4 uppercase">
                  {feature.title}
                </h3>
                <p className="font-mono text-muted-foreground text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MEET THE SQUAD --- */}
      <section className="py-24 border-b border-border/40 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-mono font-black uppercase text-center mb-16">
            Meet The <span className="text-primary">Squad</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(AGENTS).map((agent) => {
              const type = ["ceo", "cto", "cmo", "cfo"].includes(agent.id)
                ? agent.id.toUpperCase()
                : agent.id.charAt(0).toUpperCase() + agent.id.slice(1);

              return (
                <div
                  key={agent.id}
                  className="border border-border bg-card/20 p-6 hover:bg-card/40 transition-all group hover:border-primary/50"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
                    {agent.emoji}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-mono font-bold uppercase text-primary">
                      {agent.name}
                    </h3>
                    <span className="text-xs font-mono text-muted-foreground border border-primary/20 bg-primary/5 px-2 py-0.5 rounded uppercase">
                      {type}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
                    {agent.role}
                  </p>
                  <p className="font-mono text-sm text-muted-foreground line-clamp-3">
                    {agent.personality}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-24 border-b border-border/40 bg-muted/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start gap-12">
            <div className="md:w-1/3 sticky top-24">
              <h2 className="text-4xl md:text-6xl font-mono font-black uppercase leading-none mb-6">
                How It
                <br />
                <span className="text-primary">Hurts</span>
              </h2>
              <p className="font-mono text-muted-foreground">
                Three steps to validation or devastation.
              </p>
            </div>

            <div className="md:w-2/3 space-y-12">
              {[
                {
                  step: "01",
                  title: "Submit Your Pitch",
                  desc: "Paste your raw idea. No formatting needed. Just the raw, unfiltered concept.",
                },
                {
                  step: "02",
                  title: "Survive The Oracle",
                  desc: "Our gatekeeper AI analyzes the core viability. Most ideas die here. If yours is 'MID' or 'TRASH', you're locked out.",
                },
                {
                  step: "03",
                  title: "Face The Board",
                  desc: "If you pass, you unlock the full boardroom. Watch 9 agents debate your future in real-time. Get a GTM plan, tech stack, and logo if you survive.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <span className="text-6xl font-mono font-black text-muted-foreground/20 group-hover:text-primary/20 transition-colors">
                    {item.step}
                  </span>
                  <div className="pt-4">
                    <h3 className="text-2xl font-mono font-bold mb-2 uppercase">
                      {item.title}
                    </h3>
                    <p className="font-mono text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-24 border-b border-border/40">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-mono font-bold text-center mb-16 uppercase">
            <span className="text-primary">Traumatized</span> Users
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "I spent 3 months coding a social network for cats. The Oracle called it 'digital litter' in 3 seconds. Saved me another 6 months.",
                author: "Ex-Founder",
                role: "Now a Barista",
              },
              {
                quote:
                  "I thought my SaaS idea was unique. The CTO agent listed 14 competitors I'd never heard of and told me to learn to farm.",
                author: "Sad Developer",
                role: "Recovering",
              },
              {
                quote:
                  "It actually gave me a viable pivot. The feedback was harsh but the GTM plan was better than what my VC gave me.",
                author: "Anon",
                role: "Series A Founder",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="border border-border p-6 bg-background relative"
              >
                <div className="absolute top-4 right-4 text-4xl text-primary/20 font-serif">
                  "
                </div>
                <p className="font-mono text-sm text-muted-foreground mb-6 relative z-10">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full overflow-hidden border border-border">
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black"></div>
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold uppercase">
                      {t.author}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-mono font-black uppercase mb-8 tracking-tighter">
            Ready to be <span className="text-primary">Judged?</span>
          </h2>
          <p className="text-xl font-mono text-muted-foreground mb-12 max-w-2xl mx-auto">
            It's free. It's fast. It might hurt.
          </p>

          <Button
            onClick={scrollToInput}
            className="text-xl py-8 px-12 font-mono font-bold uppercase tracking-[0.2em] rounded-none border-2 border-foreground text-white bg-transparent hover:bg-foreground hover:text-background transition-all"
            size="lg"
          >
            <Zap className="mr-3 h-6 w-6" />
            START NOW
          </Button>
        </div>
      </section>

      {/* --- ABOUT US --- */}
      <section className="py-24 border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-mono font-bold uppercase mb-8">
            About <span className="text-primary">No Shit</span>
          </h2>
          <p className="font-mono text-lg text-muted-foreground leading-relaxed mb-8">
            We built this because we were tired of "nice" feedback. The startup
            world is filled with toxic positivity that kills dreams slowly. We
            prefer to kill them quickly, so you can move on to the one that
            actually works.
          </p>
          <p className="font-mono text-lg text-muted-foreground leading-relaxed">
            Powered by advanced AI agents with distinct personalities, No Shit
            provides the brutal honesty your friends won't give you.
          </p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-border py-12 bg-black">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4
              className="text-xl font-mono font-black tracking-tighter text-glitch"
              data-text="NO SHIT"
            >
              NO SHIT
            </h4>
            <p className="text-xs font-mono text-muted-foreground mt-2">
              © 2025 Jash Agrawal. All delusions reserved.
            </p>
          </div>

          <div className="flex gap-8 text-xs font-mono text-muted-foreground uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Abuse
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
