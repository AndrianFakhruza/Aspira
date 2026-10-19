"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-2">
            <Logo size="lg" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Atur Ulang Sandi</h1>
          <p className="text-xs text-text-secondary">
            Masukkan email terdaftar untuk menerima tautan pemulihan kata sandi.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-none">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">
                <Check className="w-5 h-5 stroke-[2]" />
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Tautan pemulihan kata sandi telah dikirim ke <strong>{email}</strong> jika terdaftar di sistem.
              </p>
              <Link href="/login" className="inline-block pt-2">
                <Button variant="outline" size="sm">
                  Kembali ke Halaman Masuk
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Alamat Email Akun"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@domain.com"
                required
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mengirim Tautan..." : "Kirim Tautan Pemulihan"}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke Masuk
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

