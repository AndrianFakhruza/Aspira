"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormResponse } from "@/types";
import { computeAnalytics, AnalyticsSummary } from "@/lib/analytics";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Printer,
  Users,
  FileText,
  BarChart2,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.4 } },
};

const CHART_COLORS = [
  "#2563EB", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#0284C7", // Sky
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#F97316", // Orange
  "#3B82F6", // Bright Blue
];

export default function AnalyticsPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, [formId]);

  if (!loading && !form) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-text-secondary text-sm flex-col gap-4">
        <p className="text-base font-semibold text-text-primary">Data analisis tidak ditemukan</p>
        <Link href="/forms">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Formulir
          </Button>
        </Link>
      </div>
    );
  }

  if (loading || !form) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Topbar breadcrumb={[{ label: "Formulir", href: "/forms" }, { label: "Analisis" }]} />
          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="space-y-2">
                <div className="w-64 h-6 bg-muted/80 rounded" />
                <div className="w-96 h-4 bg-muted/50 rounded" />
              </div>
              <div className="w-28 h-8 bg-muted/60 rounded" />
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, i) => (
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

            {/* Narrative Skeleton */}
            <div className="p-6 bg-surface border border-border rounded-[10px] space-y-4">
              <div className="w-48 h-5 bg-muted/80 rounded" />
              <div className="w-full h-4 bg-muted/60 rounded" />
              <div className="space-y-2 pt-2">
                <div className="w-full h-12 bg-muted/40 rounded-[8px]" />
                <div className="w-full h-12 bg-muted/40 rounded-[8px]" />
              </div>
            </div>

            {/* Chart Skeleton */}
            <div className="p-6 bg-surface border border-border rounded-[10px] space-y-4">
              <div className="w-40 h-5 bg-muted/80 rounded" />
              <div className="w-full h-64 bg-muted/30 rounded" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const analytics: AnalyticsSummary = computeAnalytics(form, responses);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar
          breadcrumb={[
            { label: "Formulir", href: "/forms" },
            { label: form.title, href: `/forms/${formId}/edit` },
            { label: "Analisis" },
          ]}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
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
                className="p-1.5 rounded-[8px] border border-border text-text-secondary hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 no-print transition-all hover:-translate-x-0.5"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2]" />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                  <span>Laporan &amp; Analisis: {form.title}</span>
                  <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                    Live Data
                  </span>
                </h1>
                <p className="text-xs text-text-secondary mt-0.5">
                  Laporan komprehensif berbasis data kuantitatif dan naratif otomatis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 no-print">
              <Link href={`/forms/${formId}/responses`}>
                <Button variant="outline" size="sm" className="hover:border-emerald-400 hover:text-emerald-600">
                  Tabel Respons
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 hover:border-blue-400 hover:text-blue-600"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / Simpan PDF
              </Button>
            </div>
          </motion.div>

          {/* KPI Metrics with Colorful Glow & Hover Motion */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.015 }} transition={{ duration: 0.2 }} className="cursor-pointer">
              <Card className="hover:border-blue-400/80 hover:shadow-blue-500/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
                    Total Responden
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                    <Users className="w-4 h-4 stroke-[2]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-mono font-bold text-text-primary">
                    {analytics.totalResponses}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">Partisipasi responden aktif</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.015 }} transition={{ duration: 0.2 }} className="cursor-pointer">
              <Card className="hover:border-sky-400/80 hover:shadow-sky-500/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
                    Pertanyaan Teranalisis
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                    <FileText className="w-4 h-4 stroke-[2]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-mono font-bold text-text-primary">
                    {analytics.questions.length}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">Variabel pertanyaan survei</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.015 }} transition={{ duration: 0.2 }} className="cursor-pointer">
              <Card className="hover:border-emerald-400/80 hover:shadow-emerald-500/10">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
                    Status Formulir
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                    <BarChart2 className="w-4 h-4 stroke-[2]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {form.status}
                  </div>
                  <p className="text-xs text-text-secondary mt-1 font-mono">
                    Slug: /{form.slug}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Rule-Based Narrative Summary (PRD Section 6.4) with colorful cards */}
          <motion.div
            className="p-6 bg-surface border border-border rounded-[10px] space-y-4 shadow-xs"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-text-primary uppercase font-mono tracking-wider">
                Ringkasan Naratif Otomatis
              </h2>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Laporan ini menyajikan ringkasan eksekutif untuk formulir &quot;<strong>{form.title}</strong>&quot;.
              Survei ini telah diisi oleh total <strong>{analytics.totalResponses}</strong> responden.
              Berikut adalah simpulan temuan penting:
            </p>

            <div className="space-y-3 pt-2">
              {analytics.narrativePoints.length === 0 ? (
                <p className="text-xs text-text-secondary italic">
                  Belum cukup data jawaban untuk membuat narasi otomatis.
                </p>
              ) : (
                analytics.narrativePoints.map((point, idx) => (
                  <motion.div
                    key={idx}
                    className="p-3.5 bg-blue-50/30 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-[8px] space-y-1 hover:border-blue-300 transition-colors"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.25 + idx * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      {point.title}
                    </p>
                    <p className="text-xs text-text-secondary leading-relaxed pl-3">{point.summary}</p>
                    {point.detail && (
                      <p className="text-[11px] font-mono text-blue-600/80 dark:text-blue-400/80 pl-3">{point.detail}</p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Response Submission Trend (Colorful Recharts) */}
          {analytics.dailyTrends.length > 0 && (
            <motion.div
              className="p-6 bg-surface border border-border rounded-[10px] space-y-4 shadow-xs"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-text-primary">Tren Respons Harian</h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.dailyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" fontSize={11} fontFamily="Inter, sans-serif" />
                    <YAxis allowDecimals={false} stroke="#6B7280" fontSize={11} fontFamily="Inter, sans-serif" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        color: "#FFFFFF",
                        borderRadius: "8px",
                        fontSize: "12px",
                        border: "1px solid #2563EB",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Jumlah Respons"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: "#1D4ED8" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Breakdown Per Question */}
          <div className="space-y-6">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-600" />
              <span>Analisis Per Pertanyaan</span>
            </h3>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {analytics.questions.map((q, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 bg-surface border border-border rounded-[10px] space-y-4 hover:border-blue-300 dark:hover:border-blue-700/60 hover:shadow-md transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {q.field.type} • {q.totalAnswered} Menjawab
                      </span>
                      <h4 className="text-sm font-semibold text-text-primary pt-1">{q.field.label}</h4>
                    </div>

                    {q.average !== undefined && (
                      <div className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-[6px] text-xs font-mono font-bold text-amber-700 dark:text-amber-300 shrink-0">
                        Rata-rata: {q.average}
                      </div>
                    )}
                  </div>

                  {/* Chart for Multiple Choice, Radio, Select, Rating with colorful bars */}
                  {q.data.length > 0 && (
                    <div className="h-48 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={q.data}
                          layout="vertical"
                          margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" horizontal={false} />
                          <XAxis type="number" fontSize={10} stroke="#6B7280" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={110}
                            fontSize={10}
                            stroke="#6B7280"
                            tickFormatter={(v) => (v.length > 15 ? v.substring(0, 15) + "..." : v)}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0F172A",
                              color: "#FFFFFF",
                              borderRadius: "8px",
                              fontSize: "11px",
                              border: "1px solid #2563EB",
                            }}
                          />
                          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                            {q.data.map((entry, entryIdx) => (
                              <Cell
                                key={`cell-${entryIdx}`}
                                fill={CHART_COLORS[entryIdx % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Sample text answers */}
                  {q.sampleTextAnswers && q.sampleTextAnswers.length > 0 && (
                    <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                      {q.sampleTextAnswers.map((txt, ti) => (
                        <div
                          key={ti}
                          className="p-2.5 bg-blue-50/20 dark:bg-blue-950/10 border border-border rounded-[6px] text-xs text-text-primary hover:border-blue-300 transition-colors"
                        >
                          &ldquo;{txt}&rdquo;
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
