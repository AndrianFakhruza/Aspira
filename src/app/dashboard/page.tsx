import React from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  MessageSquare,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ExternalLink,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const workspace = await db.getWorkspace();
  const forms = await db.getForms();
  const allResponses = await db.getAllResponses();

  const totalForms = forms.length;
  const publishedForms = forms.filter((f) => f.status === "published").length;
  const totalResponses = allResponses.length;

  const recentResponses = allResponses.slice(0, 6);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar workspaceName={workspace.name} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar breadcrumb={[{ label: "Dashboard" }]} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
              <p className="text-sm text-text-secondary mt-1">
                Kumpulkan respons, pahami hasilnya. Ringkasan seluruh aktivitas formulir dan survei.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/forms/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4 stroke-[1.5]" />
                  Buat Form Baru
                </Button>
              </Link>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Total Formulir
                </CardTitle>
                <FileText className="w-4 h-4 text-text-secondary stroke-[1.5]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-mono font-bold text-text-primary">{totalForms}</div>
                <p className="text-xs text-text-secondary mt-1">
                  {publishedForms} form berstatus aktif (published)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Total Respons Terkumpul
                </CardTitle>
                <MessageSquare className="w-4 h-4 text-text-secondary stroke-[1.5]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-mono font-bold text-text-primary">{totalResponses}</div>
                <p className="text-xs text-text-secondary mt-1">Akumulasi respons seluruh survei</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Tingkat Form Aktif
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-text-secondary stroke-[1.5]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-mono font-bold text-text-primary">
                  {totalForms > 0 ? Math.round((publishedForms / totalForms) * 100) : 0}%
                </div>
                <p className="text-xs text-text-secondary mt-1">Form siap menerima responden publik</p>
              </CardContent>
            </Card>
          </div>

          {/* Grid Layout: Active Forms & Recent Responses */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Form Lists */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">Daftar Formulir</h2>
                  <p className="text-xs text-text-secondary">Kelola formulir yang aktif dan draft</p>
                </div>
                <Link href="/forms" className="text-xs font-semibold text-text-primary hover:underline flex items-center gap-1">
                  Lihat Semua
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className="p-4 bg-surface border border-border rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-text-secondary/40 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <StatusBadge status={form.status} />
                        <Link
                          href={`/forms/${form.id}/edit`}
                          className="font-semibold text-sm text-text-primary hover:underline truncate"
                        >
                          {form.title}
                        </Link>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-1">
                        {form.description || "Tidak ada deskripsi"}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-mono text-text-secondary pt-1">
                        <span>{form.responses_count || 0} respons</span>
                        <span>•</span>
                        <span>{formatDate(form.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {form.status === "published" && (
                        <Link href={`/f/${form.slug}`} target="_blank">
                          <Button variant="outline" size="sm" title="Buka Form Publik">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/forms/${form.id}/responses`}>
                        <Button variant="outline" size="sm">
                          Respons
                        </Button>
                      </Link>
                      <Link href={`/forms/${form.id}/analytics`}>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-3.5 h-3.5" />
                          Analisis
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Recent Activity */}
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Respons Terbaru</h2>
                <p className="text-xs text-text-secondary">Umpan data kiriman responden terbaru</p>
              </div>

              <div className="p-4 bg-surface border border-border rounded-[8px] divide-y divide-border">
                {recentResponses.length === 0 ? (
                  <p className="text-xs text-text-secondary py-6 text-center">Belum ada respons yang masuk.</p>
                ) : (
                  recentResponses.map((resp) => {
                    const relatedForm = forms.find((f) => f.id === resp.form_id);
                    return (
                      <div key={resp.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-text-primary truncate">
                            {resp.respondent_name || "Responden Anonim"}
                          </span>
                          <span className="text-[10px] font-mono text-text-secondary">
                            {formatDate(resp.submitted_at)}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary truncate font-mono">
                          {relatedForm?.title || "Formulir"}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

