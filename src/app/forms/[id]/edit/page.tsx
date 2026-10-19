"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

    const currentFields = form.fields || [];
    const maxSection = currentFields.reduce((max, f) => Math.max(max, f.section || 1), 1);
    const newPosition = currentFields.length + 1;
    const newFieldId = `fld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let defaultOptions: string[] | undefined = undefined;
    if (["radio", "select", "checkbox"].includes(type)) {
      defaultOptions = ["Pilihan 1", "Pilihan 2", "Pilihan 3"];
    }

    const newField: FormField = {
      id: newFieldId,
      form_id: form.id,
      label: `Pertanyaan Baru (${type})`,
      help_text: "",
      type: type,
      required: false,
      options: defaultOptions,
      position: newPosition,
      section: maxSection,
      linear_scale_min: type === "linear_scale" ? 1 : undefined,
      linear_scale_max: type === "linear_scale" ? 10 : undefined,
      linear_scale_min_label: type === "linear_scale" ? "Sangat Tidak Mungkin" : undefined,
      linear_scale_max_label: type === "linear_scale" ? "Sangat Mungkin" : undefined,
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
            className="p-1.5 rounded-[6px] border border-border text-text-secondary hover:text-text-primary hover:bg-muted transition-colors"
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
        <div className="flex items-center gap-1 bg-muted p-1 rounded-[6px] border border-border relative">
          {[
            { id: "builder", label: "Builder", icon: Sliders },
            { id: "settings", label: "Pengaturan", icon: SettingsIcon },
            { id: "preview", label: "Pratinjau", icon: Eye },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-3 py-1 rounded-[4px] text-xs font-semibold transition-colors flex items-center gap-1.5 z-10 ${
                  isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="builder-tab-active"
                    className="absolute inset-0 bg-surface rounded-[4px] shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
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
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "builder" && (
            <motion.div
              key="builder-tab"
              className="flex-1 flex min-h-0 overflow-hidden w-full"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
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
                        <motion.button
                          key={item.type}
                          type="button"
                          onClick={() => handleAddField(item.type as FieldType)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="px-2.5 py-2 text-xs font-medium text-text-primary border border-border rounded-[6px] hover:bg-muted text-left transition-colors flex items-center justify-between"
                        >
                          <span>{item.label}</span>
                          <Plus className="w-3 h-3 text-text-secondary" />
                        </motion.button>
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
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.main
              key="settings-tab"
              className="flex-1 overflow-y-auto p-6 md:p-8"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <SettingsTab
                form={form}
                onUpdate={(updates) => {
                  setForm({ ...form, ...updates });
                  setSaveStatus("unsaved");
                }}
              />
            </motion.main>
          )}

          {activeTab === "preview" && (
            <motion.main
              key="preview-tab"
              className="flex-1 overflow-y-auto p-6 md:p-8"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <PreviewTab form={form} />
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
