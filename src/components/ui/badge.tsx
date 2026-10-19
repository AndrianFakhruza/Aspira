import React from "react";
import { cn } from "@/lib/utils";
import { Circle, CheckCircle2, Slash } from "lucide-react";
import { FormStatus } from "@/types";

interface BadgeProps {
  status?: FormStatus | "owner" | "editor" | "viewer" | string;
  className?: string;
  children?: React.ReactNode;
}

export function StatusBadge({ status, className }: { status: FormStatus; className?: string }) {
  if (status === "published") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-primary text-primary-foreground border border-primary",
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.5]" />
        Aktif
      </span>
    );
  }

  if (status === "closed") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-muted text-text-secondary line-through border border-border",
          className
        )}
      >
        <Slash className="w-3.5 h-3.5 stroke-[1.5]" />
        Ditutup
      </span>
    );
  }

  // draft
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-xs font-medium bg-transparent text-text-primary border border-border",
        className
      )}
    >
      <Circle className="w-3 h-3 stroke-[1.5] text-text-secondary" />
      Draft
    </span>
  );
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const roleNames: Record<string, string> = {
    owner: "Owner",
    editor: "Editor",
    viewer: "Viewer",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-mono font-medium border border-border text-text-secondary",
        className
      )}
    >
      {roleNames[role] || role}
    </span>
  );
}

