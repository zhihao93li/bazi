"use client";

import { forwardRef } from "react";

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-6 py-2.5 text-base",
  lg: "px-8 py-3.5 text-lg",
};

const variantClasses = {
  primary: "bg-[#1A1A1A] text-white hover:shadow-lg",
  secondary: "bg-transparent border border-black/15 text-[#1A1A1A] hover:bg-black/5",
};

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ children, variant = "primary", size = "md", className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          rounded-full
          font-medium
          transition-all
          duration-200
          ease-out
          hover:-translate-y-0.5
          hover:shadow-xl
          active:translate-y-0
          active:shadow-md
          disabled:opacity-50
          disabled:cursor-not-allowed
          disabled:hover:translate-y-0
          disabled:hover:shadow-none
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PillButton.displayName = "PillButton";
