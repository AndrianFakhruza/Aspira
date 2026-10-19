"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Form, FormStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import { formTemplates } from "@/lib/storage/mock-data";
import {
  Plus,
  Search,
  ExternalLink,
  Edit,
  BarChart3,
  Copy,
  Trash2,
  Table as TableIcon,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.35 } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.2 } },
};

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchForms = async () => {
    try {
      const res = await fetch("/api/forms");
      const data = await res.json();
      if (data.forms) {
        setForms(data.forms);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleDuplicate = async (id: string) => {
    if (confirm("Duplikasi formulir ini?")) {
      setActionLoading(true);
      await fetch(`/api/forms/${id}/duplicate`, { method: "POST" });
      await fetchForms();
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus formulir "${title}" beserta seluruh responsnya?`)) {
      setActionLoading(true);
      await fetch(`/api/forms/${id}`, { method: "DELETE" });
      await fetchForms();
      setActionLoading(false);
    }
  };

  const handleCreateFromTemplate = async (template: typeof formTemplates[0]) => {
    setActionLoading(true);
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...template.form,
        fields: template.fields,
      }),
    });
    const data = await res.json();
    setTemplateDialogOpen(false);
    setActionLoading(false);
    if (data.form?.id) {
      window.location.href = `/forms/${data.form.id}/edit`;
    }
  };

  const filteredForms = forms.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusButtonClass = (st: string) => {
    const isActive = statusFilter === st;
    if (!isActive) {
      return "bg-surface text-text-secondary border-border hover:border-indigo-300 hover:text-indigo-600 hover:-translate-y-0.5 hover:shadow-xs";
    }
    switch (st) {
      case "published":
        return "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/25";
      case "draft":
        return "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25";
      case "closed":
        return "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/25";
      default:
        return "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar breadcrumb={[{ label: "Formulir" }]} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Daftar Formulir</h1>
              <p className="text-sm text-text-secondary mt-1">
                Kelola survei, kuota respons, dan lihat pratinjau form publik Anda.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2 border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                onClick={() => setTemplateDialogOpen(true)}
              >
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[2] animate-pulse" />
                Template Siap Pakai
              </Button>
              <Link href="/forms/new">
                <Button className="gap-2 shadow-md hover:shadow-indigo-500/25">
                  <Plus className="w-4 h-4 stroke-[2]" />
                  Form Kosong
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Filter & Search Bar */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary group-focus-within:text-indigo-600 transition-colors stroke-[1.5]" />
              <input
                type="text"
                placeholder="Cari berdasarkan judul form..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-surface text-text-primary border border-border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "all", label: "Semua Status" },
                { id: "published", label: "Aktif" },
                { id: "draft", label: "Draft" },
                { id: "closed", label: "Ditutup" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${getStatusButtonClass(
                    st.id
                  )}`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Forms Table */}
          <motion.div
            className="bg-surface border border-border rounded-[10px] overflow-hidden shadow-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-muted/70 border-b border-border text-xs uppercase font-mono text-text-secondary sticky top-0">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Formulir</th>
                    <th className="py-3 px-4 font-semibold w-32">Status</th>
                    <th className="py-3 px-4 font-semibold w-28">Respons</th>
                    <th className="py-3 px-4 font-semibold w-36">Dibuat</th>
                    <th className="py-3 px-4 font-semibold text-right w-64">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-text-secondary">
                        <div className="inline-flex items-center gap-2 text-indigo-600 font-medium">
                          <span className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
                          Memuat daftar formulir...
                        </div>
                      </td>
                    </tr>
                  ) : filteredForms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-text-secondary">
                        Tidak ada formulir yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      <motion.tbody
                        key={statusFilter + search}
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="divide-y divide-border"
                      >
                        {filteredForms.map((form) => (
                          <motion.tr
                            key={form.id}
                            variants={rowVariants}
                            exit="exit"
                            layout
                            className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all h-14 group"
                            whileHover={{ x: 5, transition: { duration: 0.15 } }}
                          >
                            <td className="py-3 px-4">
                              <div className="font-semibold text-text-primary group-hover:text-indigo-600 transition-colors">
                                <Link href={`/forms/${form.id}/edit`} className="hover:underline">
                                  {form.title}
                                </Link>
                              </div>
                              <div className="text-xs text-text-secondary line-clamp-1 font-mono">
                                /{form.slug}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={form.status} />
                            </td>
                            <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              {form.responses_count || 0}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-text-secondary">
                              {formatDate(form.created_at)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {form.status === "published" && (
                                  <Link href={`/f/${form.slug}`} target="_blank">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      title="Lihat Form Publik"
                                      className="hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
                                    </Button>
                                  </Link>
                                )}
                                <Link href={`/forms/${form.id}/responses`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    title="Tabel Respons"
                                    className="hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50"
                                  >
                                    <TableIcon className="w-3.5 h-3.5 mr-1" />
                                    Respons
                                  </Button>
                                </Link>
                                <Link href={`/forms/${form.id}/analytics`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    title="Laporan Analisis"
                                    className="hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/50"
                                  >
                                    <BarChart3 className="w-3.5 h-3.5 mr-1" />
                                    Analisis
                                  </Button>
                                </Link>
                                <Link href={`/forms/${form.id}/edit`}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    title="Edit Builder"
                                    className="hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50"
                                  >
                                    <Edit className="w-3.5 h-3.5 stroke-[1.5]" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title="Duplikasi"
                                  onClick={() => handleDuplicate(form.id)}
                                  className="hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                                >
                                  <Copy className="w-3.5 h-3.5 stroke-[1.5]" />
                                </Button>
                                <Button
                                  variant="danger"
                                  size="icon"
                                  title="Hapus"
                                  onClick={() => handleDelete(form.id, form.title)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </motion.tbody>
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Template Chooser Dialog */}
      <Dialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        title="Pilih Template Formulir"
        description="Gunakan struktur siap pakai untuk membuat kuesioner dengan cepat."
      >
        <motion.div
          className="space-y-4 py-2"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {formTemplates.map((template, idx) => (
            <motion.div
              key={idx}
              variants={rowVariants}
              className="p-4 border border-border rounded-[10px] hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer space-y-2 bg-surface group"
              onClick={() => handleCreateFromTemplate(template)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-text-primary group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {template.name}
                </h4>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {template.fields.length} pertanyaan
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed pl-4">{template.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </Dialog>
    </div>
  );
}
