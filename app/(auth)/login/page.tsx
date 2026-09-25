"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Lock, Mail, ArrowRight, Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/db/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
          } catch {}
        }

        if (error) throw error;

        document.cookie = "knowdrive_demo_session=; path=/; max-age=0";
        toast.success("Successfully signed in!");
        window.location.href = "/";
        return;
      }

      document.cookie = "knowdrive_demo_session=true; path=/; max-age=86400; SameSite=Lax";
      toast.success("Welcome to KnowDrive!");
      window.location.href = "/";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Ambient background blur elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute -bottom-20 left-1/4 w-[400px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Auth Card */}
      <div className="auth-card">
        {/* Brand & Heading */}
        <div className="text-center space-y-2 mb-6">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sign in to your KnowDrive workspace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Email address
            </label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Password
            </label>
            <div className="auth-input-wrapper">
              <div className="auth-input-icon">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-input-action"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn mt-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch to Sign Up */}
        <div className="mt-6 pt-4 text-center text-xs text-muted-foreground border-t border-border/50">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline ml-1">
            Create an account
          </Link>
        </div>

        {/* Security / Privacy Trust Footer */}
        <div className="mt-4 text-center flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span>Encrypted storage &bull; pgvector retrieval</span>
        </div>
      </div>
    </div>
  );
}
