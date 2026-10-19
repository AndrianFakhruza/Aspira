"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar breadcrumb={[{ label: "Dashboard" }]} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 animate-pulse">
          {/* Welcome Banner Skeleton */}
          <div className="p-6 rounded-[12px] bg-surface border border-border space-y-3">
            <div className="w-56 h-7 bg-muted/80 rounded" />
            <div className="w-96 h-4 bg-muted/50 rounded" />
          </div>

          {/* 4 KPI Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 bg-surface border border-border rounded-[10px] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-24 h-4 bg-muted/70 rounded" />
                  <div className="w-8 h-8 bg-muted/60 rounded-lg" />
                </div>
                <div className="w-16 h-8 bg-muted/80 rounded" />
                <div className="w-32 h-3 bg-muted/50 rounded" />
              </div>
            ))}
          </div>

          {/* Recent Forms Table Skeleton */}
          <div className="bg-surface border border-border rounded-[10px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-40 h-5 bg-muted/80 rounded" />
              <div className="w-24 h-4 bg-muted/60 rounded" />
            </div>
            <div className="space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded-[8px] flex items-center justify-between px-4">
                  <div className="w-48 h-4 bg-muted/70 rounded" />
                  <div className="w-16 h-6 bg-muted/60 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

