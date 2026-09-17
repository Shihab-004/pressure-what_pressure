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

interface AuthContextType {
  user: IUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
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
        setUser(data.user);
      }
    } catch (err) {
      console.warn("Failed to fetch user profile:", err);
    }
  }

  // Token provider for authenticated fetch requests
  async function getIdToken(): Promise<string | null> {
    if (isDemoUser) {
      const stored = localStorage.getItem("personal_os_demo_token");
      return stored || "demo-token-engineer";
    }
    if (firebaseUser) {
      return await firebaseUser.getIdToken();
    }
    const storedDemo = typeof window !== "undefined" ? localStorage.getItem("personal_os_demo_token") : null;
    if (storedDemo) return storedDemo;
    return null;
  }

  useEffect(() => {
    // 1. Handle redirect result if user was redirected from Google Sign-In on mobile
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          localStorage.removeItem("personal_os_demo_token");
          setIsDemoUser(false);
          setFirebaseUser(result.user);
          const token = await result.user.getIdToken();
          await fetchUserProfile(token);
        }
      })
      .catch((err) => {
        console.warn("Redirect sign-in error:", err);
      });

    // 2. Check if explicit demo user session was saved in local storage
    const savedDemoToken = localStorage.getItem("personal_os_demo_token");
    if (savedDemoToken) {
      setIsDemoUser(true);
      fetchUserProfile(savedDemoToken).finally(() => setLoading(false));
      return;
    }

    // 3. Subscribe to persistent Firebase Auth state across browser restarts
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsDemoUser(false);
        const token = await fbUser.getIdToken();
        await fetchUserProfile(token);
      } else {
        // Only if demo mode enabled and no user logged in
        if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true" && !user && !savedDemoToken) {
          setIsDemoUser(true);
          const demoToken = "demo-token-engineer";
          localStorage.setItem("personal_os_demo_token", demoToken);
          await fetchUserProfile(demoToken);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
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
      localStorage.removeItem("personal_os_demo_token");
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

        // If local development is running with placeholder API key in demo mode,
        // provide simulated Google authentication so local dev never hangs
        if (
          (popupErr.code === "auth/api-key-not-valid" ||
            popupErr.code === "auth/invalid-api-key" ||
            popupErr.code === "auth/unauthorized-domain") &&
          process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true"
        ) {
          console.warn("Using simulated Google sign-in for demo mode:", popupErr.message);
          const demoGoogleToken = "demo-token-google-user@gmail.com";
          localStorage.setItem("personal_os_demo_token", demoGoogleToken);
          setIsDemoUser(true);
          await fetchUserProfile(demoGoogleToken);
          return;
        }

        throw popupErr;
      }

      if (cred && cred.user) {
        setFirebaseUser(cred.user);
        const token = await cred.user.getIdToken();
        await fetchUserProfile(token);
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        throw new Error("Google sign-in was cancelled (window closed).");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        throw new Error("An account already exists with this email address. Please sign in with your email/password.");
      } else if (err.code === "auth/network-request-failed") {
        throw new Error("Network error. Please check your internet connection.");
      } else {
        throw new Error(err.message || "Google authentication failed.");
      }
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
