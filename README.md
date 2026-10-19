# Tanggap

**Platform Form Builder, Survei & Analisis Respons**  
*Kumpulkan respons, pahami hasilnya*  
Versi 3.0 · Oktober 2026

Tanggap adalah platform web modern untuk membuat formulir dinamis, menyebarkan survei publik responsif, serta menganalisis data respons secara kuantitatif dan naratif otomatis.

---

## 1. Fitur Utama

- **Form Builder Visual:**
  - Drag-and-drop urutan pertanyaan dengan `@dnd-kit`.
  - Berbagai tipe field: Teks Pendek, Teks Panjang, Angka, Email, Telepon, Tanggal, Pilihan Tunggal (Radio), Dropdown, Pilihan Ganda (Checkbox), Rating (1–5), Skala Linear (NPS 0–10), dan Upload Berkas.
  - Validasi per field: Wajib diisi, batas panjang karakter, rentang angka, dan regex kustom.
  - Multi-halaman (Sections) dengan indikator kemajuan (progress bar).
  - Logika percabangan kondisional (conditional branching logic).
  - Pratinjau langsung untuk tampilan Desktop & Mobile (360px+).
  - Template survei siap pakai: Kepuasan Pelanggan (CSAT/NPS), Evaluasi Acara, Pendaftaran Peserta.

- **Formulir Publik (`/f/[slug]`):**
  - Desain modern monokrom profesional, aksesibilitas tinggi (WCAG 2.1 AA), navigasi keyboard penuh.
  - Penyimpanan draf lokal di peramban otomatis (auto-save draft restore).
  - Pengaturan fleksibel: Survei anonim atau mengumpulkan identitas (Nama & Email).
  - Kontrol jadwal buka/tutup dan batas kuota pengisian.
  - Opsi pesan terima kasih kustom dan URL pengalihan (redirect).

- **Manajemen Respons & Analisis:**
  - Tabel respons server-side dengan pencarian, pemilahan, dan pagination.
  - Detail jawaban responden per baris dan penghapusan data.
  - Ekspor data asli ke format Excel (`.xlsx` via ExcelJS) dan CSV.
  - Ringkasan naratif otomatis berbasis aturan (rule-based executive narrative).
  - Grafik visualisasi monokrom dengan Recharts (Distribusi jawaban, tren pengisian harian, rata-rata rating, dan skor NPS).

- **Manajemen Tim & Keamanan:**
  - Peran anggota tim: Owner, Editor, dan Viewer.
  - Undangan kolaborator dan pengaturan hak akses.
  - Log audit lengkap untuk riwayat aktivitas dan transparansi.
  - Database Supabase Postgres dengan Row Level Security (RLS) di semua tabel.

---

## 2. Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling & UI:** Tailwind CSS, Lucide Icons, Shadcn-style monochrome tokens
- **Database & Auth:** Supabase Postgres & Supabase Auth (`@supabase/ssr`)
- **Visualisasi & Drag-and-Drop:** Recharts, `@dnd-kit/core`, `@dnd-kit/sortable`
- **Ekspor:** ExcelJS
- **Hosting / Deploy:** Vercel

---

## 3. Menjalankan Aplikasi Secara Lokal

1. Pasang dependensi:
   ```bash
   npm install
   ```

2. Konfigurasi variabel lingkungan:
   Salin `.env.example` ke `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Aplikasi dilengkapi dengan fallback penyimpanan memori/mock yang kaya fitur sehingga dapat langsung diuji secara lokal bahkan sebelum menghubungkan kredensial Supabase).*

3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

4. Membuat build produksi:
   ```bash
   npm run build
   npm run start
   ```

---

## 4. Setup Database Supabase

Untuk menghubungkan database produksi di Supabase:
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Jalankan skrip SQL yang tersedia di `supabase/schema.sql` pada menu **SQL Editor** Supabase.
3. Masukkan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` pada `.env.local` atau pengaturan Environment Variables di Vercel.

---

## 5. Lisensi

Hak Cipta © 2026 Tanggap. Dilindungi Undang-Undang.

