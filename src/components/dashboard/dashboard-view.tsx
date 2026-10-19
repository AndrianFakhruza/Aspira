"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Form, FormResponse } from "@/types";
import {
  FileText,
  MessageSquare,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ExternalLink,
  BarChart3,
  Clock,
  Sparkles,
} from "lucide-react";

interface DashboardViewProps {
  forms: Form[];
  allResponses: FormResponse[];
}

export function DashboardView({ forms, allResponses }: DashboardViewProps) {
  const totalForms = forms.length;
  const publishedForms = forms.filter((f) => f.status === "published").length;
  const totalResponses = allResponses.length;
  const recentResponses = allResponses.slice(0, 6);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Kumpulkan respons, pahami hasilnya. Ringkasan seluruh aktivitas formulir dan survei.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/forms/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="w-4 h-4 stroke-[1.5]" />
              Buat Form Baru
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Metric KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card className="hover:border-text-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-text-secondary font-semibold">
                Total Formulir
              </CardTitle>
              <FileText className="w-4 h-4 text-text-secondary stroke-[1.5]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary tracking-tight">{totalForms}</div>
              <p className="text-xs text-text-secondary mt-1">
                {publishedForms} form berstatus aktif (published)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card className="hover:border-text-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-text-secondary font-semibold">
                Total Respons Terkumpul
              </CardTitle>
              <MessageSquare className="w-4 h-4 text-text-secondary stroke-[1.5]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary tracking-tight">{totalResponses}</div>
              <p className="text-xs text-text-secondary mt-1">Akumulasi respons seluruh survei</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          <Card className="hover:border-text-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-text-secondary font-semibold">
                Tingkat Form Aktif
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-text-secondary stroke-[1.5]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary tracking-tight">
                {totalForms > 0 ? Math.round((publishedForms / totalForms) * 100) : 0}%
              </div>
              <p className="text-xs text-text-secondary mt-1">Form siap menerima responden publik</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Grid Layout: Active Forms & Recent Responses */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Daftar Formulir</h2>
              <p className="text-xs text-text-secondary">Kelola formulir yang aktif dan draft</p>
            </div>
            <Link
              href="/forms"
              className="text-xs font-semibold text-text-primary hover:underline flex items-center gap-1 group"
            >
              Lihat Semua
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {forms.map((form) => (
              <motion.div
                key={form.id}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
                className="p-4 bg-surface border border-border rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-text-primary/40 transition-colors shadow-xs"
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
                  <div className="flex items-center gap-4 text-xs text-text-secondary pt-1">
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
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Analisis
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Col: Recent Activity */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Respons Terbaru</h2>
            <p className="text-xs text-text-secondary">Umpan data kiriman responden terbaru</p>
          </div>

          <div className="p-4 bg-surface border border-border rounded-[8px] divide-y divide-border shadow-xs">
            {recentResponses.length === 0 ? (
              <p className="text-xs text-text-secondary py-6 text-center">Belum ada respons yang masuk.</p>
            ) : (
              recentResponses.map((resp, idx) => {
                const relatedForm = forms.find((f) => f.id === resp.form_id);
                return (
                  <motion.div
                    key={resp.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="py-3 first:pt-0 last:pb-0 space-y-1 hover:bg-muted/30 px-2 rounded-[4px] transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary truncate">
                        {resp.respondent_name || "Responden Anonim"}
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        {formatDate(resp.submitted_at)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">
                      {relatedForm?.title || "Formulir"}
                    </p>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

