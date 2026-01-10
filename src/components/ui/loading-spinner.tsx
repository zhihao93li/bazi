"use client";

import { cn } from "@/lib/utils";

/**
 * LoadingSpinner - Animated loading indicator
 * Implements Requirement 12.4: Loading spinner animation
 */
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "default" | "orange" | "white";
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-8 h-8 border-3",
};

const colorClasses = {
  default: "border-current border-t-transparent",
  orange: "border-[var(--accent-orange)] border-t-transparent",
  white: "border-white border-t-transparent",
};

export function LoadingSpinner({ 
  size = "md", 
  className = "",
  color = "default"
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "inline-block rounded-full animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * LoadingOverlay - Full-screen or container loading overlay
 */
interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  message = "加载中...", 
  className = "" 
}: LoadingOverlayProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      className
    )}>
      <LoadingSpinner size="lg" color="orange" />
      <span className="text-sm text-[var(--text-muted)]">{message}</span>
    </div>
  );
}

/**
 * ButtonLoadingSpinner - Inline spinner for buttons
 */
interface ButtonLoadingSpinnerProps {
  className?: string;
}

export function ButtonLoadingSpinner({ className = "" }: ButtonLoadingSpinnerProps) {
  return (
    <svg 
      className={cn("animate-spin h-5 w-5", className)} 
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
