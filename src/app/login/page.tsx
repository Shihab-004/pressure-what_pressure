"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { ShieldCheck, Mail, Key, User, ArrowRight, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login, register, resetPassword, signInWithGoogle, loginDemo } =
    useAuth();

  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // If already authenticated, redirect to Dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  async function handleGoogleSignIn() {
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      toast.success("Successfully authenticated with Google!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!");
        router.push("/");
      } else if (mode === "register") {
        await register(email, password, name);
        toast.success("Account created successfully!");
        router.push("/");
      } else if (mode === "reset") {
        await resetPassword(email);
        toast.info("Password reset email sent. Please check your inbox.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-primary/20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/30">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
            Personal<span className="text-primary">OS</span>
          </div>
          <div className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
            Personal Command Center
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 animate-fadeIn">
        <div className="space-y-1.5 text-center">
          <h1 className="text-xl font-bold text-foreground">
            {mode === "login" && "Sign In to Your Workspace"}
            {mode === "register" && "Create Private Account"}
            {mode === "reset" && "Reset Password"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {mode === "login" && "Access your tasks, academic courses, and roadmap."}
            {mode === "register" && "Start your personal operating system in seconds."}
            {mode === "reset" && "Enter your email to receive recovery instructions."}
          </p>
        </div>

        {/* Continue with Google Button */}
        {mode !== "reset" && (
          <div className="space-y-4">
            <button
              type="button"
              disabled={googleSubmitting || submitting}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-background hover:bg-secondary/70 text-foreground border border-border hover:border-border/90 font-medium rounded-xl text-xs flex items-center justify-center gap-3 shadow-xs transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {googleSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <GoogleIcon className="w-4 h-4" />
              )}
              <span className="font-semibold">Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-border/70" />
              <span className="bg-card px-2 text-[11px] text-muted-foreground uppercase tracking-wider font-mono absolute">
                or continue with email
              </span>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === "register" && (
            <div>
              <label className="block font-medium text-muted-foreground mb-1">Your Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rahman"
                  className="w-full pl-9 pr-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-muted-foreground mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-9 pr-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 text-xs"
              />
            </div>
          </div>

          {mode !== "reset" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-muted-foreground">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 text-xs"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || googleSubmitting}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all text-xs"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === "login" && "Sign In with Email"}
                {mode === "register" && "Create Account"}
                {mode === "reset" && "Send Reset Link"}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                onClick={() => setMode("register")}
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Demo Fast Access for zero-setup evaluation */}
        <div className="pt-2 border-t border-border space-y-2 text-center">
          <span className="text-[11px] text-muted-foreground">Quick test account:</span>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await loginDemo("engineer");
                router.push("/");
              }}
              className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-[11px] text-foreground border border-border"
            >
              Demo Engineer
            </button>
            <button
              type="button"
              onClick={async () => {
                await loginDemo("student");
                router.push("/");
              }}
              className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-[11px] text-foreground border border-border"
            >
              Demo Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
