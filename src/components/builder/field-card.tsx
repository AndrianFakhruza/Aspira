"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormField } from "@/types";
import { cn } from "@/lib/utils";
import {
  GripVertical,
  Trash2,
  Copy,
  Settings2,
  Check,
  Star,
  Layers,
  ChevronDown,
  Upload,
  Calendar,
  Hash,
  Mail,
  Phone,
  AlignLeft,
  ListFilter,
} from "lucide-react";

interface FieldCardProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function FieldCard({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
}: FieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFieldIcon = () => {
    switch (field.type) {
      case "text":
        return <AlignLeft className="w-3.5 h-3.5" />;
      case "textarea":
        return <AlignLeft className="w-3.5 h-3.5" />;
      case "number":
        return <Hash className="w-3.5 h-3.5" />;
      case "email":
        return <Mail className="w-3.5 h-3.5" />;
      case "phone":
        return <Phone className="w-3.5 h-3.5" />;
      case "date":
        return <Calendar className="w-3.5 h-3.5" />;
      case "radio":
        return <Check className="w-3.5 h-3.5" />;
      case "select":
        return <ChevronDown className="w-3.5 h-3.5" />;
      case "checkbox":
        return <Layers className="w-3.5 h-3.5" />;
      case "rating":
        return <Star className="w-3.5 h-3.5" />;
      case "linear_scale":
        return <ListFilter className="w-3.5 h-3.5" />;
      case "file_upload":
        return <Upload className="w-3.5 h-3.5" />;
      default:
        return <AlignLeft className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "p-4 bg-surface border rounded-[8px] transition-all cursor-pointer relative group",
        isSelected
          ? "border-text-primary ring-1 ring-text-primary shadow-sm"
          : "border-border hover:border-text-secondary/60",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-text-secondary/50 hover:text-text-primary rounded mt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 stroke-[1.5]" />
        </button>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-muted text-text-secondary border border-border">
                {getFieldIcon()}
              </span>
              <span className="text-[11px] font-mono text-text-secondary uppercase">
                {field.type} • Bagian {field.section}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-muted"
                title="Duplikasi Pertanyaan"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-muted"
                title="Hapus Pertanyaan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Editable Label */}
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full font-semibold text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-1 text-text-primary placeholder:text-text-secondary/40"
            placeholder="Ketik pertanyaan di sini..."
          />

          {/* Help text */}
          <input
            type="text"
            value={field.help_text || ""}
            onChange={(e) => onUpdate({ help_text: e.target.value })}
            className="w-full text-xs text-text-secondary bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none py-0.5 placeholder:text-text-secondary/30"
            placeholder="Petunjuk pengisian atau deskripsi tambahan (opsional)..."
          />

          {/* Preview of choices if field has options */}
          {["radio", "select", "checkbox"].includes(field.type) && (
            <div className="pt-2 space-y-1.5">
              {(field.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                  <div
                    className={cn(
                      "w-3.5 h-3.5 border border-border shrink-0",
                      field.type === "radio" ? "rounded-full" : "rounded-[3px]"
                    )}
                  />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          )}

          {field.type === "rating" && (
            <div className="pt-2 flex items-center gap-2 text-text-secondary">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className="w-7 h-7 border border-border rounded flex items-center justify-center text-xs font-mono"
                >
                  {star}
                </div>
              ))}
            </div>
          )}

          {field.type === "linear_scale" && (
            <div className="pt-2 flex items-center gap-1.5 overflow-x-auto text-text-secondary">
              {Array.from(
                { length: (field.linear_scale_max ?? 10) - (field.linear_scale_min ?? 0) + 1 },
                (_, i) => (field.linear_scale_min ?? 0) + i
              ).map((val) => (
                <div
                  key={val}
                  className="w-6 h-6 border border-border rounded flex items-center justify-center text-[10px] font-mono shrink-0"
                >
                  {val}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

