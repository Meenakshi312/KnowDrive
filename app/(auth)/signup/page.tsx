"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, Lock, Mail, User, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/db/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;

        // Auto-confirm newly signed up student account
        await fetch("/api/auth/auto-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }).catch(() => {});

        // Clear any previous demo cookie
        document.cookie = "knowdrive_demo_session=; path=/; max-age=0";

        if (data.session) {
          toast.success("Account created successfully!");
          window.location.href = "/";
        } else {
          // Attempt immediate sign-in with auto-confirmed account
          const signIn = await supabase.auth.signInWithPassword({ email, password });
          if (!signIn.error) {
            toast.success("Account created and verified! Welcome to KnowDrive.");
            window.location.href = "/";
            return;
          }
          toast.success("Account created! You can now log in.");
          window.location.href = "/login";
        }
        return;
      }

      // Demo fallback mode
      document.cookie = "knowdrive_demo_session=true; path=/; max-age=86400; SameSite=Lax";
      toast.success("Account created in demo mode!");
      window.location.href = "/";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign up";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Brain className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create KnowDrive Account</h1>
          <p className="text-xs text-muted-foreground">
            Get 1 GB free personal cloud storage with AI multi-document assistant.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Full Name</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Chen"
              icon={<User className="w-4 h-4" />}
              required
            />
          </div>

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
            <label className="text-xs font-medium text-foreground">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              icon={<Lock className="w-4 h-4" />}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" variant="brand" className="w-full h-10 rounded-xl" isLoading={loading}>
            Create Free Account
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
