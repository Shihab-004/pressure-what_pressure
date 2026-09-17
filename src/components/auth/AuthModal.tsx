"use client";

import React, { useState } from "react";
import { LogIn, Key, Mail, User, X, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, register, resetPassword, signInWithGoogle, loginDemo } = useAuth();

  if (!isOpen) return null;

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Successfully authenticated with Google!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!");
        onClose();
      } else if (mode === "register") {
        await register(email, password, name);
        toast.success("Account created successfully!");
        onClose();
      } else if (mode === "reset") {
        await resetPassword(email);
        toast.info("Password reset email sent. Check your inbox.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickDemo(username: string) {
    setLoading(true);
    await loginDemo(username);
    setLoading(false);
    toast.success(`Switched to demo user: ${username}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              {mode === "login" && "Sign In to Your Workspace"}
              {mode === "register" && "Create Private Account"}
              {mode === "reset" && "Reset Password"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google OAuth Button (Available on both Login & Register modes) */}
        {mode !== "reset" && (
          <div className="space-y-4">
            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-background hover:bg-secondary/70 text-foreground border border-border/90 hover:border-border font-medium rounded-xl text-xs flex items-center justify-center gap-3 shadow-xs transition-all active:scale-[0.99] disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <GoogleIcon className="w-4 h-4" />
              )}
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-border/70" />
              <span className="bg-card px-2 text-[11px] text-muted-foreground uppercase tracking-wider font-mono absolute">
                or continue with email
              </span>
            </div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === "register" && (
            <div>
              <label className="block font-medium text-muted-foreground mb-1">Your Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rahman"
                  className="w-full pl-9 pr-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-muted-foreground mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full pl-9 pr-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
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
                <Key className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-secondary/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all text-xs"
          >
            {loading ? (
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
        <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border">
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

        {/* Fast Local Demo Switcher */}
        <div className="pt-2 border-t border-border space-y-2 text-center">
          <span className="text-[11px] text-muted-foreground">Or switch local test session:</span>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("engineer")}
              className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-[11px] text-foreground border border-border"
            >
              Demo Engineer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("student")}
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
