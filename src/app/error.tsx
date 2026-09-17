"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-2xl bg-secondary/50 border border-border max-w-md space-y-4 shadow-lg">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-xs text-muted-foreground">
          {error?.message || "An unexpected error occurred in the workspace application."}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 mx-auto shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    </div>
  );
}
