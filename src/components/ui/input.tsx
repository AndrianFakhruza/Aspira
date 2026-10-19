import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helpText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, label, helpText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {label}
            {props.required && <span className="ml-1 text-text-primary">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full h-9 px-3 text-sm bg-surface text-text-primary border rounded-[6px] transition-colors placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:bg-muted font-sans",
              error ? "border-text-primary border-2" : "border-border",
              className
            )}
            {...props}
          />
        </div>
        {helpText && !error && <p className="text-xs text-text-secondary">{helpText}</p>}
        {error && (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary">
            <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

