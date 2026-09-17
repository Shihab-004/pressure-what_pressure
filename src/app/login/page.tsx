"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Mail, Key, User, ArrowRight, Loader2 } from "lucide-react";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 web-pattern-bg">
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary via-red-600 to-rose-700 flex items-center justify-center text-white shadow-glow-crimson border border-red-400/40">
          <SpiderLogo className="w-6 h-6 text-white fill-white" glow />
        </div>
        <div>
          <div className="text-2xl font-display font-black tracking-tight text-foreground flex items-center gap-1">
            Personal<span className="text-primary font-black">OS</span>
          </div>
          <div className="text-[10px] uppercase font-display font-bold tracking-widest text-muted-foreground">
            Command Center Access
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md spider-card p-6 sm:p-8 space-y-6 shadow-2xl animate-scaleIn">
        <div className="space-y-1.5 text-center">
          <h1 className="text-xl font-display font-bold text-foreground">
            {mode === "login" && "Sign In to Workspace"}
            {mode === "register" && "Initialize Private Account"}
            {mode === "reset" && "Password Recovery"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {mode === "login" && "Access mission-critical execution plan and roadmap."}
            {mode === "register" && "Start your personalized operating system."}
            {mode === "reset" && "Enter email to receive cryptographic recovery link."}
          </p>
        </div>

        {/* Continue with Google Button */}
        {mode !== "reset" && (
          <div className="space-y-4">
            <button
              type="button"
              disabled={googleSubmitting || submitting}
              onClick={handleGoogleSignIn}
              className="spider-btn-secondary w-full py-3"
            >
              {googleSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <GoogleIcon className="w-4 h-4" />
              )}
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-border/80" />
              <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase tracking-widest font-display font-bold absolute">
                or email credentials
              </span>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === "register" && (
            <div>
              <label className="block font-display font-bold text-muted-foreground mb-1 uppercase text-[10px] tracking-wider">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Operator name"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-secondary/50 border border-border/80 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 text-xs font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-display font-bold text-muted-foreground mb-1 uppercase text-[10px] tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@workspace.io"
                className="w-full pl-10 pr-3.5 py-2.5 bg-secondary/50 border border-border/80 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 text-xs font-sans"
              />
            </div>
          </div>

          {mode !== "reset" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-display font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-[11px] text-primary hover:underline font-semibold font-display"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-secondary/50 border border-border/80 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 text-xs font-sans"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || googleSubmitting}
            className="spider-btn-primary w-full py-3.5"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === "login" && "Authorize & Enter"}
                  {mode === "register" && "Create Account"}
                  {mode === "reset" && "Send Reset Link"}
                </span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>

        {/* Mode Switcher */}
        <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/80">
          {mode === "login" ? (
            <p>
              New user?{" "}
              <button
                onClick={() => setMode("register")}
                className="font-bold text-primary hover:underline font-display"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Existing operator?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-bold text-primary hover:underline font-display"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

        {/* Demo Fast Access for zero-setup evaluation */}
        <div className="pt-2 border-t border-border/80 space-y-2 text-center">
          <span className="text-[10px] text-muted-foreground font-display font-bold uppercase tracking-wider">Quick Session:</span>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={async () => {
                await loginDemo("engineer");
                router.push("/");
              }}
              className="spider-btn-secondary spider-btn-sm text-[11px]"
            >
              Demo Engineer
            </button>
            <button
              type="button"
              onClick={async () => {
                await loginDemo("student");
                router.push("/");
              }}
              className="spider-btn-secondary spider-btn-sm text-[11px]"
            >
              Demo Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
