"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Slash,
  Send,
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

        const storageKey = `tanggap_draft_${found.id}`;
        try {
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.answers) setAnswers(parsed.answers);
            if (parsed.respondentName) setRespondentName(parsed.respondentName);
            if (parsed.respondentEmail) setRespondentEmail(parsed.respondentEmail);
          }
        } catch {}
      } catch (err) {
        setFormStatusNotice("Terjadi kendala saat memuat formulir.");
      } finally {
        setLoading(false);
      }
    }
    loadPublicForm();
  }, [slug]);

  useEffect(() => {
    if (form?.id && Object.keys(answers).length > 0) {
      const storageKey = `tanggap_draft_${form.id}`;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ answers, respondentName, respondentEmail })
        );
      } catch {}
    }
  }, [answers, respondentName, respondentEmail, form?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-text-secondary text-sm">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Memuat formulir...
        </motion.div>
      </div>
    );
  }

  if (formStatusNotice || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-surface border border-border rounded-[8px] p-8 text-center space-y-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center mx-auto text-text-secondary">
            <Slash className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">Informasi Formulir</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            {formStatusNotice || "Formulir tidak tersedia."}
          </p>
        </motion.div>
      </div>
    );
  }

  const fields = form.fields || [];
  const maxSection = Math.max(...fields.map((f) => f.section || 1), 1);

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
          } catch {}
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
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="max-w-md w-full bg-surface border border-border rounded-[8px] p-8 text-center space-y-5 shadow-dropdown"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", damping: 15, stiffness: 350 }}
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto"
          >
            <Check className="w-7 h-7 stroke-[2]" />
          </motion.div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            Respons Berhasil Dikirim
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
            {successMessage}
          </p>
          {form.settings.show_branding && (
            <div className="pt-6 border-t border-border">
              <p className="text-[11px] text-text-secondary">Dibuat dengan Tanggap</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Form Title & Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-[8px] p-6 md:p-8 space-y-3 shadow-xs"
        >
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{form.title}</h1>
          {form.description && (
            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
              {form.description}
            </p>
          )}

          {/* Progress bar if multi-page */}
          {maxSection > 1 && (
            <div className="pt-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-text-secondary font-medium">
                <span>
                  Bagian {currentSection} dari {maxSection}
                </span>
                <span>{Math.round((currentSection / maxSection) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={false}
                  animate={{ width: `${(currentSection / maxSection) * 100}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Section Content with Slide Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-4"
          >
            {/* Identity Inputs for Non-Anonymous Surveys */}
            {!form.settings.is_anonymous && currentSection === 1 && (
              <div className="bg-surface border border-border rounded-[8px] p-6 md:p-8 space-y-4 shadow-xs">
                <h3 className="text-xs uppercase tracking-wider text-text-secondary font-semibold">
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
            {currentFields.map((field, fIdx) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: fIdx * 0.04 }}
                className="bg-surface border border-border rounded-[8px] p-6 md:p-8 space-y-3 shadow-xs hover:border-text-secondary/30 transition-colors"
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

                {field.type === "text" && (
                  <Input
                    placeholder={field.placeholder || "Ketik jawaban di sini..."}
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                    error={errors[field.id]}
                  />
                )}

                {field.type === "textarea" && (
                  <Textarea
                    placeholder={field.placeholder || "Ketik jawaban lengkap di sini..."}
                    rows={3}
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                    error={errors[field.id]}
                  />
                )}

                {field.type === "number" && (
                  <Input
                    type="number"
                    placeholder="Masukkan angka..."
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                    error={errors[field.id]}
                  />
                )}

                {field.type === "email" && (
                  <Input
                    type="email"
                    placeholder="nama@domain.com"
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                    error={errors[field.id]}
                  />
                )}

                {field.type === "phone" && (
                  <Input
                    type="tel"
                    placeholder="08123456789"
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                    error={errors[field.id]}
                  />
                )}

                {field.type === "date" && (
                  <Input
                    type="date"
                    value={answers[field.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                    error={errors[field.id]}
                  />
                )}

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

                {field.type === "radio" && (
                  <div className="space-y-2 pt-1">
                    {(field.options || []).map((opt, i) => {
                      const isSelected = answers[field.id] === opt;
                      return (
                        <motion.label
                          key={i}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-[6px] border cursor-pointer transition-all",
                            isSelected
                              ? "border-text-primary bg-muted/60 ring-1 ring-text-primary"
                              : "border-border hover:bg-muted/40"
                          )}
                        >
                          <input
                            type="radio"
                            name={field.id}
                            checked={isSelected}
                            onChange={() => setAnswers({ ...answers, [field.id]: opt })}
                            className="w-4 h-4 text-primary accent-primary"
                          />
                          <span className="text-xs text-text-primary font-medium">{opt}</span>
                        </motion.label>
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

                {field.type === "checkbox" && (
                  <div className="space-y-2 pt-1">
                    {(field.options || []).map((opt, i) => {
                      const currentArr = (answers[field.id] as string[]) || [];
                      const isChecked = currentArr.includes(opt);
                      return (
                        <motion.label
                          key={i}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-[6px] border cursor-pointer transition-all",
                            isChecked
                              ? "border-text-primary bg-muted/60 ring-1 ring-text-primary"
                              : "border-border hover:bg-muted/40"
                          )}
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
                        </motion.label>
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

                {field.type === "rating" && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          type="button"
                          key={star}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => setAnswers({ ...answers, [field.id]: star })}
                          className={cn(
                            "w-11 h-11 rounded-[6px] border text-sm font-bold flex items-center justify-center transition-colors cursor-pointer",
                            answers[field.id] === star
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "border-border hover:bg-muted text-text-primary"
                          )}
                        >
                          {star}
                        </motion.button>
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

                {field.type === "linear_scale" && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {Array.from(
                        { length: (field.linear_scale_max ?? 10) - (field.linear_scale_min ?? 0) + 1 },
                        (_, i) => (field.linear_scale_min ?? 0) + i
                      ).map((val) => (
                        <motion.button
                          type="button"
                          key={val}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => setAnswers({ ...answers, [field.id]: val })}
                          className={cn(
                            "w-9 h-9 rounded-[4px] border text-xs font-semibold flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                            answers[field.id] === val
                              ? "bg-primary text-primary-foreground border-primary shadow-xs"
                              : "border-border hover:bg-muted text-text-primary"
                          )}
                        >
                          {val}
                        </motion.button>
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

                {field.type === "file_upload" && (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="p-8 border border-dashed border-border rounded-[6px] text-center space-y-2 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <p className="text-xs font-semibold text-text-primary">
                      Pilih dokumen atau seret ke sini
                    </p>
                    <p className="text-[11px] text-text-secondary">Maksimal ukuran berkas 10 MB</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

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
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 shadow-sm">
              <Send className="w-4 h-4" />
              {isSubmitting ? "Mengirim Respons..." : "Kirim Jawaban"}
            </Button>
          )}
        </div>

        {/* Footer */}
        {form.settings.show_branding && (
          <footer className="text-center pt-8 pb-12 border-t border-border">
            <p className="text-[11px] text-text-secondary">Dibuat dengan Tanggap</p>
          </footer>
        )}
      </div>
    </div>
  );
}
