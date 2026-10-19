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

  const getFieldBadge = () => {
    switch (field.type) {
      case "text":
        return { icon: <AlignLeft className="w-3.5 h-3.5" />, color: "bg-blue-50 text-blue-600 border-blue-200" };
      case "textarea":
        return { icon: <AlignLeft className="w-3.5 h-3.5" />, color: "bg-blue-50 text-blue-600 border-blue-200" };
      case "number":
        return { icon: <Hash className="w-3.5 h-3.5" />, color: "bg-cyan-50 text-cyan-600 border-cyan-200" };
      case "email":
        return { icon: <Mail className="w-3.5 h-3.5" />, color: "bg-sky-50 text-sky-600 border-sky-200" };
      case "phone":
        return { icon: <Phone className="w-3.5 h-3.5" />, color: "bg-blue-50 text-blue-600 border-blue-200" };
      case "date":
        return { icon: <Calendar className="w-3.5 h-3.5" />, color: "bg-teal-50 text-teal-600 border-teal-200" };
      case "radio":
        return { icon: <Check className="w-3.5 h-3.5" />, color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "select":
        return { icon: <ChevronDown className="w-3.5 h-3.5" />, color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "checkbox":
        return { icon: <Layers className="w-3.5 h-3.5" />, color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case "rating":
        return { icon: <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />, color: "bg-amber-50 text-amber-600 border-amber-200" };
      case "linear_scale":
        return { icon: <ListFilter className="w-3.5 h-3.5" />, color: "bg-sky-50 text-sky-600 border-sky-200" };
      case "file_upload":
        return { icon: <Upload className="w-3.5 h-3.5" />, color: "bg-rose-50 text-rose-600 border-rose-200" };
      default:
        return { icon: <AlignLeft className="w-3.5 h-3.5" />, color: "bg-muted text-text-secondary border-border" };
    }
  };

  const badge = getFieldBadge();

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "p-4 bg-surface border rounded-[10px] transition-all duration-200 cursor-pointer relative group",
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/10"
          : "border-border hover:border-blue-300/80 hover:shadow-xs",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-text-secondary/50 hover:text-blue-600 rounded mt-0.5 hover:bg-blue-50/50 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 stroke-[1.5]" />
        </button>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={cn("p-1.5 rounded-md border flex items-center justify-center transition-transform group-hover:scale-105", badge.color)}>
                {badge.icon}
              </span>
              <span className="text-[11px] font-mono text-text-secondary uppercase font-medium">
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
                className="p-1.5 text-text-secondary hover:text-blue-600 rounded-md hover:bg-blue-50 transition-all hover:scale-110"
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
                className="p-1.5 text-text-secondary hover:text-rose-600 rounded-md hover:bg-rose-50 transition-all hover:scale-110"
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
            className="w-full font-semibold text-sm bg-transparent border-b border-transparent hover:border-border focus:border-blue-500 focus:outline-none py-1 text-text-primary placeholder:text-text-secondary/40 transition-colors"
            placeholder="Ketik pertanyaan di sini..."
          />

          {/* Help text */}
          <input
            type="text"
            value={field.help_text || ""}
            onChange={(e) => onUpdate({ help_text: e.target.value })}
            className="w-full text-xs text-text-secondary bg-transparent border-b border-transparent hover:border-border focus:border-blue-500 focus:outline-none py-0.5 placeholder:text-text-secondary/30 transition-colors"
            placeholder="Petunjuk pengisian atau deskripsi tambahan (opsional)..."
          />

          {/* Preview of choices if field has options */}
          {["radio", "select", "checkbox"].includes(field.type) && (
            <div className="pt-2 space-y-1.5">
              {(field.options || []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                  <div
                    className={cn(
                      "w-3.5 h-3.5 border border-blue-300 shrink-0 bg-blue-50/50",
                      field.type === "radio" ? "rounded-full" : "rounded-[3px]"
                    )}
                  />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          )}

          {field.type === "rating" && (
            <div className="pt-2 flex items-center gap-2 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className="w-7 h-7 border border-amber-200 bg-amber-50/50 rounded flex items-center justify-center text-xs font-mono font-bold hover:scale-110 transition-transform"
                >
                  ★ {star}
                </div>
              ))}
            </div>
          )}

          {field.type === "linear_scale" && (
            <div className="pt-2 flex items-center gap-1.5 overflow-x-auto text-sky-600">
              {Array.from(
                { length: (field.linear_scale_max ?? 10) - (field.linear_scale_min ?? 0) + 1 },
                (_, i) => (field.linear_scale_min ?? 0) + i
              ).map((val) => (
                <div
                  key={val}
                  className="w-6 h-6 border border-sky-200 bg-sky-50/50 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 hover:scale-110 transition-transform"
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
