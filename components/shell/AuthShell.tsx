import * as React from "react";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] flex items-center justify-center p-4">
      <div className={cn("w-full max-w-md", className)}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[hsl(var(--fg))]">LearnMetrics</h1>
          <p className="text-sm text-[hsl(var(--muted-fg))] mt-1">
            Professional learning analytics
          </p>
        </div>

        <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-[var(--radius)] p-8">
          {children}
        </div>
      </div>
    </div>
  );
}