import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helpText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, helpText, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {label}
            {props.required && <span className="ml-1 text-text-primary">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "w-full h-9 px-3 text-sm bg-surface text-text-primary border rounded-[6px] transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:bg-muted font-sans appearance-none cursor-pointer",
              error ? "border-text-primary border-2" : "border-border",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
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
Select.displayName = "Select";

