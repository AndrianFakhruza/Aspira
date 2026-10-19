"use client";

import React, { useState } from "react";
import { Form, FormField } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Monitor, Smartphone, Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewTabProps {
  form: Form;
}

export function PreviewTab({ form }: PreviewTabProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [currentSection, setCurrentSection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const fields = form.fields || [];
  const maxSection = Math.max(...fields.map((f) => f.section || 1), 1);

  // Conditional logic check
  const isFieldVisible = (field: FormField) => {
    if (!field.logic || !Array.isArray(field.logic) || field.logic.length === 0) return true;
    for (const rule of field.logic) {
      if (!rule || !rule.target_field_id) continue;
      const targetVal = answers[rule.target_field_id];
      if (rule.operator === "equals") {
        if (String(targetVal || "").toLowerCase() !== String(rule.value || "").toLowerCase()) {
          return false;
        }
      }
    }
    return true;
  };

  const currentFields = fields
    .filter((f) => (f.section || 1) === currentSection)
    .filter(isFieldVisible);

  const handleAnswerChange = (fieldId: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: val }));
  };

  return (
    <div className="py-6 flex flex-col items-center space-y-6">
      {/* Device Viewport Toggle */}
      <div className="flex items-center gap-2 bg-surface p-1 border border-border rounded-[8px]">
        <button
          onClick={() => setDevice("desktop")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors",
            device === "desktop"
              ? "bg-primary text-primary-foreground"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Monitor className="w-3.5 h-3.5" />
          Desktop
        </button>
        <button
          onClick={() => setDevice("mobile")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors",
            device === "mobile"
              ? "bg-primary text-primary-foreground"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Mobile (360px)
        </button>
      </div>

      {/* Simulator Frame */}
      <div
        className={cn(
          "bg-surface border border-border rounded-[8px] transition-all p-6 md:p-8 overflow-y-auto",
          device === "desktop" ? "w-full max-w-2xl" : "w-[380px] max-w-full"
        )}
      >
        {submitted ? (
          <div className="text-center py-12 space-y-4">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Respons Terkirim!</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
              {form.settings.thank_you_message}
            </p>
            <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
              Isi Kembali (Pratinjau)
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Form Header */}
            <div className="space-y-2 border-b border-border pb-6">
              <h1 className="text-xl font-bold text-text-primary">{form.title}</h1>
              {form.description && (
                <p className="text-xs text-text-secondary leading-relaxed">{form.description}</p>
              )}

              {/* Progress bar if multi-page */}
              {maxSection > 1 && (
                <div className="pt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
                    <span>
                      Bagian {currentSection} dari {maxSection}
                    </span>
                    <span>{Math.round((currentSection / maxSection) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(currentSection / maxSection) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {/* Respondent Identity if not anonymous and section 1 */}
              {!form.settings.is_anonymous && currentSection === 1 && (
                <div className="p-4 bg-muted/40 border border-border rounded-[8px] space-y-4">
                  <p className="text-xs font-semibold text-text-secondary uppercase font-mono tracking-wider">
                    Data Responden
                  </p>
                  <Input
                    label="Nama Lengkap"
                    placeholder="Masukkan nama Anda..."
                    value={answers["respondent_name"] || ""}
                    onChange={(e) => handleAnswerChange("respondent_name", e.target.value)}
                  />
                  <Input
                    label="Alamat Email"
                    placeholder="nama@domain.com"
                    type="email"
                    value={answers["respondent_email"] || ""}
                    onChange={(e) => handleAnswerChange("respondent_email", e.target.value)}
                  />
                </div>
              )}

              {currentFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-semibold text-text-primary">
                    {field.label}
                    {field.required && <span className="ml-1 text-text-primary">*</span>}
                  </label>
                  {field.help_text && (
                    <p className="text-xs text-text-secondary">{field.help_text}</p>
                  )}

                  {/* Input Rendering */}
                  {field.type === "text" && (
                    <Input
                      placeholder={field.placeholder || "Jawaban singkat..."}
                      value={answers[field.id] || ""}
                      onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === "textarea" && (
                    <Textarea
                      placeholder={field.placeholder || "Jawaban panjang..."}
                      rows={3}
                      value={answers[field.id] || ""}
                      onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === "number" && (
                    <Input
                      type="number"
                      placeholder="Masukkan angka..."
                      value={answers[field.id] || ""}
                      onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === "email" && (
                    <Input
                      type="email"
                      placeholder="nama@perusahaan.com"
                      value={answers[field.id] || ""}
                      onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === "phone" && (
                    <Input
                      type="tel"
                      placeholder="08123456789"
                      value={answers[field.id] || ""}
                      onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === "date" && (
                    <Input
                      type="date"
                      value={answers[field.id] || ""}
                      onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === "select" && (
                    <Select
                      value={answers[field.id] || ""}
                      onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                    >
                      <option value="">Pilih salah satu...</option>
                      {(field.options || []).map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  )}

                  {field.type === "radio" && (
                    <div className="space-y-2 pt-1">
                      {(field.options || []).map((opt, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-3 p-2.5 rounded-[6px] border border-border hover:bg-muted cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name={field.id}
                            checked={answers[field.id] === opt}
                            onChange={() => handleAnswerChange(field.id, opt)}
                            className="w-4 h-4 text-primary accent-primary"
                          />
                          <span className="text-xs text-text-primary font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === "checkbox" && (
                    <div className="space-y-2 pt-1">
                      {(field.options || []).map((opt, i) => {
                        const currentArr = (answers[field.id] as string[]) || [];
                        const isChecked = currentArr.includes(opt);
                        return (
                          <label
                            key={i}
                            className="flex items-center gap-3 p-2.5 rounded-[6px] border border-border hover:bg-muted cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleAnswerChange(field.id, [...currentArr, opt]);
                                } else {
                                  handleAnswerChange(
                                    field.id,
                                    currentArr.filter((item) => item !== opt)
                                  );
                                }
                              }}
                              className="w-4 h-4 rounded border-border accent-primary"
                            />
                            <span className="text-xs text-text-primary font-medium">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === "rating" && (
                    <div className="flex items-center gap-2 pt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => handleAnswerChange(field.id, star)}
                          className={cn(
                            "w-10 h-10 rounded-[6px] border text-xs font-mono font-bold flex items-center justify-center transition-colors",
                            answers[field.id] === star
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-muted text-text-primary"
                          )}
                        >
                          {star}
                        </button>
                      ))}
                    </div>
                  )}

                  {field.type === "linear_scale" && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {Array.from(
                          { length: (field.linear_scale_max ?? 10) - (field.linear_scale_min ?? 0) + 1 },
                          (_, i) => (field.linear_scale_min ?? 0) + i
                        ).map((val) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => handleAnswerChange(field.id, val)}
                            className={cn(
                              "w-8 h-8 rounded-[4px] border text-xs font-mono font-semibold flex items-center justify-center shrink-0 transition-colors",
                              answers[field.id] === val
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-muted text-text-primary"
                            )}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-text-secondary">
                        <span>{field.linear_scale_min_label || "Terendah"}</span>
                        <span>{field.linear_scale_max_label || "Tertinggi"}</span>
                      </div>
                    </div>
                  )}

                  {field.type === "file_upload" && (
                    <div className="p-6 border border-dashed border-border rounded-[6px] text-center text-xs text-text-secondary hover:bg-muted cursor-pointer">
                      Pilih berkas dari komputer (Maks 10 MB)
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Section Navigation Buttons */}
            <div className="pt-6 border-t border-border flex items-center justify-between">
              {currentSection > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentSection((prev) => prev - 1)}
                  className="gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </Button>
              ) : (
                <div />
              )}

              {currentSection < maxSection ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentSection((prev) => prev + 1)}
                  className="gap-1.5"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => setSubmitted(true)}>
                  Kirim Jawaban (Pratinjau)
                </Button>
              )}
            </div>

            {form.settings.show_branding && (
              <div className="pt-8 text-center border-t border-border">
                <p className="text-[11px] font-mono text-text-secondary">Dibuat dengan Tanggap</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

