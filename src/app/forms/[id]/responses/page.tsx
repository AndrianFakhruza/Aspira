"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Form, FormResponse } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Search,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Eye,
} from "lucide-react";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.3 } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
};

export default function ResponsesPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);

  const fetchFormAndResponses = async () => {
    try {
      const [formRes, respRes] = await Promise.all([
        fetch(`/api/forms/${formId}`),
        fetch(`/api/forms/${formId}/responses`),
      ]);
      const formData = await formRes.json();
      const respData = await respRes.json();

      if (formData.form) setForm(formData.form);
      if (respData.responses) setResponses(respData.responses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormAndResponses();
  }, [formId]);

  const handleDeleteResponse = async (id: string) => {
    if (confirm("Hapus baris respons ini secara permanen?")) {
      await fetch(`/api/responses/${id}`, { method: "DELETE" });
      setSelectedResponse(null);
      await fetchFormAndResponses();
    }
  };

  const handleExportXlsx = () => {
    if (!form || responses.length === 0) return;
    window.location.href = `/api/forms/${formId}/export?format=xlsx`;
  };

  const handleExportCsv = () => {
    if (!form || responses.length === 0) return;
    window.location.href = `/api/forms/${formId}/export?format=csv`;
  };

  const filteredResponses = responses.filter((r) => {
    const q = search.toLowerCase();
    const nameMatch = r.respondent_name && r.respondent_name.toLowerCase().includes(q);
    const emailMatch = r.respondent_email && r.respondent_email.toLowerCase().includes(q);
    const answerMatch = Object.values(r.answers).some((val) =>
      String(val).toLowerCase().includes(q)
    );
    return !q || nameMatch || emailMatch || answerMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredResponses.length / pageSize));
  const paginatedResponses = filteredResponses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const fields = form?.fields || [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar
          breadcrumb={[
            { label: "Formulir", href: "/forms" },
            { label: form?.title || "Form", href: `/forms/${formId}/edit` },
            { label: "Respons" },
          ]}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3">
              <Link
                href="/forms"
                className="p-1.5 rounded-[6px] border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-text-primary">
                  Respons: {form?.title || "Memuat..."}
                </h1>
                <p className="text-xs text-text-secondary mt-0.5">
                  Total {responses.length} respons yang telah terkumpul
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/forms/${formId}/analytics`}>
                <Button variant="outline" size="sm" className="hover:border-violet-400 hover:text-violet-600">
                  Lihat Analisis
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={responses.length === 0}
                className="gap-1.5 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                CSV
              </Button>
              <Button
                size="sm"
                onClick={handleExportXlsx}
                disabled={responses.length === 0}
                className="gap-1.5 shadow-sm hover:shadow-indigo-500/25"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Ekspor XLSX
              </Button>
            </div>
          </motion.div>

          {/* Search bar */}
          <motion.div
            className="flex items-center justify-between gap-4"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-full sm:w-80 group">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary group-focus-within:text-indigo-600 transition-colors stroke-[1.5]" />
              <input
                type="text"
                placeholder="Cari respons..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-9 pl-9 pr-3 text-sm bg-surface text-text-primary border border-border rounded-[8px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <p className="text-xs font-mono text-text-secondary">
              Menampilkan <span className="font-semibold text-indigo-600">{paginatedResponses.length}</span> dari {filteredResponses.length} respons
            </p>
          </motion.div>

          {/* Responses Data Table */}
          <motion.div
            className="bg-surface border border-border rounded-[10px] overflow-hidden shadow-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-muted/70 border-b border-border text-xs uppercase font-mono text-text-secondary sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-12">No</th>
                    <th className="py-2.5 px-4 font-semibold w-36">Waktu Submit</th>
                    {!form?.settings.is_anonymous && (
                      <>
                        <th className="py-2.5 px-4 font-semibold w-40">Responden</th>
                        <th className="py-2.5 px-4 font-semibold w-44">Email</th>
                      </>
                    )}
                    {fields.map((f) => (
                      <th key={f.id} className="py-2.5 px-4 font-semibold min-w-[180px] max-w-[260px] truncate">
                        {f.label}
                      </th>
                    ))}
                    <th className="py-2.5 px-4 font-semibold text-right w-24 sticky right-0 bg-muted">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={5 + fields.length} className="py-12 text-center text-xs text-text-secondary">
                        <div className="inline-flex items-center gap-2 text-indigo-600 font-medium">
                          <span className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
                          Memuat data respons...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedResponses.length === 0 ? (
                    <tr>
                      <td colSpan={5 + fields.length} className="py-12 text-center text-xs text-text-secondary">
                        Belum ada respons yang sesuai.
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      <motion.tbody
                        key={currentPage + search}
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="divide-y divide-border"
                      >
                        {paginatedResponses.map((resp, idx) => (
                          <motion.tr
                            key={resp.id}
                            variants={rowVariants}
                            exit="exit"
                            layout
                            className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all h-11 text-xs group"
                            whileHover={{ x: 4, transition: { duration: 0.15 } }}
                          >
                            <td className="py-2.5 px-4 font-mono text-text-secondary">
                              {(currentPage - 1) * pageSize + idx + 1}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-text-secondary whitespace-nowrap">
                              {formatDate(resp.submitted_at)}
                            </td>
                            {!form?.settings.is_anonymous && (
                              <>
                                <td className="py-2.5 px-4 font-semibold text-text-primary group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                                  {resp.respondent_name || "(Anonim)"}
                                </td>
                                <td className="py-2.5 px-4 text-text-secondary font-mono whitespace-nowrap">
                                  {resp.respondent_email || "-"}
                                </td>
                              </>
                            )}
                            {fields.map((f) => {
                              const val = resp.answers[f.id];
                              const displayVal = Array.isArray(val)
                                ? val.join(", ")
                                : typeof val === "object" && val !== null
                                ? JSON.stringify(val)
                                : val !== undefined && val !== null
                                ? String(val)
                                : "-";
                              return (
                                <td key={f.id} className="py-2.5 px-4 truncate max-w-[260px]" title={displayVal}>
                                  {displayVal}
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-4 text-right sticky right-0 bg-surface">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedResponse(resp)}
                                  className="p-1.5 text-text-secondary hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-all hover:scale-115"
                                  title="Lihat Detail Jawaban"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteResponse(resp.id)}
                                  className="p-1.5 text-text-secondary hover:text-rose-600 rounded-md hover:bg-rose-50 transition-all hover:scale-115"
                                  title="Hapus Respons"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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

            {/* Pagination footer */}
            <div className="p-3 bg-surface border-t border-border flex items-center justify-between text-xs">
              <span className="font-mono text-text-secondary">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Selanjutnya
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Response Detail Dialog */}
      <Dialog
        open={Boolean(selectedResponse)}
        onOpenChange={(open) => !open && setSelectedResponse(null)}
        title="Detail Respons Responden"
        description={selectedResponse ? `Diserahkan pada ${formatDate(selectedResponse.submitted_at)}` : ""}
      >
        {selectedResponse && (
          <div className="space-y-4 py-2">
            {!form?.settings.is_anonymous && (
              <div className="p-3 bg-muted border border-border rounded-[6px] space-y-1">
                <p className="text-xs font-semibold text-text-primary">
                  {selectedResponse.respondent_name || "Responden Anonim"}
                </p>
                <p className="text-xs font-mono text-text-secondary">
                  {selectedResponse.respondent_email || "Tidak ada email"}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {fields.map((f) => {
                const val = selectedResponse.answers[f.id];
                const displayVal = Array.isArray(val)
                  ? val.join(", ")
                  : typeof val === "object" && val !== null
                  ? JSON.stringify(val)
                  : val !== undefined && val !== null
                  ? String(val)
                  : "-";
                return (
                  <div key={f.id} className="p-3 border border-border rounded-[6px] space-y-1">
                    <p className="text-xs font-semibold text-text-secondary">{f.label}</p>
                    <p className="text-sm font-medium text-text-primary whitespace-pre-wrap">
                      {displayVal}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-border">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteResponse(selectedResponse.id)}
              >
                Hapus Respons Ini
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedResponse(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
