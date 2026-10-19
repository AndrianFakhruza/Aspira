"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  TrendingUp,
  Star,
  Users,
  FileText,
  BarChart2,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

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

  if (loading || !form) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-text-secondary text-sm">
        Memuat analisis data survei...
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Link
                href="/forms"
                className="p-1.5 rounded-[6px] border border-border text-text-secondary hover:text-text-primary hover:bg-muted no-print"
              >
                <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
              </Link>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-text-primary">
                  Laporan & Analisis: {form.title}
                </h1>
                <p className="text-xs text-text-secondary mt-0.5">
                  Laporan komprehensif berbasis data kuantitatif dan naratif otomatis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 no-print">
              <Link href={`/forms/${formId}/responses`}>
                <Button variant="outline" size="sm">
                  Tabel Respons
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak / Simpan PDF
              </Button>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Total Responden
                </CardTitle>
                <Users className="w-4 h-4 text-text-secondary stroke-[1.5]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-mono font-bold text-text-primary">
                  {analytics.totalResponses}
                </div>
                <p className="text-xs text-text-secondary mt-1">Partisipasi responden aktif</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Pertanyaan Teranalisis
                </CardTitle>
                <FileText className="w-4 h-4 text-text-secondary stroke-[1.5]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-mono font-bold text-text-primary">
                  {analytics.questions.length}
                </div>
                <p className="text-xs text-text-secondary mt-1">Variabel pertanyaan survei</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Status Formulir
                </CardTitle>
                <BarChart2 className="w-4 h-4 text-text-secondary stroke-[1.5]" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-mono font-bold text-text-primary uppercase">
                  {form.status}
                </div>
                <p className="text-xs text-text-secondary mt-1 font-mono">
                  Slug: /{form.slug}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Rule-Based Narrative Summary (PRD Section 6.4) */}
          <div className="p-6 bg-surface border border-border rounded-[8px] space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
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
                  <div key={idx} className="p-3 bg-muted/40 border border-border rounded-[6px] space-y-1">
                    <p className="text-xs font-semibold text-text-primary">{point.title}</p>
                    <p className="text-xs text-text-secondary">{point.summary}</p>
                    {point.detail && (
                      <p className="text-[11px] font-mono text-text-secondary/80">{point.detail}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Response Submission Trend (Monochrome Recharts) */}
          {analytics.dailyTrends.length > 0 && (
            <div className="p-6 bg-surface border border-border rounded-[8px] space-y-4">
              <h3 className="text-sm font-bold text-text-primary">Tren Respons Harian</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.dailyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="date" stroke="#525252" fontSize={11} fontFamily="Inter, sans-serif" />
                    <YAxis allowDecimals={false} stroke="#525252" fontSize={11} fontFamily="Inter, sans-serif" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0A0A0A",
                        color: "#FFFFFF",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Jumlah Respons"
                      stroke="#0A0A0A"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#0A0A0A" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Breakdown Per Question */}
          <div className="space-y-6">
            <h3 className="text-base font-bold text-text-primary">Analisis Per Pertanyaan</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analytics.questions.map((q, idx) => (
                <div key={idx} className="p-5 bg-surface border border-border rounded-[8px] space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-text-secondary">
                        {q.field.type} • {q.totalAnswered} Menjawab
                      </span>
                      <h4 className="text-sm font-semibold text-text-primary">{q.field.label}</h4>
                    </div>

                    {q.average !== undefined && (
                      <div className="px-2.5 py-1 bg-muted border border-border rounded-[4px] text-xs font-mono font-bold text-text-primary shrink-0">
                        Rata-rata: {q.average}
                      </div>
                    )}
                  </div>

                  {/* Chart for Multiple Choice, Radio, Select, Rating */}
                  {q.data.length > 0 && (
                    <div className="h-48 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={q.data}
                          layout="vertical"
                          margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="2 2" stroke="#E5E5E5" horizontal={false} />
                          <XAxis type="number" fontSize={10} stroke="#525252" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={110}
                            fontSize={10}
                            stroke="#525252"
                            tickFormatter={(v) => (v.length > 15 ? v.substring(0, 15) + "..." : v)}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0A0A0A",
                              color: "#FFFFFF",
                              borderRadius: "6px",
                              fontSize: "11px",
                            }}
                          />
                          <Bar dataKey="count" fill="#0A0A0A" radius={[0, 4, 4, 0]} />
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
                          className="p-2.5 bg-muted/40 border border-border rounded-[4px] text-xs text-text-primary"
                        >
                          &ldquo;{txt}&rdquo;
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

