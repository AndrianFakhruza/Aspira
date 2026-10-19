import React from "react";
import { cn } from "@/lib/utils";
import { Circle, CheckCircle2, Slash, Shield, UserCheck, Eye } from "lucide-react";
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
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-xs hover:scale-105 transition-transform cursor-default",
          className
        )}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Aktif
      </span>
    );
  }

  if (status === "closed") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:scale-105 transition-transform cursor-default",
          className
        )}
      >
        <Slash className="w-3 h-3 stroke-[2] text-rose-500" />
        Ditutup
      </span>
    );
  }

  // draft
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:scale-105 transition-transform cursor-default",
        className
      )}
    >
      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
      Draft
    </span>
  );
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const configs: Record<string, { label: string; styles: string; icon: React.ReactNode }> = {
    owner: {
      label: "Owner",
      styles: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      icon: <Shield className="w-3 h-3 text-purple-600" />,
    },
    editor: {
      label: "Editor",
      styles: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      icon: <UserCheck className="w-3 h-3 text-blue-600" />,
    },
    viewer: {
      label: "Viewer",
      styles: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      icon: <Eye className="w-3 h-3 text-slate-500" />,
    },
  };

  const current = configs[role] || {
    label: role,
    styles: "bg-muted text-text-secondary border-border",
    icon: null,
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border hover:scale-105 transition-transform cursor-default",
        current.styles,
        className
      )}
    >
      {current.icon}
      {current.label}
    </span>
  );
}
