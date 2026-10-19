"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Dialog Box */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg bg-background border border-border rounded-[8px] shadow-modal p-6 overflow-hidden max-h-[90vh] flex flex-col",
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">{title}</h2>
            {description && <p className="text-xs text-text-secondary mt-1">{description}</p>}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-muted"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1">{children}</div>
      </div>
    </div>
  );
}

