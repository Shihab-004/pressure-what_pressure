import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-secondary/60 dark:bg-secondary/40 border border-border/40 relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border/60 bg-card/60 space-y-3 animate-pulse shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-secondary rounded-md" />
        <div className="h-4 w-12 bg-secondary rounded-md" />
      </div>
      <div className="h-4 w-3/4 bg-secondary rounded-md" />
      <div className="flex items-center gap-3 pt-1">
        <div className="h-3 w-16 bg-secondary/70 rounded-md" />
        <div className="h-3 w-20 bg-secondary/70 rounded-md" />
      </div>
    </div>
  );
}

export function ColumnSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-border/60 p-3 min-h-[340px] bg-card/40 space-y-3 animate-pulse">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="space-y-1">
          <div className="h-3 w-12 bg-secondary rounded" />
          <div className="h-3 w-16 bg-secondary/70 rounded" />
        </div>
        <div className="h-4 w-10 bg-secondary rounded" />
      </div>
      <div className="space-y-2 flex-1">
        <div className="h-20 bg-secondary/50 rounded-lg" />
        <div className="h-20 bg-secondary/50 rounded-lg" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 bg-secondary rounded-md" />
        <div className="h-4 w-20 bg-secondary rounded-md" />
      </div>
      <div className="h-64 w-full bg-secondary/40 rounded-xl flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
      </div>
    </div>
  );
}
