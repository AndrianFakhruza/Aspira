"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  History,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  workspaceName?: string;
}

export function Sidebar({ workspaceName = "Tanggap" }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Form", href: "/forms", icon: FileText },
    { name: "Anggota", href: "/members", icon: Users },
    { name: "Log Audit", href: "/audit-logs", icon: History },
    { name: "Pengaturan", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col shrink-0 select-none no-print">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border">
        <Link href="/dashboard" className="flex items-center">
          <Logo size="md" />
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary font-semibold">
            Menu Utama
          </p>
        </div>
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-text-secondary hover:text-text-primary hover:bg-muted"
              )}
            >
              <item.icon className="w-4 h-4 stroke-[1.5] shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Workspace Footer */}
      <div className="p-4 border-t border-border bg-background/50">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-text-primary truncate">{workspaceName}</p>
            <p className="text-[11px] text-text-secondary font-mono">v3.0 Production</p>
          </div>
          <Link
            href="/forms"
            title="Daftar Formulir"
            className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-muted"
          >
            <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

