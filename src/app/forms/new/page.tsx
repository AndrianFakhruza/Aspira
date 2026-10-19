"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewFormPage() {
  const router = useRouter();

  useEffect(() => {
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
        if (data.form?.id) {
          router.replace(`/forms/${data.form.id}/edit`);
        }
      } catch (e) {
        console.error(e);
      }
    }
    create();
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background text-text-secondary text-sm">
      Membuat formulir baru...
    </div>
  );
}

