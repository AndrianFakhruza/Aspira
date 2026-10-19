"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Form, FormField } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Slash,
  Send,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isReviewMode, setIsReviewMode] = useState(false);

  // Status checks
  const [formStatusNotice, setFormStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadPublicForm() {
      try {
        const res = await fetch(`/api/forms?slug=${slug}`);
        const data = await res.json();
        const found = (data.forms || []).find((f: Form) => f.slug === slug);

        if (!found) {
          setFormStatusNotice("Formulir tidak ditemukan.");
          setLoading(false);
          return;
        }

        setForm(found);

        // Check active status
        if (found.status === "closed") {
          setFormStatusNotice("Formulir ini telah ditutup dan tidak menerima respons lagi.");
          setLoading(false);
          return;
        }

        const now = new Date();
        if (found.opens_at && new Date(found.opens_at) > now) {
          setFormStatusNotice(
            `Formulir ini belum dibuka. Jadwal buka: ${new Date(found.opens_at).toLocaleString("id-ID")}`
          );
          setLoading(false);
          return;
        }

        if (found.closes_at && new Date(found.closes_at) < now) {
          setFormStatusNotice("Batas waktu pengisian formulir ini telah berakhir.");
          setLoading(false);
          return;
        }

        if (found.settings.quota && (found.responses_count || 0) >= found.settings.quota) {
          setFormStatusNotice("Batas kuota pengisian formulir ini telah tercapai.");
          setLoading(false);
          return;
        }

        // Restore draft from browser localStorage
        const storageKey = `tanggap_draft_${found.id}`;
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.answers) setAnswers(parsed.answers);
            if (parsed.respondentName) setRespondentName(parsed.respondentName);
            if (parsed.respondentEmail) setRespondentEmail(parsed.respondentEmail);
          }
        } catch {
          // ignore cache read failure
        }
      } catch (err) {
        setFormStatusNotice("Terjadi kendala saat memuat formulir.");
      } finally {
        setLoading(false);
      }
    }
    loadPublicForm();
  }, [slug]);

  // Autosave answers to localStorage
  useEffect(() => {
    if (form?.id && Object.keys(answers).length > 0) {
      const storageKey = `tanggap_draft_${form.id}`;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ answers, respondentName, respondentEmail })
        );
      } catch {
        // storage quota exceeded or disabled
      }
    }
  }, [answers, respondentName, respondentEmail, form?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-secondary text-sm">
        Memuat formulir...
      </div>
    );
  }

  if (formStatusNotice || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-surface border border-border rounded-[8px] p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center mx-auto text-text-secondary">
            <Slash className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">Informasi Formulir</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            {formStatusNotice || "Formulir tidak tersedia."}
          </p>
        </div>
      </div>
    );
  }

  const fields = form.fields || [];
  const maxSection = Math.max(...fields.map((f) => f.section || 1), 1);

  // Conditional logic check
  const isFieldVisible = (field: FormField) => {
    if (!field.logic || field.logic.length === 0) return true;
    for (const rule of field.logic) {
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

  const validateCurrentSection = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate identity if section 1 and not anonymous
    if (!form.settings.is_anonymous && currentSection === 1) {
      if (!respondentName.trim()) {
        newErrors["respondent_name"] = "Nama lengkap wajib diisi.";
      }
      if (!respondentEmail.trim()) {
        newErrors["respondent_email"] = "Email aktif wajib diisi.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail)) {
        newErrors["respondent_email"] = "Format email tidak valid.";
      }
    }

    currentFields.forEach((field) => {
      const val = answers[field.id];
      if (field.required) {
        if (
          val === undefined ||
          val === null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        ) {
          newErrors[field.id] = "Pertanyaan ini wajib dijawab.";
          return;
        }
      }

      if (val !== undefined && val !== null && val !== "") {
        if (field.validation?.min_length && String(val).length < field.validation.min_length) {
          newErrors[field.id] = `Minimal ${field.validation.min_length} karakter.`;
        }
        if (field.validation?.max_length && String(val).length > field.validation.max_length) {
          newErrors[field.id] = `Maksimal ${field.validation.max_length} karakter.`;
        }
        if (field.validation?.min_value && Number(val) < field.validation.min_value) {
          newErrors[field.id] = `Nilai minimal adalah ${field.validation.min_value}.`;
        }
        if (field.validation?.max_value && Number(val) > field.validation.max_value) {
          newErrors[field.id] = `Nilai maksimal adalah ${field.validation.max_value}.`;
        }
        if (field.validation?.regex) {
          try {
            const re = new RegExp(field.validation.regex);
            if (!re.test(String(val))) {
              newErrors[field.id] = "Format jawaban tidak sesuai ketentuan.";
            }
          } catch {
            // invalid regex
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextSection = () => {
    if (validateCurrentSection()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentSection((prev) => Math.min(maxSection, prev + 1));
    }
  };

  const handlePreviousSection = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setCurrentSection((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          respondent_name: respondentName,
          respondent_email: respondentEmail,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setIsSuccess(true);
        setSuccessMessage(data.thank_you_message || form.settings.thank_you_message);
        // Clear draft cache
        try {
          localStorage.removeItem(`tanggap_draft_${form.id}`);
        } catch {}

        if (data.redirect_url) {
          setTimeout(() => {
            window.location.href = data.redirect_url;
          }, 2500);
        }
      } else {
        alert(data.message || "Gagal mengirim formulir.");
      }
    } catch (e) {
      alert("Terjadi kendala jaringan saat mengirim respons.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-surface border border-border rounded-[8px] p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 stroke-[2]" />
          </div>
          <h2 className="text-xl font-bold text-text-primary">Respons Berhasil Dikirim</h2>
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
            {successMessage}
          </p>
          {form.settings.show_branding && (
            <div className="pt-6 border-t border-border">
              <p className="text-[11px] font-mono text-text-secondary">Dibuat dengan Tanggap</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-8">
        {/* Form Title & Description */}
        <div className="bg-surface border border-border rounded-[8px] p-6 md:p-8 space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{form.title}</h1>
          {form.description && (
            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
              {form.description}
            </p>
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

        {/* Identity Inputs for Non-Anonymous Surveys */}
        {!form.settings.is_anonymous && currentSection === 1 && (
          <div className="bg-surface border border-border rounded-[8px] p-6 md:p-8 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
              Identitas Responden
            </h3>
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap Anda..."
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              error={errors["respondent_name"]}
              required
            />
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@domain.com"
              value={respondentEmail}
              onChange={(e) => setRespondentEmail(e.target.value)}
              error={errors["respondent_email"]}
              required
            />
          </div>
        )}

        {/* Questions in Current Section */}
        <div className="space-y-4">
          {currentFields.map((field) => (
            <div
              key={field.id}
              className="bg-surface border border-border rounded-[8px] p-6 md:p-8 space-y-3"
            >
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-text-primary leading-snug">
                  {field.label}
                  {field.required && <span className="ml-1 text-text-primary">*</span>}
                </label>
                {field.help_text && (
                  <p className="text-xs text-text-secondary leading-relaxed">{field.help_text}</p>
                )}
              </div>

              {/* Teks Pendek */}
              {field.type === "text" && (
                <Input
                  placeholder={field.placeholder || "Ketik jawaban di sini..."}
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  error={errors[field.id]}
                />
              )}

              {/* Teks Panjang */}
              {field.type === "textarea" && (
                <Textarea
                  placeholder={field.placeholder || "Ketik jawaban lengkap di sini..."}
                  rows={3}
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  error={errors[field.id]}
                />
              )}

              {/* Angka */}
              {field.type === "number" && (
                <Input
                  type="number"
                  placeholder="Masukkan angka..."
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  error={errors[field.id]}
                />
              )}

              {/* Email */}
              {field.type === "email" && (
                <Input
                  type="email"
                  placeholder="nama@domain.com"
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  error={errors[field.id]}
                />
              )}

              {/* Phone */}
              {field.type === "phone" && (
                <Input
                  type="tel"
                  placeholder="08123456789"
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  error={errors[field.id]}
                />
              )}

              {/* Tanggal */}
              {field.type === "date" && (
                <Input
                  type="date"
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  error={errors[field.id]}
                />
              )}

              {/* Dropdown */}
              {field.type === "select" && (
                <Select
                  value={answers[field.id] || ""}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  error={errors[field.id]}
                >
                  <option value="">Pilih salah satu...</option>
                  {(field.options || []).map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              )}

              {/* Pilihan Tunggal (Radio) */}
              {field.type === "radio" && (
                <div className="space-y-2 pt-1">
                  {(field.options || []).map((opt, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-[6px] border border-border hover:bg-muted cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={field.id}
                        checked={answers[field.id] === opt}
                        onChange={() => setAnswers({ ...answers, [field.id]: opt })}
                        className="w-4 h-4 text-primary accent-primary"
                      />
                      <span className="text-xs text-text-primary font-medium">{opt}</span>
                    </label>
                  ))}
                  {errors[field.id] && (
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary pt-1">
                      <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />
                      {errors[field.id]}
                    </p>
                  )}
                </div>
              )}

              {/* Pilihan Ganda (Checkbox) */}
              {field.type === "checkbox" && (
                <div className="space-y-2 pt-1">
                  {(field.options || []).map((opt, i) => {
                    const currentArr = (answers[field.id] as string[]) || [];
                    const isChecked = currentArr.includes(opt);
                    return (
                      <label
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-[6px] border border-border hover:bg-muted cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAnswers({
                                ...answers,
                                [field.id]: [...currentArr, opt],
                              });
                            } else {
                              setAnswers({
                                ...answers,
                                [field.id]: currentArr.filter((item) => item !== opt),
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-border accent-primary"
                        />
                        <span className="text-xs text-text-primary font-medium">{opt}</span>
                      </label>
                    );
                  })}
                  {errors[field.id] && (
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary pt-1">
                      <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />
                      {errors[field.id]}
                    </p>
                  )}
                </div>
              )}

              {/* Rating 1-5 */}
              {field.type === "rating" && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setAnswers({ ...answers, [field.id]: star })}
                        className={cn(
                          "w-11 h-11 rounded-[6px] border text-sm font-mono font-bold flex items-center justify-center transition-colors",
                          answers[field.id] === star
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted text-text-primary"
                        )}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                  {errors[field.id] && (
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary pt-1">
                      <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />
                      {errors[field.id]}
                    </p>
                  )}
                </div>
              )}

              {/* Linear Scale (NPS) */}
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
                        onClick={() => setAnswers({ ...answers, [field.id]: val })}
                        className={cn(
                          "w-9 h-9 rounded-[4px] border text-xs font-mono font-semibold flex items-center justify-center shrink-0 transition-colors",
                          answers[field.id] === val
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted text-text-primary"
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1">
                    <span>{field.linear_scale_min_label || "Terendah"}</span>
                    <span>{field.linear_scale_max_label || "Tertinggi"}</span>
                  </div>
                  {errors[field.id] && (
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary pt-1">
                      <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />
                      {errors[field.id]}
                    </p>
                  )}
                </div>
              )}

              {/* File Upload */}
              {field.type === "file_upload" && (
                <div className="p-8 border border-dashed border-border rounded-[6px] text-center space-y-2 hover:bg-muted/50 cursor-pointer">
                  <p className="text-xs font-semibold text-text-primary">
                    Pilih dokumen atau seret ke sini
                  </p>
                  <p className="text-[11px] text-text-secondary">Maksimal ukuran berkas 10 MB</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          {currentSection > 1 ? (
            <Button
              variant="outline"
              onClick={handlePreviousSection}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </Button>
          ) : (
            <div />
          )}

          {currentSection < maxSection ? (
            <Button onClick={handleNextSection} className="gap-2">
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              <Send className="w-4 h-4" />
              {isSubmitting ? "Mengirim Respons..." : "Kirim Jawaban"}
            </Button>
          )}
        </div>

        {/* Footer */}
        {form.settings.show_branding && (
          <footer className="text-center pt-8 pb-12 border-t border-border">
            <p className="text-[11px] font-mono text-text-secondary">Dibuat dengan Tanggap</p>
          </footer>
        )}
      </div>
    </div>
  );
}

