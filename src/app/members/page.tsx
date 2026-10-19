"use client";

import React, { useState, useEffect } from "react";
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                Anggota & Hak Akses
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Kelola kolaborator workspace dan kontrol izin akses (Owner, Editor, Viewer).
              </p>
            </div>
            <Button onClick={() => setInviteOpen(true)} className="gap-2">
              <UserPlus className="w-4 h-4 stroke-[1.5]" />
              Undang Anggota
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-muted border-b border-border text-xs uppercase font-mono text-text-secondary">
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
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-text-secondary">
                      Memuat daftar anggota...
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/40 transition-colors h-14">
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        {member.full_name}
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
                          className="h-8 text-xs py-1"
                        >
                          <option value="owner">Owner</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </Select>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-text-secondary">
                        {formatDate(member.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {member.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveMember(member.id, member.full_name)}
                            className="p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-muted"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="w-4 h-4 stroke-[1.5]" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

