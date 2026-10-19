"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { Form, FormField, FieldType } from "@/types";
import { FieldCard } from "@/components/builder/field-card";
import { PropertiesPanel } from "@/components/builder/properties-panel";
import { SettingsTab } from "@/components/builder/settings-tab";
import { PreviewTab } from "@/components/builder/preview-tab";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  ExternalLink,
  Plus,
  Eye,
  Sliders,
  Settings as SettingsIcon,
  HelpCircle,
  Copy,
} from "lucide-react";

export default function FormBuilderPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"builder" | "settings" | "preview">("builder");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/forms/${formId}`);
        const data = await res.json();
        if (data.form) {
          setForm(data.form);
          if (data.form.fields?.length > 0) {
            setSelectedFieldId(data.form.fields[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load form", err);
      }
    }
    loadForm();
  }, [formId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!form || !over || active.id === over.id) return;

    const fields = form.fields || [];
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(fields, oldIndex, newIndex).map((field, idx) => ({
        ...field,
        position: idx + 1,
      }));
      setForm({ ...form, fields: reordered });
      setSaveStatus("unsaved");
    }
  };

  const handleAddField = (type: FieldType) => {
    if (!form) return;
    const newFieldId = `fld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const currentFields = form.fields || [];

    let defaultLabel = "Pertanyaan Baru";
    let defaultOptions: string[] = [];

    switch (type) {
      case "text":
        defaultLabel = "Pertanyaan Teks Pendek";
        break;
      case "textarea":
        defaultLabel = "Pertanyaan Teks Panjang";
        break;
      case "number":
        defaultLabel = "Berapa jumlah atau nominal?";
        break;
      case "email":
        defaultLabel = "Alamat Email Responden";
        break;
      case "phone":
        defaultLabel = "Nomor Telepon / WhatsApp";
        break;
      case "date":
        defaultLabel = "Pilih Tanggal Kegiatan";
        break;
      case "radio":
        defaultLabel = "Pilihan Tunggal (Pilih Satu)";
        defaultOptions = ["Opsi 1", "Opsi 2", "Opsi 3"];
        break;
      case "select":
        defaultLabel = "Pilihan Dropdown";
        defaultOptions = ["Pilihan A", "Pilihan B", "Pilihan C"];
        break;
      case "checkbox":
        defaultLabel = "Pilihan Ganda (Bisa Lebih Dari Satu)";
        defaultOptions = ["Pilihan 1", "Pilihan 2", "Pilihan 3"];
        break;
      case "rating":
        defaultLabel = "Penilaian Kepuasan (Rating 1-5)";
        defaultOptions = ["1", "2", "3", "4", "5"];
        break;
      case "linear_scale":
        defaultLabel = "Skala Rekomendasi (NPS 0-10)";
        break;
      case "file_upload":
        defaultLabel = "Unggah Dokumen atau Berkas Lampiran";
        break;
    }

    const newField: FormField = {
      id: newFieldId,
      position: currentFields.length + 1,
      type,
      label: defaultLabel,
      required: false,
      options: defaultOptions,
      section: 1,
    };

    setForm({
      ...form,
      fields: [...currentFields, newField],
    });
    setSelectedFieldId(newFieldId);
    setSaveStatus("unsaved");
  };

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!form) return;
    const updatedFields = (form.fields || []).map((f) =>
      f.id === fieldId ? { ...f, ...updates } : f
    );
    setForm({ ...form, fields: updatedFields });
    setSaveStatus("unsaved");
  };

  const handleDuplicateField = (fieldId: string) => {
    if (!form) return;
    const currentFields = form.fields || [];
    const sourceField = currentFields.find((f) => f.id === fieldId);
    if (!sourceField) return;

    const newFieldId = `fld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicatedField: FormField = {
      ...sourceField,
      id: newFieldId,
      label: `${sourceField.label} (Salinan)`,
      position: sourceField.position + 1,
    };

    const targetIdx = currentFields.findIndex((f) => f.id === fieldId);
    const nextFields = [...currentFields];
    nextFields.splice(targetIdx + 1, 0, duplicatedField);

    setForm({
      ...form,
      fields: nextFields.map((f, i) => ({ ...f, position: i + 1 })),
    });
    setSelectedFieldId(newFieldId);
    setSaveStatus("unsaved");
  };

  const handleDeleteField = (fieldId: string) => {
    if (!form) return;
    const currentFields = (form.fields || []).filter((f) => f.id !== fieldId);
    setForm({
      ...form,
      fields: currentFields.map((f, i) => ({ ...f, position: i + 1 })),
    });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(currentFields[0]?.id || null);
    }
    setSaveStatus("unsaved");
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.form) {
        setForm(data.form);
        setSaveStatus("saved");
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan formulir");
      setSaveStatus("unsaved");
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-text-secondary text-sm">
        Memuat builder formulir...
      </div>
    );
  }

  const selectedField = (form.fields || []).find((f) => f.id === selectedFieldId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Builder Bar */}
      <header className="h-14 px-4 md:px-6 border-b border-border bg-surface flex items-center justify-between shrink-0 no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/forms"
            className="p-1.5 rounded-[6px] border border-border text-text-secondary hover:text-text-primary hover:bg-muted"
            title="Kembali ke Daftar Formulir"
          >
            <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          </Link>

          <div>
            <input
              type="text"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                setSaveStatus("unsaved");
              }}
              className="text-sm font-bold text-text-primary bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1"
            />
          </div>

          <StatusBadge status={form.status} />
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-[6px] border border-border">
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "builder"
                ? "bg-surface text-text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Builder
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "bg-surface text-text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            Pengaturan
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "bg-surface text-text-primary shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Pratinjau
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-text-secondary hidden sm:inline-block">
            {saveStatus === "saving"
              ? "Menyimpan..."
              : saveStatus === "unsaved"
              ? "Ada perubahan belum tersimpan"
              : "Semua perubahan tersimpan"}
          </span>

          {form.status === "published" && (
            <Link href={`/f/${form.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                Tautan Publik
              </Button>
            </Link>
          )}

          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </header>

      {/* Main Builder Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {activeTab === "builder" && (
          <>
            {/* Center Canvas */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center">
              <div className="w-full max-w-2xl space-y-6 pb-20">
                {/* Form Heading Card */}
                <div className="p-6 bg-surface border border-border rounded-[8px] space-y-3">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="Judul Formulir..."
                    className="w-full text-xl font-bold text-text-primary bg-transparent focus:outline-none border-b border-transparent hover:border-border focus:border-primary pb-1"
                  />
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });
                      setSaveStatus("unsaved");
                    }}
                    placeholder="Tuliskan deskripsi atau instruksi untuk responden..."
                    className="w-full text-xs text-text-secondary bg-transparent focus:outline-none border-b border-transparent hover:border-border focus:border-primary resize-none leading-relaxed"
                  />
                </div>

                {/* Sortable Field List */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={(form.fields || []).map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {(form.fields || []).length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-border rounded-[8px] text-center space-y-3">
                          <p className="text-sm font-semibold text-text-primary">
                            Belum ada pertanyaan pada form ini
                          </p>
                          <p className="text-xs text-text-secondary">
                            Pilih tipe pertanyaan di bawah untuk mulai menambahkan.
                          </p>
                        </div>
                      ) : (
                        (form.fields || []).map((field) => (
                          <FieldCard
                            key={field.id}
                            field={field}
                            isSelected={field.id === selectedFieldId}
                            onSelect={() => setSelectedFieldId(field.id)}
                            onUpdate={(updates) => handleUpdateField(field.id, updates)}
                            onDuplicate={() => handleDuplicateField(field.id)}
                            onDelete={() => handleDeleteField(field.id)}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Quick Add Questions Toolbar */}
                <div className="p-4 bg-surface border border-border rounded-[8px] space-y-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-text-secondary font-semibold">
                    Tambah Pertanyaan
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { type: "text", label: "Teks Pendek" },
                      { type: "textarea", label: "Teks Panjang" },
                      { type: "number", label: "Angka" },
                      { type: "email", label: "Email" },
                      { type: "phone", label: "Telepon" },
                      { type: "date", label: "Tanggal" },
                      { type: "radio", label: "Pilihan Tunggal" },
                      { type: "select", label: "Dropdown" },
                      { type: "checkbox", label: "Pilihan Ganda" },
                      { type: "rating", label: "Rating (1-5)" },
                      { type: "linear_scale", label: "Skala Linear (NPS)" },
                      { type: "file_upload", label: "Upload File" },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleAddField(item.type as FieldType)}
                        className="px-2.5 py-2 text-xs font-medium text-text-primary border border-border rounded-[6px] hover:bg-muted text-left transition-colors flex items-center justify-between"
                      >
                        <span>{item.label}</span>
                        <Plus className="w-3 h-3 text-text-secondary" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </main>

            {/* Right Properties Panel */}
            <PropertiesPanel
              field={selectedField}
              allFields={form.fields || []}
              onUpdate={(updates) => selectedField && handleUpdateField(selectedField.id, updates)}
              onClose={() => setSelectedFieldId(null)}
            />
          </>
        )}

        {activeTab === "settings" && (
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <SettingsTab
              form={form}
              onUpdate={(updates) => {
                setForm({ ...form, ...updates });
                setSaveStatus("unsaved");
              }}
            />
          </main>
        )}

        {activeTab === "preview" && (
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <PreviewTab form={form} />
          </main>
        )}
      </div>
    </div>
  );
}

