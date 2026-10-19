"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  History,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  workspaceName?: string;
}

const navContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const navItem: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { ease: "easeOut", duration: 0.35 } },
};

export function Sidebar({ workspaceName = "Tanggap" }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Formulir", href: "/forms", icon: FileText },
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
          <p className="text-[10px] font-mono uppercase tracking-wider text-text-secondary/80 font-bold">
            Menu Utama
          </p>
        </div>
        <motion.div variants={navContainer} initial="hidden" animate="show" className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <motion.div key={item.name} variants={navItem}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-200 relative group overflow-hidden",
                    isActive
                      ? "text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                      : "text-text-secondary hover:text-blue-600 hover:translate-x-1.5 hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-0 bg-blue-50/80 dark:bg-blue-950/60 border-l-[3px] border-blue-600 rounded-[8px] -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "w-4 h-4 stroke-[1.75] shrink-0 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-3",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-text-secondary group-hover:text-blue-600"
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Workspace Footer */}
      <div className="p-4 border-t border-border bg-background/50">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-text-primary truncate">{workspaceName}</p>
          </div>
          <Link
            href="/forms"
            title="Daftar Formulir"
            className="text-text-secondary hover:text-blue-600 hover:scale-110 p-1.5 rounded-md hover:bg-blue-50/50 dark:hover:bg-blue-950/40 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
