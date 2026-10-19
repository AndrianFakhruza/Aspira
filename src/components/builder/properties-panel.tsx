"use client";

import React from "react";
import { FormField, FieldType } from "@/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sliders, CheckSquare, Sparkles } from "lucide-react";

interface PropertiesPanelProps {
  field: FormField | null;
  allFields: FormField[];
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}

export function PropertiesPanel({ field, allFields, onUpdate, onClose }: PropertiesPanelProps) {
  if (!field) {
    return (
      <aside className="w-80 h-full bg-surface border-l border-border p-6 flex flex-col items-center justify-center text-center text-text-secondary select-none">
        <Sliders className="w-8 h-8 stroke-[1.2] mb-3 opacity-40" />
        <p className="text-sm font-semibold text-text-primary">Panel Properti</p>
        <p className="text-xs text-text-secondary mt-1">
          Pilih salah satu pertanyaan pada kanvas builder untuk mengatur validasi, opsi, dan logikanya.
        </p>
      </aside>
    );
  }

  const handleAddOption = () => {
    const currentOptions = field.options || [];
    onUpdate({
      options: [...currentOptions, `Opsi ${currentOptions.length + 1}`],
    });
  };

  const handleUpdateOption = (index: number, val: string) => {
    const currentOptions = [...(field.options || [])];
    currentOptions[index] = val;
    onUpdate({ options: currentOptions });
  };

  const handleDeleteOption = (index: number) => {
    const currentOptions = [...(field.options || [])];
    if (currentOptions.length <= 1) {
      alert("Pertanyaan pilihan harus memiliki minimal satu opsi.");
      return;
    }
    currentOptions.splice(index, 1);
    onUpdate({ options: currentOptions });
  };

  const otherFields = allFields.filter((f) => f.id !== field.id);

  return (
    <aside className="w-80 h-full bg-surface border-l border-border p-5 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
            Properti Pertanyaan
          </h3>
          <p className="text-sm font-bold text-text-primary capitalize">{field.type}</p>
        </div>
      </div>

      {/* Field Type Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-secondary">Tipe Pertanyaan</label>
        <Select
          value={field.type}
          onChange={(e) => onUpdate({ type: e.target.value as FieldType })}
        >
          <option value="text">Teks Pendek</option>
          <option value="textarea">Teks Panjang</option>
          <option value="number">Angka</option>
          <option value="email">Email</option>
          <option value="phone">Nomor Telepon</option>
          <option value="date">Tanggal</option>
          <option value="radio">Pilihan Tunggal (Radio)</option>
          <option value="select">Dropdown</option>
          <option value="checkbox">Pilihan Ganda (Checkbox)</option>
          <option value="rating">Penilaian / Rating (1-5)</option>
          <option value="linear_scale">Skala Linear (NPS)</option>
          <option value="file_upload">Upload File</option>
        </Select>
      </div>

      {/* Required Toggle */}
      <div className="flex items-center justify-between py-2 border-y border-border">
        <div>
          <p className="text-xs font-semibold text-text-primary">Wajib Diisi</p>
          <p className="text-[11px] text-text-secondary">Responden tidak bisa melewati ini</p>
        </div>
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
        />
      </div>

      {/* Section / Multi-Page */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-secondary">
          Halaman / Bagian (Multi-page)
        </label>
        <Select
          value={field.section}
          onChange={(e) => onUpdate({ section: Number(e.target.value) })}
        >
          <option value={1}>Halaman / Bagian 1</option>
          <option value={2}>Halaman / Bagian 2</option>
          <option value={3}>Halaman / Bagian 3</option>
          <option value={4}>Halaman / Bagian 4</option>
        </Select>
      </div>

      {/* Options manager for Radio, Select, Checkbox */}
      {["radio", "select", "checkbox"].includes(field.type) && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-secondary">Daftar Pilihan</label>
            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs font-medium text-text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Tambah
            </button>
          </div>

          <div className="space-y-2">
            {(field.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleUpdateOption(i, e.target.value)}
                  className="flex-1 h-8 px-2.5 text-xs bg-background border border-border rounded-[4px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteOption(i)}
                  className="p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-muted"
                  title="Hapus opsi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linear scale settings */}
      {field.type === "linear_scale" && (
        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold text-text-secondary">Rentang Skala</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nilai Min"
              type="number"
              value={field.linear_scale_min ?? 0}
              onChange={(e) => onUpdate({ linear_scale_min: Number(e.target.value) })}
            />
            <Input
              label="Nilai Max"
              type="number"
              value={field.linear_scale_max ?? 10}
              onChange={(e) => onUpdate({ linear_scale_max: Number(e.target.value) })}
            />
          </div>
          <Input
            label="Label Kiri (Terendah)"
            placeholder="Contoh: Tidak Mungkin"
            value={field.linear_scale_min_label || ""}
            onChange={(e) => onUpdate({ linear_scale_min_label: e.target.value })}
          />
          <Input
            label="Label Kanan (Tertinggi)"
            placeholder="Contoh: Sangat Merekomendasikan"
            value={field.linear_scale_max_label || ""}
            onChange={(e) => onUpdate({ linear_scale_max_label: e.target.value })}
          />
        </div>
      )}

      {/* Additional Validations */}
      <div className="space-y-3 pt-3 border-t border-border">
        <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
          Validasi Tambahan
        </label>
        {["text", "textarea"].includes(field.type) && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Karakter"
              type="number"
              value={field.validation?.min_length || ""}
              onChange={(e) =>
                onUpdate({
                  validation: {
                    ...field.validation,
                    min_length: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
            <Input
              label="Max Karakter"
              type="number"
              value={field.validation?.max_length || ""}
              onChange={(e) =>
                onUpdate({
                  validation: {
                    ...field.validation,
                    max_length: e.target.value ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>
        )}

        {field.type === "number" && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Nilai Minimum"
              type="number"
              value={field.validation?.min_value ?? ""}
              onChange={(e) =>
                onUpdate({
                  validation: {
                    ...field.validation,
                    min_value: e.target.value !== "" ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
            <Input
              label="Nilai Maksimum"
              type="number"
              value={field.validation?.max_value ?? ""}
              onChange={(e) =>
                onUpdate({
                  validation: {
                    ...field.validation,
                    max_value: e.target.value !== "" ? Number(e.target.value) : undefined,
                  },
                })
              }
            />
          </div>
        )}

        <Input
          label="Pola Regex (Opsional)"
          placeholder="Contoh: ^[A-Z0-9]+$"
          value={field.validation?.regex || ""}
          onChange={(e) =>
            onUpdate({
              validation: {
                ...field.validation,
                regex: e.target.value || undefined,
              },
            })
          }
        />
      </div>

      {/* Branching Logic */}
      <div className="space-y-3 pt-3 border-t border-border">
        <label className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
          Logika Percabangan
        </label>
        {otherFields.length === 0 ? (
          <p className="text-[11px] text-text-secondary">
            Perlu minimal 2 pertanyaan untuk membuat aturan logika kondisional.
          </p>
        ) : (
          (() => {
            const logicList = Array.isArray(field.logic) ? field.logic : [];
            const firstRule = logicList[0];
            return (
              <div className="space-y-2">
                <p className="text-[11px] text-text-secondary">
                  Tampilkan pertanyaan ini hanya jika:
                </p>
                <Select
                  value={firstRule?.target_field_id || ""}
                  onChange={(e) => {
                    const targetId = e.target.value;
                    if (!targetId) {
                      onUpdate({ logic: [] });
                    } else {
                      onUpdate({
                        logic: [
                          {
                            target_field_id: targetId,
                            operator: "equals",
                            value: "",
                            action: "show",
                          },
                        ],
                      });
                    }
                  }}
                >
                  <option value="">Selalu Tampilkan (Tanpa Logika)</option>
                  {otherFields.map((of) => (
                    <option key={of.id} value={of.id}>
                      {of.label}
                    </option>
                  ))}
                </Select>

                {firstRule?.target_field_id && (
                  <Input
                    label="Bernilai sama dengan"
                    placeholder="Jawaban pemicu..."
                    value={String(firstRule.value || "")}
                    onChange={(e) =>
                      onUpdate({
                        logic: [
                          {
                            ...firstRule,
                            value: e.target.value,
                          },
                        ],
                      })
                    }
                  />
                )}
              </div>
            );
          })()
        )}
      </div>
    </aside>
  );
}

