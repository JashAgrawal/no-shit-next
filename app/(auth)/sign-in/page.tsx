"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authClient.signIn.email({
        email,
        password,
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with Google"
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black opacity-40" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-sm">
            NO SHIT
          </h1>
          <p className="text-zinc-400 text-sm font-medium tracking-wide uppercase">
            Judge your ideas. brutally.
          </p>
        </div>

        <div className="backdrop-blur-xl bg-zinc-900/50 border border-zinc-800/50 p-8 rounded-2xl shadow-2xl ring-1 ring-white/5">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold text-white">Welcome back</h2>
              <p className="text-sm text-zinc-400">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-medium text-zinc-300 uppercase tracking-wider"
                >
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:bg-zinc-900 focus:border-zinc-600 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium text-zinc-300 uppercase tracking-wider"
                  >
                    Password
                  </Label>
                  <Link
                    href="#"
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:bg-zinc-900 focus:border-zinc-600 transition-all duration-200"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black hover:bg-zinc-200 font-medium h-10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-zinc-500 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="outline"
              className="w-full bg-zinc-900/50 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white transition-all duration-200 h-10"
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Google
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-8">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="text-white font-medium hover:underline underline-offset-4 transition-all"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
