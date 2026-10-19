"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@tanggap.id");
  const [password, setPassword] = useState("tanggap2026");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center pb-2">
            <Logo size="lg" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Masuk ke Tanggap</h1>
          <p className="text-xs text-text-secondary">
            Kumpulkan respons, pahami hasilnya. Masuk untuk mengelola survei.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-[8px] p-6 shadow-none">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@domain.com"
              required
            />

            <Input
              label="Kata Sandi"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border accent-primary cursor-pointer"
                />
                <span>Ingat saya</span>
              </label>
              <Link
                href="/reset-password"
                className="font-medium text-text-primary hover:underline"
              >
                Lupa sandi?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses Masuk..." : "Masuk"}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] font-mono text-text-secondary">
          Platform Form Builder & Analisis Respons v3.0
        </p>
      </div>
    </div>
  );
}

