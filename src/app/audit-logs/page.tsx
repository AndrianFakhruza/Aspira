"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AuditLog } from "@/types";
import { formatDate } from "@/lib/utils";
import { History, Shield } from "lucide-react";

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
          <div className="pb-4 border-b border-border">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Log Audit Aktivitas</h1>
            <p className="text-sm text-text-secondary mt-1">
              Catatan jejak audit seluruh aktivitas pembuatan, perubahan, dan penghapusan data formulir.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
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
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary font-sans">
                      Memuat riwayat aktivitas...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-secondary font-sans">
                      Belum ada log audit.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/40 transition-colors h-12">
                      <td className="py-3 px-4 text-text-secondary whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="py-3 px-4 text-text-primary font-semibold">
                        {log.actor_name || "Admin"}
                      </td>
                      <td className="py-3 px-4 uppercase text-text-primary">
                        <span className="px-2 py-0.5 rounded bg-muted border border-border">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{log.entity}</td>
                      <td className="py-3 px-4 text-text-secondary truncate max-w-xs font-sans">
                        {log.meta ? JSON.stringify(log.meta) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

