"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Workspace } from "@/types";
import { Save, ShieldCheck, Database, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.workspace) {
          setWorkspace(data.workspace);
          setName(data.workspace.name);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
      }
    } catch (err) {
      alert("Gagal memperbarui pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar workspaceName={workspace?.name} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar breadcrumb={[{ label: "Pengaturan" }]} />

        <main className="flex-1 p-6 md:p-8 max-w-4xl w-full mx-auto space-y-8">
          <motion.div
            className="pb-4 border-b border-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Pengaturan Workspace
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Konfigurasi identitas organisasi, database Supabase, dan metadata aplikasi.
            </p>
          </motion.div>

          <form onSubmit={handleSave} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Identitas Organisasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Nama Organisasi / Lembaga"
                    placeholder="Contoh: Tanggap Media Lab"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    helpText="Nama organisasi ini akan ditampilkan pada kop dan workspace Anda. Tidak di-hardcode."
                    required
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Infrastruktur &amp; Keamanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-text-secondary">
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-[6px] border border-border">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-text-primary" />
                      <div>
                        <p className="font-semibold text-text-primary">Database Supabase Postgres</p>
                        <p className="font-mono text-[11px]">Skema &amp; RLS Terisolasi</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-text-primary">
                      Siap Produksi
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-[6px] border border-border">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-text-primary" />
                      <div>
                        <p className="font-semibold text-text-primary">Keamanan Cookie Sesi Server</p>
                        <p className="font-mono text-[11px]">httpOnly, Secure, Lax</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface border border-border text-text-primary">
                      Aktif
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex items-center justify-between pt-2">
              <AnimatePresence>
                {savedNotice && (
                  <motion.div
                    className="flex items-center gap-1.5 text-xs font-mono text-text-primary"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pengaturan berhasil diperbarui.</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="ml-auto">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="w-4 h-4 stroke-[1.5]" />
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
