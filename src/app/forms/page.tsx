"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar breadcrumb={[{ label: "Formulir" }]} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Daftar Formulir</h1>
              <p className="text-sm text-text-secondary mt-1">
                Kelola survei, kuota respons, dan lihat pratinjau form publik Anda.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setTemplateDialogOpen(true)}
              >
                <Sparkles className="w-4 h-4 stroke-[1.5]" />
                Template Siap Pakai
              </Button>
              <Link href="/forms/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4 stroke-[1.5]" />
                  Form Kosong
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary stroke-[1.5]" />
              <input
                type="text"
                placeholder="Cari berdasarkan judul form..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm bg-surface text-text-primary border border-border rounded-[6px] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {["all", "published", "draft", "closed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-colors capitalize ${
                    statusFilter === st
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface text-text-secondary border-border hover:text-text-primary"
                  }`}
                >
                  {st === "all" ? "Semua Status" : st === "published" ? "Aktif" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Forms Table */}
          <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-muted border-b border-border text-xs uppercase font-mono text-text-secondary sticky top-0">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Formulir</th>
                    <th className="py-3 px-4 font-semibold w-28">Status</th>
                    <th className="py-3 px-4 font-semibold w-28">Respons</th>
                    <th className="py-3 px-4 font-semibold w-36">Dibuat</th>
                    <th className="py-3 px-4 font-semibold text-right w-64">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-text-secondary">
                        Memuat daftar formulir...
                      </td>
                    </tr>
                  ) : filteredForms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-text-secondary">
                        Tidak ada formulir yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredForms.map((form) => (
                      <tr key={form.id} className="hover:bg-muted/50 transition-colors h-14">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-text-primary">
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
                        <td className="py-3 px-4 font-mono text-xs">
                          {form.responses_count || 0}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">
                          {formatDate(form.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {form.status === "published" && (
                              <Link href={`/f/${form.slug}`} target="_blank">
                                <Button variant="outline" size="icon" title="Lihat Form Publik">
                                  <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
                                </Button>
                              </Link>
                            )}
                            <Link href={`/forms/${form.id}/responses`}>
                              <Button variant="outline" size="sm" title="Tabel Respons">
                                <TableIcon className="w-3.5 h-3.5 mr-1" />
                                Respons
                              </Button>
                            </Link>
                            <Link href={`/forms/${form.id}/analytics`}>
                              <Button variant="outline" size="sm" title="Laporan Analisis">
                                <BarChart3 className="w-3.5 h-3.5 mr-1" />
                                Analisis
                              </Button>
                            </Link>
                            <Link href={`/forms/${form.id}/edit`}>
                              <Button variant="outline" size="icon" title="Edit Builder">
                                <Edit className="w-3.5 h-3.5 stroke-[1.5]" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="icon"
                              title="Duplikasi"
                              onClick={() => handleDuplicate(form.id)}
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Template Chooser Dialog */}
      <Dialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        title="Pilih Template Formulir"
        description="Gunakan struktur siap pakai untuk membuat kuesioner dengan cepat."
      >
        <div className="space-y-4 py-2">
          {formTemplates.map((template, idx) => (
            <div
              key={idx}
              className="p-4 border border-border rounded-[8px] hover:border-text-primary transition-colors cursor-pointer space-y-2 bg-surface"
              onClick={() => handleCreateFromTemplate(template)}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-text-primary">{template.name}</h4>
                <span className="text-xs font-mono text-text-secondary">
                  {template.fields.length} pertanyaan
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{template.description}</p>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
}

