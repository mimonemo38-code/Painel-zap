import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === "default" && "border-transparent bg-primary text-primary-foreground shadow",
        variant === "success" && "border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        variant === "warning" && "border-transparent bg-amber-500/20 text-amber-400 border-amber-500/30",
        variant === "destructive" && "border-transparent bg-red-500/20 text-red-400 border-red-500/30",
        variant === "outline" && "text-foreground",
        className
      )}
      {...props}
    />
  );
}
