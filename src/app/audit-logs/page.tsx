"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AuditLog } from "@/types";
import { formatDate } from "@/lib/utils";
import { History, Shield } from "lucide-react";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.3 } },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch("/api/audit-logs");
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar breadcrumb={[{ label: "Log Audit" }]} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          <motion.div
            className="pb-4 border-b border-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Log Audit Aktivitas</h1>
            <p className="text-sm text-text-secondary mt-1">
              Catatan jejak audit seluruh aktivitas pembuatan, perubahan, dan penghapusan data formulir.
            </p>
          </motion.div>

          <motion.div
            className="bg-surface border border-border rounded-[8px] overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted border-b border-border text-xs uppercase font-mono text-text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold w-44">Waktu</th>
                  <th className="py-3 px-4 font-semibold w-40">Pengguna</th>
                  <th className="py-3 px-4 font-semibold w-32">Aksi</th>
                  <th className="py-3 px-4 font-semibold w-32">Entitas</th>
                  <th className="py-3 px-4 font-semibold">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-xs">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="h-12 animate-pulse">
                      <td className="py-3 px-4">
                        <div className="w-28 h-3.5 bg-muted/60 rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24 h-4 bg-muted/80 rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-16 h-5 bg-muted/70 rounded-full" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-16 h-3.5 bg-muted/60 rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-48 h-3.5 bg-muted/50 rounded" />
                      </td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary font-sans">
                      Belum ada log audit.
                    </td>
                  </tr>
                ) : (
                    <AnimatePresence>
                    {logs.map((log) => {
                      const getActionBadge = (act: string) => {
                        const a = act.toLowerCase();
                        if (a.includes("create") || a.includes("insert") || a.includes("publish")) {
                          return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400";
                        }
                        if (a.includes("delete") || a.includes("remove")) {
                          return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400";
                        }
                        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400";
                      };

                      return (
                        <motion.tr
                          key={log.id}
                          variants={rowVariants}
                          initial="hidden"
                          animate="show"
                          className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all h-12 group"
                        >
                          <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </td>
                          <td className="py-3 px-4 text-text-primary font-semibold group-hover:text-blue-600 transition-colors">
                            {log.actor_name || "Admin"}
                          </td>
                          <td className="py-3 px-4 uppercase text-text-primary">
                            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getActionBadge(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-text-secondary font-medium">{log.entity}</td>
                          <td className="py-3 px-4 text-text-secondary truncate max-w-xs font-sans text-xs">
                            {log.meta ? JSON.stringify(log.meta) : "-"}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
