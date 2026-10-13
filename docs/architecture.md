# Arsitektur — pemetaan dokumen riset ke implementasi MVP

Sumber keputusan: `deep-research-report (27).md`. Target produk: daftar hadir seminar proposal, **< 500 peserta/event**, GitHub Pages + Google Apps Script + Google Drive.

## Keputusan arsitektur riset vs implementasi ini

| Area | Riset (target produksi) | Implementasi MVP ini | Rasional |
|---|---|---|---|
| Backend | TypeScript/Node.js di Cloud Run | **Google Apps Script Web App** | Riset secara eksplisit memasukkan *Google Apps Script web app* sebagai alternatif MVP/low-volume; kuota (6 menit, 30 eksekusi bersamaan) cukup untuk < 500 peserta |
| Metadata DB | PostgreSQL | **Google Spreadsheet** (7 tabel) | API/data boundary riset menyatakan DB dapat ditukar; Sheets paling alami untuk Apps Script |
| Staging tahan-lama + retry worker | Direkomendasikan produksi | **Tidak ada** — error dapat dicoba ulang dari browser; respons idempoten | Riset: “versi sederhana berisiko rendah dapat menghilangkan staging dan mengembalikan error yang dapat dicoba ulang ke browser” |
| Drive write | `files.create` langsung saat submit | `DriveApp.createFile` saat submit (sinkron) | Setara secara fungsional untuk PNG kecil (multipart) |
| Identitas peserta | Token acak satu-kali / OTP / SSO | **Lookup NIM pada roster tertutup** + sesi token 15 menit (hash SHA-256 di sheet) | UX seminar kampus: peserta memilih nama; token diterbitkan setelah roster cocok; rate limit per NIM |
| Signature capture | Kanvas (rekomendasi) / stylus / PSrE bila perlu | **Kanvas HTML** (finger/stylus), PNG 2:1 | Default riset untuk kehadiran biasa; PSrE tidak diperlukan untuk daftar hadir |
| Penyimpanan tanda tangan | Shared Drive / Drive terbatas | Folder Drive institusi per event, nama berkas `<receipt>.png` (pseudonim) | Riset melarang Git/Git LFS/Pages/Actions sebagai penyimpanan tanda tangan |
| Integritas | SHA-256 + Drive file ID di DB | SHA-256 server-side + `drive_file_id` di sheet | FR-J |
| Idempotency | Idempotency-Key + unique constraint | Unique logis (event, type, nim) → respons dengan receipt lama; `idempotency_key` dicatat | FR-I (tanpa constraint DB fisik — catatan risiko di bawah) |
| Privacy notice | Versi immutable + acknowledge terpisah dari afirmasi kehadiran | Dua checkbox terpisah; `notice_version` disimpan per baris | FR-C/FR-D |
| CI/CD | GitHub OIDC → WIF → Cloud Run | Tidak ada backend yang di-deploy via CI; Pages statis manual | Tidak ada kredensial cloud di GitHub sama sekali |
| Admin | Dashboard status + export terpisah permission | `admin.html` + key admin + ekspor `.docx` | FR-K/FR-L sederhana |

## Alur data (implementasi)

```text
Peserta (browser, GitHub Pages)
   │  GET  ?route=roster          → daftar nama + event + versi privasi
   │  POST text/plain route=verify → sesi token (hash disimpan)
   │  POST text/plain route=submit → PNG canvas (≤250KB, magic-byte dicek)
   ▼
Google Apps Script (doGet/doPost)
   ├── rate limit (sheet ratelimit)
   ├── validasi sesi + afirmasi terpisah
   ├── SHA-256 (Utilities.computeDigest)
   ├── Drive: <event_id>/<receipt>.png  (deskripsi berisi event/type/sha256)
   ├── Sheet: submissions / audiens / audit
   └── respons: receipt DH-YYYY-XXXXXXXX + status stored
```

## Penyimpangan yang disadari & risiko yang diterima

1. **Tidak ada staging tahan-lama.** Bila Drive error di tengah request, peserta menerima error dan dapat mengulang; baris `submissions` baru ditulis setelah Drive sukses (submit = transaksi “longgar” satu arah: Drive dulu, metadata menyusul). Risiko: file PNG yatim (ada di Drive tanpa baris sheet) bila sheet gagal persis setelah Drive sukses — frekuensi sangat rendah; deteksi manual via folder event. Pada produksi organisasi, gunakan pola staging+retry riset.
2. **Tidak ada unique constraint fisik.** Penguncian idempoten dilakukan dengan baca-lalu-tulis; dua submit NIM sama secara bersamaan-bersamaan (milidetik) berpotensi ganda. Mitigasi MVP: rate limit per NIM; Apps Script mengeksekusi per-deploy dengan konkurensi terbatas.
3. **CORS** memakai trik `text/plain` yang umum untuk Apps Script; ini pola yang diterima luas tetapi bukan REST formal. Bila pindah ke Cloud Run, kembali ke JSON + CORS allowlist ketat.
4. **Skala** dibatasi kuota Apps Script dan ukuran sheet (puluhan ribu baris mulai lambat). < 500 peserta/event × beberapa event per semester berada jauh di bawah batas itu.
5. **Drive scope penuh** (`drive`) dipakai karena `DriveApp` memerlukannya; berbeda dengan rekomendasi riset `drive.file` untuk service account. Desktop kredensial pemilik prodi adalah pengendali; audit aksi ada di sheet `audit` + log Google.
6. **Kepemilikan data**: ekspor dibuat di folder milik akun pelaksana (Execute as: Me). Untuk Shared Drive institusi, pindahkan folder root ke Shared Drive dan tambahkan akun pelaksana sebagai content manager.

## Bila naik kelas ke produksi organisasi

Ikuti arsitektur riset: Cloud Run (TypeScript) + PostgreSQL + staging terenkripsi + Shared Drive + service account dedicated + GitHub Actions via OIDC/WIF + (opsional) webhook Drive untuk deteksi perubahan balik. Batas ukuran bersih: UI Pages tetap; hanya backend yang diganti — kontrak API di riset (`POST /v1/events/{id}/attendance`, multipart, Bearer) adalah target migrasi.

## Pemetaan fitur → berkas

| Fitur (riset) | Berkas |
|---|---|
| Router HTTP | `appsscript/Web.gs` |
| Sesi, rate limit, verifikasi NIM | `appsscript/Auth.gs` |
| Submit, idempotensi, receipt | `appsscript/Attendance.gs` |
| Validasi PNG + SHA-256 + Drive | `appsscript/Signature.gs` |
| Skema metadata | `appsscript/Sheets.gs`, `Config.gs` |
| Admin + audit | `appsscript/Admin.gs` |
| Ekspor `.docx` format DAFTAR HADIR | `appsscript/Export.gs` |
| Seed jadwal (22 peserta) | `appsscript/Seed.gs`, `data/jadwal-ganjil-2026-2027.json` |
| UI peserta/audiens/admin | `frontend/*` |
