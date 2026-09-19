"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  FirebaseUser,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "@/lib/firebase/client";
import { IUser } from "@/types";
import { toast } from "sonner";

interface AuthContextType {
  user: IUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authReady: boolean;
  isDemoUser: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginDemo: (username?: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseFirebaseAuthError(err: any): string {
  const code = err?.code || "";
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "your deployed domain";

  if (code === "auth/unauthorized-domain") {
    return `Production domain not authorized ("${currentHost}"). In Firebase Console > Authentication > Settings > Authorized domains, click "Add domain" and add "${currentHost}".`;
  }
  if (code === "auth/api-key-not-valid" || code === "auth/invalid-api-key") {
    return "Firebase API Key is missing or invalid. Check that NEXT_PUBLIC_FIREBASE_* variables are configured in your deployment settings (e.g. Vercel dashboard).";
  }
  if (code === "auth/operation-not-allowed") {
    return "Google Sign-In is disabled. In Firebase Console > Authentication > Sign-in method, enable Google.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Google sign-in was cancelled (window closed).";
  }
  if (code === "auth/account-exists-with-different-credential") {
    return "An account already exists with this email. Please sign in with your email/password.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Please check your internet connection.";
  }
  return err?.message || "Google authentication failed. Please try again.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  // Helper to fetch MongoDB User Profile
  async function fetchUserProfile(token: string) {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser((prev) => ({
            ...data.user,
            avatar: data.user.avatar || prev?.avatar || firebaseUser?.photoURL || undefined,
            name: data.user.name || prev?.name || firebaseUser?.displayName || "Operator",
          }));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch user profile:", err);
    }
  }

  // Track auth readiness across startup
  const [authReady, setAuthReady] = useState(false);

  // Token provider for authenticated fetch requests
  async function getIdToken(): Promise<string | null> {
    // If still initializing auth on first mount, wait briefly for Firebase or Demo resolution
    if (loading && typeof window !== "undefined") {
      await new Promise<void>((resolve) => {
        const check = () => {
          if (!loading || auth.currentUser || localStorage.getItem("personal_os_demo_token")) {
            resolve();
          } else {
            setTimeout(check, 50);
          }
        };
        check();
        setTimeout(resolve, 3000); // 3s safety timeout
      });
    }

    if (firebaseUser || auth.currentUser) {
      const activeUser = firebaseUser || auth.currentUser;
      return await activeUser!.getIdToken();
    }
    if (isDemoUser || (typeof window !== "undefined" && localStorage.getItem("personal_os_demo_token"))) {
      const stored = typeof window !== "undefined" ? localStorage.getItem("personal_os_demo_token") : null;
      return stored || null;
    }
    return null;
  }

  useEffect(() => {
    // Purge any stale demo tokens from localStorage so they never hijack real authentication
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("personal_os_demo_token");
        if (stored && process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== "true") {
          localStorage.removeItem("personal_os_demo_token");
        }
      }
    } catch (_) {}

    // 1. Handle redirect result if user was redirected from Google Sign-In on mobile
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          try {
            localStorage.removeItem("personal_os_demo_token");
          } catch (_) {}
          setIsDemoUser(false);
          setFirebaseUser(result.user);
          setUser({
            _id: result.user.uid,
            firebaseUid: result.user.uid,
            email: result.user.email || "",
            name: result.user.displayName || result.user.email?.split("@")[0] || "User",
            avatar: result.user.photoURL || undefined,
            preferences: {
              workDays: [0, 1, 2, 3, 4],
              dailyWorkHours: 5.5,
              theme: "dark",
            },
          } as any);
          const token = await result.user.getIdToken();
          await fetchUserProfile(token);
        }
      })
      .catch((err) => {
        console.warn("Redirect sign-in error:", err);
        toast.error(parseFirebaseAuthError(err));
      });

    // 2. Subscribe to persistent Firebase Auth state across browser restarts
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsDemoUser(false);
        try {
          localStorage.removeItem("personal_os_demo_token");
        } catch (_) {}
        // Optimistically set user with real Google photo and name immediately
        setUser({
          _id: fbUser.uid,
          firebaseUid: fbUser.uid,
          email: fbUser.email || "",
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
          avatar: fbUser.photoURL || undefined,
          preferences: {
            workDays: [0, 1, 2, 3, 4],
            dailyWorkHours: 5.5,
            theme: "dark",
          },
        } as any);
        setLoading(false);
        setAuthReady(true);
        fbUser.getIdToken().then((token) => {
          if (token) fetchUserProfile(token);
        }).catch((err) => console.warn("Failed to get token:", err));
      } else {
        const demoToken = typeof window !== "undefined" ? localStorage.getItem("personal_os_demo_token") : null;
        if (demoToken) {
          setIsDemoUser(true);
          fetchUserProfile(demoToken);
        } else {
          setIsDemoUser(false);
          setUser(null);
        }
        setLoading(false);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  async function login(email: string, pass: string) {
    setLoading(true);
    try {
      localStorage.removeItem("personal_os_demo_token");
      setIsDemoUser(false);
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const token = await cred.user.getIdToken();
      await fetchUserProfile(token);
    } finally {
      setLoading(false);
    }
  }

  async function register(email: string, pass: string, name: string) {
    setLoading(true);
    try {
      localStorage.removeItem("personal_os_demo_token");
      setIsDemoUser(false);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const token = await cred.user.getIdToken();
      // Update name
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      await fetchUserProfile(token);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    try {
      try {
        localStorage.removeItem("personal_os_demo_token");
      } catch (_) {}
      setIsDemoUser(false);

      let cred;
      try {
        cred = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        // If popup is blocked by browser or mobile policy, fallback to redirect
        if (
          popupErr.code === "auth/popup-blocked" ||
          popupErr.code === "auth/cancelled-popup-request"
        ) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }

      if (cred && cred.user) {
        setFirebaseUser(cred.user);
        setUser({
          _id: cred.user.uid,
          firebaseUid: cred.user.uid,
          email: cred.user.email || "",
          name: cred.user.displayName || cred.user.email?.split("@")[0] || "User",
          avatar: cred.user.photoURL || undefined,
          preferences: {
            workDays: [0, 1, 2, 3, 4],
            dailyWorkHours: 5.5,
            theme: "dark",
          },
        } as any);
        const token = await cred.user.getIdToken();
        await fetchUserProfile(token);
      }
    } catch (err: any) {
      throw new Error(parseFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      localStorage.removeItem("personal_os_demo_token");
      setIsDemoUser(false);
      await fbSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  async function loginDemo(username: string = "engineer") {
    setLoading(true);
    try {
      const demoToken = `demo-token-${username}`;
      localStorage.setItem("personal_os_demo_token", demoToken);
      setIsDemoUser(true);
      await fetchUserProfile(demoToken);
    } finally {
      setLoading(false);
    }
  }

  async function refreshProfile() {
    const token = await getIdToken();
    if (token) {
      await fetchUserProfile(token);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        authReady,
        isDemoUser,
        login,
        register,
        signInWithGoogle,
        logout,
        resetPassword,
        loginDemo,
        getIdToken,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
