"use client";

import { forwardRef } from "react";

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-6 py-3.5 text-[15px]",
  lg: "px-7 py-4 text-base",
};

const variantClasses = {
  primary: "bg-[var(--dark-7)] text-white hover:bg-[var(--grey-24)]",
  secondary: "bg-white text-[var(--dark-7)] border border-[var(--light-85)] hover:bg-[var(--light-96)]",
  outline: "bg-transparent text-[var(--dark-7)] border border-[var(--dark-7)] hover:bg-[var(--dark-7)] hover:text-white",
  ghost: "bg-transparent text-[var(--dark-7)] hover:bg-[var(--light-94)]",
};

export const PillButton = forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ children, variant = "primary", size = "md", className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-full
          font-medium
          whitespace-nowrap
          transition-all
          duration-200
          ease-out
          cursor-pointer
          hover:-translate-y-px
          active:translate-y-0
          disabled:opacity-50
          disabled:cursor-not-allowed
          disabled:hover:translate-y-0
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
