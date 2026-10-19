"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-[6px] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-40 disabled:pointer-events-none select-none text-sm active:scale-[0.98] cursor-pointer";

    const variants = {
      primary:
        "bg-primary text-primary-foreground hover:bg-neutral-800 dark:hover:bg-neutral-200 border border-primary shadow-xs hover:shadow-sm",
      secondary:
        "bg-muted text-text-primary hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-transparent",
      outline:
        "border border-border bg-transparent text-text-primary hover:bg-muted hover:border-text-secondary/50",
      ghost:
        "text-text-primary hover:bg-muted border border-transparent",
      danger:
        "border border-neutral-900 bg-transparent text-neutral-900 dark:border-neutral-100 dark:text-neutral-100 font-semibold hover:bg-muted",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
