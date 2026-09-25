"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/db/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated, forward to dashboard
  React.useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            window.location.href = "/";
          }
        }
      } catch {}
    }
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase && isSupabaseConfigured) {
        let { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        // If email confirmation is required by Supabase, auto-verify via admin and retry
        if (error && error.message?.toLowerCase().includes("confirm")) {
          try {
            const confirmRes = await fetch("/api/auth/auto-confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email.trim() }),
            });
            if (confirmRes.ok) {
              const retry = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
              });
              data = retry.data;
              error = retry.error;
            }
          } catch {
            // fallback to showing original error
          }
        }

        if (error) throw error;

        // Clear demo cookie so real user session is active
        document.cookie = "knowdrive_demo_session=; path=/; max-age=0";
        toast.success("Successfully signed in!");
        window.location.href = "/";
        return;
      }

      // Demo fallback mode if Supabase is not configured
      document.cookie = "knowdrive_demo_session=true; path=/; max-age=86400; SameSite=Lax";
      toast.success("Entering KnowDrive (Demo Mode)!");
      window.location.href = "/";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    // Set demo session cookie for guest/evaluator exploration
    document.cookie = "knowdrive_demo_session=true; path=/; max-age=86400; SameSite=Lax";
    toast.success("Entering KnowDrive Student Demo Workspace!");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Student Portfolio Showcase */}
      <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-between bg-card border-r border-border text-foreground relative">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-foreground">KnowDrive</span>
              <span className="block text-xs text-muted-foreground">Student Portfolio Project</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Personal Document Drive + AI Knowledge Assistant
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-foreground">
            Your files, organized <br />
            and understood with AI.
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            KnowDrive combines personal cloud document storage with RAG intelligence. Upload course notes, project specs, and technical papers, then search and reason across them with verified page citations.
          </p>

          <div className="space-y-3 pt-2 text-xs md:text-sm text-foreground">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Multi-document cross-file reasoning with Google Gemini</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Clickable citations that jump directly to document pages</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>PostgreSQL & pgvector 768-dim embeddings with Supabase</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>Student portfolio build &bull; 100% Free-tier compatible</span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center max-w-md mx-auto">
        <div className="space-y-2 mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign In</h2>
          <p className="text-sm text-muted-foreground">
            Access your personal workspace or try the student demo.
          </p>
        </div>

        {/* Demo Fast Track Button */}
        <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-2.5">
          <p className="text-xs font-semibold text-primary">
            Grading, evaluating, or recruiting?
          </p>
          <Button
            type="button"
            onClick={handleDemoAccess}
            variant="brand"
            className="w-full h-10 text-xs font-semibold rounded-xl shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Explore Demo Workspace Instantly
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Pre-loaded with sample docs and folders. No account required.
          </p>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or with Supabase account</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.chen@student.portfolio"
              icon={<Mail className="w-4 h-4" />}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Password</label>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              required
            />
          </div>

          <Button type="submit" variant="default" className="w-full h-10 rounded-xl" isLoading={loading}>
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
