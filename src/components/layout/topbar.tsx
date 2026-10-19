"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, ChevronRight, User } from "lucide-react";

interface TopbarProps {
  breadcrumb?: { label: string; href?: string }[];
  userName?: string;
  userRole?: string;
}

export function Topbar({ breadcrumb = [], userName = "Admin Utama", userRole = "Owner" }: TopbarProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !isDark;
    setIsDark(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between shrink-0 no-print">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs">
        <Link href="/dashboard" className="text-text-secondary hover:text-text-primary">
          Tanggap
        </Link>
        {breadcrumb.map((item, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-text-secondary stroke-[1.5]" />
            {item.href ? (
              <Link href={item.href} className="text-text-secondary hover:text-text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-text-primary">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right controls: Theme toggle & Profile */}
      <div className="flex items-center space-x-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 text-text-secondary hover:text-text-primary rounded-[6px] border border-border hover:bg-muted transition-colors"
          title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-4 h-4 stroke-[1.5]" />
          ) : (
            <Moon className="w-4 h-4 stroke-[1.5]" />
          )}
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-text-primary">
            <User className="w-3.5 h-3.5 stroke-[1.5]" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-text-primary leading-tight">{userName}</p>
            <p className="text-[10px] font-mono text-text-secondary leading-tight">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

