"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { RoleBadge } from "@/components/ui/badge";
import { Profile, UserRole } from "@/types";
import { formatDate } from "@/lib/utils";
import { Users, UserPlus, Trash2, Shield, Mail } from "lucide-react";

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.35 } },
  exit: { opacity: 0, x: -16, transition: { duration: 0.2 } },
};

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("editor");
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (data.members) setMembers(data.members);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;

    setSubmitting(true);
    try {
      await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newName,
          email: newEmail,
          role: newRole,
        }),
      });
      setInviteOpen(false);
      setNewEmail("");
      setNewName("");
      await fetchMembers();
    } catch (err) {
      alert("Gagal menambahkan anggota.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (id: string, role: UserRole) => {
    await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await fetchMembers();
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (confirm(`Hapus akses anggota "${name}" dari workspace?`)) {
      await fetch(`/api/members/${id}`, { method: "DELETE" });
      await fetchMembers();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar breadcrumb={[{ label: "Anggota Workspace" }]} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                Anggota &amp; Hak Akses
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Kelola kolaborator workspace dan kontrol izin akses (Owner, Editor, Viewer).
              </p>
            </div>
            <Button onClick={() => setInviteOpen(true)} className="gap-2">
              <UserPlus className="w-4 h-4 stroke-[1.5]" />
              Undang Anggota
            </Button>
          </motion.div>

          <motion.div
            className="bg-surface border border-border rounded-[10px] overflow-hidden shadow-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted/70 border-b border-border text-xs uppercase font-mono text-text-secondary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nama Lengkap</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold w-40">Peran</th>
                  <th className="py-3 px-4 font-semibold w-36">Bergabung</th>
                  <th className="py-3 px-4 font-semibold text-right w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="h-14 animate-pulse">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-muted/80 shrink-0" />
                          <div className="w-32 h-4 bg-muted/80 rounded" />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-40 h-3.5 bg-muted/60 rounded" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-28 h-8 bg-muted/70 rounded-[6px]" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-20 h-3.5 bg-muted/60 rounded" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="w-7 h-7 bg-muted/50 rounded-[6px] ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <AnimatePresence>
                    {members.map((member) => (
                      <motion.tr
                        key={member.id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all h-14 group"
                      >
                        <td className="py-3 px-4 font-semibold text-text-primary group-hover:text-blue-600 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {member.full_name.charAt(0).toUpperCase()}
                            </span>
                            <span>{member.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-text-secondary font-mono text-xs">
                          {member.email || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <Select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as UserRole)
                            }
                            className="h-8 text-xs py-1 border-blue-200/80 focus:border-blue-500"
                          >
                            <option value="owner">Owner (Pemilik)</option>
                            <option value="editor">Editor (Pengelola)</option>
                            <option value="viewer">Viewer (Peninjau)</option>
                          </Select>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">
                          {formatDate(member.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {member.role !== "owner" && (
                            <button
                              onClick={() => handleRemoveMember(member.id, member.full_name)}
                              className="p-1.5 text-text-secondary hover:text-rose-600 rounded-md hover:bg-rose-50 transition-all hover:scale-115"
                              title="Hapus Anggota"
                            >
                              <Trash2 className="w-4 h-4 stroke-[1.5]" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </motion.div>
        </main>
      </div>

      <Dialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Undang Anggota Baru"
        description="Tambahkan pengguna baru ke workspace Tanggap Anda."
      >
        <form onSubmit={handleInvite} className="space-y-4 py-2">
          <Input
            label="Nama Lengkap"
            placeholder="Contoh: Rian Pratama"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <Input
            label="Alamat Email"
            type="email"
            placeholder="nama@domain.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Pilih Peran / Akses</label>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            >
              <option value="editor">Editor (Dapat membuat dan mengedit formulir)</option>
              <option value="viewer">Viewer (Hanya dapat melihat respons dan laporan)</option>
              <option value="owner">Owner (Akses penuh termasuk pengaturan workspace)</option>
            </Select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInviteOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Mengundang..." : "Kirim Undangan"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
