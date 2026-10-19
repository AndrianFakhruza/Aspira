import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helpText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helpText, id, rows = 3, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {label}
            {props.required && <span className="ml-1 text-text-primary">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            id={textareaId}
            ref={ref}
            rows={rows}
            className={cn(
              "w-full px-3 py-2 text-sm bg-surface text-text-primary border rounded-[6px] transition-colors placeholder:text-text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:bg-muted font-sans resize-y",
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
Textarea.displayName = "Textarea";

