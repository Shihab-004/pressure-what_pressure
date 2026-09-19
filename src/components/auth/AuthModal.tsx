"use client";

import React, { useState } from "react";
import { Key, Mail, User, X, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { SpiderLogo } from "@/components/icons/SpiderLogo";
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
  const [isSwitching, setIsSwitching] = useState(false);

  const {
    login,
    register,
    resetPassword,
    signInWithGoogle,
    loginDemo,
    logout,
    user,
    firebaseUser,
    isDemoUser,
  } = useAuth();

  if (!isOpen) return null;

  const avatarUrl = user?.avatar || firebaseUser?.photoURL;
  const displayName = user?.name || firebaseUser?.displayName || "Operator";
  const displayEmail = user?.email || firebaseUser?.email || "Signed In";

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Successfully authenticated with Google!");
      setIsSwitching(false);
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
        setIsSwitching(false);
        onClose();
      } else if (mode === "register") {
        await register(email, password, name);
        toast.success("Account created successfully!");
        setIsSwitching(false);
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


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md spider-card p-6 sm:p-7 space-y-5 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-red-600 to-rose-700 flex items-center justify-center text-white shadow-glow-crimson-sm border border-red-400/30">
              <SpiderLogo className="w-4 h-4 text-white fill-white" />
            </div>
            <h2 className="text-base font-display font-bold text-foreground">
              {user && !isSwitching
                ? "Active Account Profile"
                : mode === "login"
                ? "Authorize Workspace"
                : mode === "register"
                ? "Initialize Account"
                : "Password Recovery"}
            </h2>
          </div>
          <button
            onClick={() => {
              setIsSwitching(false);
              onClose();
            }}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Authenticated User Profile View */}
        {user && !isSwitching ? (
          <div className="space-y-5 text-center py-2">
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary/20 text-primary border-2 border-primary/50 flex items-center justify-center text-2xl font-display font-black overflow-hidden shadow-glow-crimson mx-auto">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  displayName.charAt(0) || "U"
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card shadow-xs" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-display font-extrabold text-foreground">{displayName}</h3>
              <p className="text-xs font-display text-muted-foreground flex items-center justify-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>{displayEmail}</span>
              </p>
              <div className="pt-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-display font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified Account
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/80 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="spider-btn-primary w-full py-2.5"
              >
                Continue to Workspace
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwitching(true)}
                  className="spider-btn-secondary flex-1 py-2 text-xs"
                >
                  Switch Account
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    toast.success("Signed out successfully");
                    onClose();
                  }}
                  className="spider-btn-secondary flex-1 py-2 text-xs text-red-400 hover:text-red-300 border-red-500/30 hover:border-red-500/60"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Back button if user was already authenticated but wanted to switch */}
            {user && (
              <div className="flex items-center justify-between pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setIsSwitching(false)}
                  className="text-primary hover:underline font-display font-semibold flex items-center gap-1"
                >
                  ← Back to current profile
                </button>
              </div>
            )}

            {/* Google OAuth Button */}
            {mode !== "reset" && (
              <div className="space-y-4">
                <button
                  type="button"
                  disabled={googleLoading || loading}
                  onClick={handleGoogleSignIn}
                  className="spider-btn-secondary w-full py-2.5"
                >
                  {googleLoading ? (
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

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {mode === "register" && (
                <div>
                  <label className="block font-display font-bold text-muted-foreground mb-1 uppercase text-[10px] tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Operator name"
                      className="w-full pl-10 pr-3.5 py-2 bg-secondary/50 border border-border/80 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-sans"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-display font-bold text-muted-foreground mb-1 uppercase text-[10px] tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-3.5 py-2 bg-secondary/50 border border-border/80 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-sans"
                  />
                </div>
              </div>

              {mode !== "reset" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-display font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                      Password
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("reset")}
                        className="text-[10px] text-primary hover:underline font-display"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2 bg-secondary/50 border border-border/80 rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 font-sans"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="spider-btn-primary w-full py-3"
              >
                {loading ? (
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
            <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border/80">
              {mode === "login" ? (
                <p>
                  New operator?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="font-bold text-primary hover:underline font-display"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Existing account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="font-bold text-primary hover:underline font-display"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
