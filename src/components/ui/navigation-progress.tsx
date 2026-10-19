"use client";

import React, { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or search params change, finish progress and hide
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept all link clicks and programmatic navigation events
  useEffect(() => {
    const handleStart = () => {
      setIsNavigating(true);
      setProgress(15);
      const t1 = setTimeout(() => setProgress(45), 100);
      const t2 = setTimeout(() => setProgress(75), 350);
      const t3 = setTimeout(() => setProgress(90), 800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      // Only handle internal links without new tab
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        targetAttr !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          handleStart();
        }
      }
    };

    const handleCustomStart = () => {
      handleStart();
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("app:start-navigation", handleCustomStart);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("app:start-navigation", handleCustomStart);
    };
  }, []);

  return (
    <AnimatePresence>
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
          {/* Glowing Top Progress Line */}
          <div className="h-[3px] w-full bg-blue-100/20 dark:bg-blue-950/20 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.9),0_0_6px_rgba(56,189,248,0.9)]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.25 }}
            />
          </div>

          {/* Floating Subtle Loading Pill */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-2 right-6 bg-surface/95 dark:bg-slate-900/95 backdrop-blur-md border border-blue-500/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium"
          >
            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Memuat halaman...</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Global helper to trigger progress programmatically
export function triggerNavigationProgress() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("app:start-navigation"));
  }
}

