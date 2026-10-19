"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { triggerNavigationProgress } from "@/components/ui/navigation-progress";

export default function NewFormPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    triggerNavigationProgress();

    async function create() {
      try {
        const res = await fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Formulir Baru",
            description: "Silakan lengkapi formulir ini dengan informasi yang sesuai.",
            status: "draft",
            fields: [
              {
                position: 1,
                type: "text",
                label: "Pertanyaan Pertama",
                required: true,
                section: 1,
              },
            ],
          }),
        });

        const data = await res.json();
        if (data.form?.id && isMounted) {
          router.replace(`/forms/${data.form.id}/edit`);
        } else if (isMounted) {
          setError(data.error || "Gagal membuat formulir baru.");
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e?.message || "Terjadi kendala saat menghubungi server.");
        }
      }
    }

    create();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm p-8 bg-surface border border-border rounded-[16px] shadow-sm text-center space-y-5"
      >
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        {error ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <button
              onClick={() => router.push("/forms")}
              className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-[8px] hover:opacity-90 transition-opacity"
            >
              Kembali ke Formulir
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2.5 text-blue-600">
              <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-sm font-bold text-text-primary">Menyiapkan Formulir...</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Membuat lembar kerja formulir baru dan mengalihkan Anda ke Form Builder.
            </p>
            <div className="w-3/4 mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
