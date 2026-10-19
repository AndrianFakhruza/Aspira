"use client";

import React from "react";
import { Form, FormSettings, FormStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

interface SettingsTabProps {
  form: Form;
  onUpdate: (updates: Partial<Form>) => void;
}

export function SettingsTab({ form, onUpdate }: SettingsTabProps) {
  const settings = form.settings;

  const updateSettings = (key: keyof FormSettings, value: any) => {
    onUpdate({
      settings: {
        ...settings,
        [key]: value,
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8">
      {/* Status & Slug */}
      <div className="p-5 bg-surface border border-border rounded-[8px] space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Status & URL Publik</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Status Formulir</label>
            <Select
              value={form.status}
              onChange={(e) => onUpdate({ status: e.target.value as FormStatus })}
            >
              <option value="draft">Draft (Hanya Tim)</option>
              <option value="published">Aktif (Published / Menerima Respons)</option>
              <option value="closed">Ditutup (Tidak Menerima Respons)</option>
            </Select>
          </div>

          <Input
            label="Slug Tautan Publik"
            value={form.slug}
            onChange={(e) =>
              onUpdate({
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-"),
              })
            }
            helpText={`Tautan: /f/${form.slug}`}
          />
        </div>
      </div>

      {/* Jadwal & Kuota */}
      <div className="p-5 bg-surface border border-border rounded-[8px] space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Jadwal & Kuota Pengisian</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Waktu Buka Otomatis (Opsional)"
            type="datetime-local"
            value={form.opens_at ? form.opens_at.substring(0, 16) : ""}
            onChange={(e) =>
              onUpdate({ opens_at: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
          />

          <Input
            label="Waktu Tutup Otomatis (Opsional)"
            type="datetime-local"
            value={form.closes_at ? form.closes_at.substring(0, 16) : ""}
            onChange={(e) =>
              onUpdate({ closes_at: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
          />
        </div>

        <Input
          label="Batas Kuota Respons Maksimal (Opsional)"
          type="number"
          placeholder="Biarkan kosong untuk tanpa batas"
          value={settings.quota ?? ""}
          onChange={(e) =>
            updateSettings("quota", e.target.value ? Number(e.target.value) : null)
          }
          helpText="Formulir akan otomatis tertutup begitu kuota ini terpenuhi."
        />
      </div>

      {/* Privasi & Identitas */}
      <div className="p-5 bg-surface border border-border rounded-[8px] space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Privasi & Pengumpulan Data</h3>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.is_anonymous}
              onChange={(e) => updateSettings("is_anonymous", e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <div>
              <p className="text-xs font-semibold text-text-primary">Survei Anonim</p>
              <p className="text-xs text-text-secondary">
                Jangan minta atau simpan nama dan email responden secara otomatis.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.limit_one_response}
              onChange={(e) => updateSettings("limit_one_response", e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <div>
              <p className="text-xs font-semibold text-text-primary">
                Batasi 1 Kali Pengisian Per Perangkat
              </p>
              <p className="text-xs text-text-secondary">
                Mencegah pengisian berulang dari browser yang sama.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.show_branding}
              onChange={(e) => updateSettings("show_branding", e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <div>
              <p className="text-xs font-semibold text-text-primary">
                Tampilkan Footer &quot;Dibuat dengan Tanggap&quot;
              </p>
              <p className="text-xs text-text-secondary">
                Dapat dimatikan untuk form dengan kebutuhan internal atau resmi.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Notifikasi & Pesan Sukses */}
      <div className="p-5 bg-surface border border-border rounded-[8px] space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Konfirmasi Pengisian</h3>

        <Textarea
          label="Pesan Terima Kasih"
          rows={3}
          value={settings.thank_you_message}
          onChange={(e) => updateSettings("thank_you_message", e.target.value)}
          helpText="Pesan yang ditampilkan kepada responden setelah berhasil mengirim respons."
        />

        <Input
          label="URL Pengalihan (Redirect URL Opsional)"
          placeholder="https://contoh.com/sukses"
          value={settings.redirect_url || ""}
          onChange={(e) => updateSettings("redirect_url", e.target.value || null)}
          helpText="Jika diisi, responden akan diarahkan ke tautan ini beberapa detik setelah submit."
        />

        <Input
          label="Email Notifikasi Admin (Opsional)"
          placeholder="admin@domain.com"
          value={settings.notify_admin_email || ""}
          onChange={(e) => updateSettings("notify_admin_email", e.target.value || null)}
          helpText="Kirim notifikasi setiap ada responden baru yang mengisi formulir ini."
        />
      </div>
    </div>
  );
}

