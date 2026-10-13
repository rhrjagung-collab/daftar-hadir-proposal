# Daftar Hadir Seminar Proposal Skripsi — GitHub Pages + Google Apps Script + Google Drive

Aplikasi daftar hadir digital untuk Seminar Proposal Skripsi (≤ **500 peserta per event**).

- **UI statis**: GitHub Pages (`frontend/`) — tanpa data peserta di dalam berkas situs.
- **Backend**: Google Apps Script Web App (`appsscript/`) — autentikasi NIM, validasi PNG, SHA-256, penulisan Drive.
- **Penyimpanan**: Google Drive (berkas tanda tangan PNG) + Google Spreadsheet (metadata) milik prodi.
- **Format dokumen**: ekspor `.docx` meniru format `DAFTAR HADIR.docx` (tabel `NO | NAMA | NIM | TANDA TANGAN | KET` + blok tanda tangan penguji).
- **Referensi jadwal**: 22 peserta dari `Penguji Proposal Skripsi Ganjil 26 27_shared.pdf` sudah di-seed (mapping penguji diverifikasi terhadap baris NIM `2310713062` di `DAFTAR HADIR.docx`).

Arsitektur mengikuti rekomendasi dokumen riset (`deep-research-report (27).md`) untuk jalur MVP Apps Script: GitHub = kode/UI saja; tanda tangan **tidak pernah** masuk Git/Git LFS/Pages/Actions.

## Struktur proyek

```text
daftar-hadir-app/
├── README.md
├── docs/
│   ├── architecture.md        # Pemetaan keputusan riset → implementasi
│   └── privacy-consent.md     # Template pemberitahuan privasi & catatan PDP
├── appsscript/                # Salin ke proyek Apps Script
│   ├── appsscript.json
│   ├── Config.gs
│   ├── Web.gs
│   ├── Auth.gs
│   ├── Attendance.gs
│   ├── Signature.gs
│   ├── Sheets.gs
│   ├── Admin.gs
│   ├── Export.gs
│   └── Seed.gs
├── frontend/                  # Salin/commit untuk GitHub Pages
│   ├── index.html             # Beranda
│   ├── peserta.html           # Form peserta (roster → verifikasi → tanda tangan)
│   ├── audiens.html           # Form audiens (NIM + nama → tanda tangan)
│   ├── admin.html             # Panel petugas + ekspor .docx
│   ├── privacy.html           # Pemberitahuan privasi (salinan statis PN-2026-10-01)
│   ├── config.js              # ISI WEB_APP_URL setelah deploy
│   ├── css/styles.css
│   ├── js/{api,pad,sigpad,peserta,audiens,admin}.js
│   └── vendor/signature_pad.min.js   # signature_pad v5.0.4 (MIT), dibundel lokal
└── data/
    └── jadwal-ganjil-2026-2027.json  # Sumber seed (dari PDF jadwal)
```

## Prasyarat

1. Akun Google dengan akses Google Drive, Sheets, dan Docs (akun prodi disarankan).
2. GitHub repository untuk GitHub Pages.
3. `clasp` (opsional) atau salin-tempel manual ke editor Apps Script.

## A. Setup backend (Google Apps Script)

1. Buka [script.google.com](https://script.google.com) → **New project**.
2. Buat berkas-berkas `.gs` berikut (salin isi dari folder `appsscript/`):
   `Config.gs`, `Web.gs`, `Auth.gs`, `Attendance.gs`, `Signature.gs`, `Sheets.gs`, `Admin.gs`, `Export.gs`, `Seed.gs`.
3. Buka **Project Settings → appsscript.json** (Show "appsscript.json" manifest) dan ganti isinya dengan `appsscript/appsscript.json`.
   **Tidak perlu membuka menu Services (+)** — aplikasi ini hanya memakai layanan bawaan (SpreadsheetApp, DocumentApp, DriveApp).
4. Jalankan fungsi **`setup()`** sekali (Run). Saat diminta, setujui izin (Drive, Sheets, Docs).
   `setup()` membuat:
   - Spreadsheet `Daftar Hadir - DB` (semua tabel metadata),
   - Folder Drive `Daftar Hadir Signatures`,
   - script property `ADMIN_KEY` (20 karakter acak),
   - seed event `EVT-2026G-PROPOSAL` + 22 peserta dari jadwal.
5. Buka **Executions** / Logs dan **salin nilai `ADMIN_KEY`** dari log. Simpan di tempat aman.
6. Deploy: **Deploy → New deployment → Web app**:
   - Description: `daftar-hadir-web`
   - **Execute as: Me**
   - **Who has access: Anyone**
   - Salin URL `/exec` (mis. `https://script.google.com/macros/s/AKfyc.../exec`).
7. Setelah mengubah kode: **Deploy → Manage deployments → Edit → Version: New version → Deploy** (URL tetap sama).

### Script properties (opsional)

| Property | Default | Fungsi |
|---|---|---|
| `ADMIN_KEY` | dibuat `setup()` | Kunci login panel Petugas |
| `PRIVACY_NOTICE_VERSION` | `PN-2026-10-01` | Versi pemberitahuan privasi yang disimpan per pengisian |
| `PRIVACY_NOTICE_TEXT` | teks bawaan `Config.gs` | Teks pemberitahuan privasi (opsional) |

## B. Setup frontend (GitHub Pages)

1. Commit folder `frontend/` ke repository GitHub (struktur bebas; Pages source = folder tersebut atau root).
2. Edit `frontend/config.js`:

   ```js
   window.DH_CONFIG = {
     WEB_APP_URL: 'https://script.google.com/macros/s/AKfyc.../exec',
     EVENT_ID: 'EVT-2026G-PROPOSAL'
   };
   ```

3. Repository **Settings → Pages**: Source = `Deploy from a branch`, branch `main`, folder `/frontend` (atau root jika seluruh repo adalah frontend). Tunggu sampai site aktif (`https://<user>.github.io/<repo>/`).

> Catatan CORS: frontend memanggil Apps Script dengan `POST` + `Content-Type: text/plain` (permintaan sederhana tanpa preflight). Jangan mengubah ke `application/json`.

## C. Alur penggunaan saat seminar

1. **Peserta**: buka `peserta.html` → pilih nama dari jadwal → Verifikasi → centang pemberitahuan privasi + pernyataan kehadiran → tanda tangan di kanvas → Kirim → simpan **receipt** (`DH-2026-XXXXXXXX`).
   Pengulangan kirim dengan NIM yang sama tidak membuat duplikat (respons idempoten; receipt lama dikembalikan).
2. **Audiens**: buka `audiens.html` → isi NIM + nama → alur tanda tangan sama.
3. **Petugas**: buka `admin.html` → login `ADMIN_KEY` → pantau jumlah hadir → **Unduh .docx Daftar Hadir Peserta / Audiens**, atau tombol **Docx** per baris untuk dokumen satu peserta (memakai tim penguji mahasiswa tersebut: Penguji I = Penguji Utama, II = Pembimbing, III = Pendamping).
4. Berkas `.docx` muncul di Drive: `Daftar Hadir Signatures/<event_id>/exports/`. Tanda tangan PNG: `Daftar Hadir Signatures/<event_id>/<receipt>.png` (tanpa nama/NIM pada nama berkas).

### Penguji level event (ekspor banyak peserta)

Blok tanda tangan penguji pada ekspor "semua peserta" memakai tiga nama level event. Isi dari editor Apps Script:

```js
setEventPenguji_('EVT-2026G-PROPOSAL',
  'Dr. Agus Joko Susanto, S.K.M., M.K.K.K.',
  'Dr. Suparni, ST., M.K.K.K',
  'Agung Raharjo, S.K.M., M.K.K.K');
```

(Kosongkan bila lebih suka ekspor per peserta saja.)

## D. Menambah / mengubah jadwal

1. Edit `data/jadwal-ganjil-2026-2027.json` (atau siapkan JSON baru dengan struktur sama).
2. Perbarui konstanta `JADWAL` di `Seed.gs`.
3. Jalankan ulang `seedEvent_()` dari editor (idempoten: hanya menambah NIM yang belum ada).
4. Event baru: tambah baris di sheet `events` dengan `status = ACTIVE` dan `event_id` unik; set `frontend/config.js` `EVENT_ID`.

## E. Kuota & batasan (dipilih untuk < 500 peserta/event)

| Batas | Nilai | Sumber |
|---|---|---|
| Eksekusi Apps Script | ~6 menit/run | Kuota Google |
| Eksekusi bersamaan | 30/user, 1000/script | Kuota Google |
| Ukuran tanda tangan | ≤ 250 KB PNG (downscale otomatis di browser bila lebih) | Konfigurasi aplikasi |
| Kuota audiens/event | 500 | `CFG.MAX_AUDIENS_PER_EVENT` |
| Lookup NIM | 5x / 10 menit / NIM | Rate limit aplikasi |
| Login admin | 10x / 10 menit | Rate limit aplikasi |

Untuk > 500 peserta atau organisasi scale, arsitektur riset merekomendasikan backend Cloud Run + PostgreSQL — lihat `docs/architecture.md`.

## Keamanan & privasi (ringkas)

- Tanda tangan **tidak** disimpan di Git/Git LFS/Pages/Actions (riset: ditolak; Git bukan mekanisme penyimpanan data pribadi).
- Kanvas dirender ulang di browser → PNG tanpa EXIF; server memvalidasi magic bytes PNG + ukuran dan menghitung SHA-256.
- Karakteristik dinamis pena tidak disimpan.
- Token sesi participant (15 menit) di-hash (SHA-256) di sheet; token admin 60 menit.
- Nama berkas Drive pseudonymous (`<receipt>.png`); hubungan identitas ada di spreadsheet.
- Tidak ada kredensial Google di frontend; peserta tidak pernah menyentuh Drive API.
- Aksi admin & pengisian dicatat di sheet `audit`.
- Tanda tangan = tanda kehadiran (bukan PSrE tersertifikasi).
- Retensi/penghapusan: kebijakan prodi — berkas Drive dihapus manual/terjadwal sesuai kebijakan; metadata di sheet. Lihat `docs/privacy-consent.md`.

## Checklist pengujian (sebelum dipakai live)

- [ ] `setup()` selesai; log menunjukkan `ADMIN_KEY`; 22 peserta ada di sheet `peserta`.
- [ ] URL `/exec` menjawab `{"ok":true,...}` untuk `?route=health`.
- [ ] `peserta.html`: roster tampil; NIM tidak terdaftar ditolak; verifikasi sukses.
- [ ] Submit peserta → receipt tampil; file PNG ada di Drive event folder; baris `submissions` berstatus `stored`; `sha256` terisi.
- [ ] Submit ulang NIM sama → respons idempoten (receipt sama, tidak ada baris/baru Drive kedua).
- [ ] Centang tidak lengkap / tanda tangan kosong → ditolak dengan pesan.
- [ ] Audiens: submit sukses; baris `audiens` + `submissions` bertambah; NIM sama tidak diduplikasi.
- [ ] Admin: key salah ditolak; status cocok dengan sheet; ekspor `PESERTA_ALL`, `AUDIENS_ALL`, `PESERTA_ONE` menghasilkan `.docx` dengan gambar tanda tangan pada kolom TANDA TANGAN.
- [ ] GitHub Pages: site tampil; `config.js` berisi URL produksi; **tidak** ada berkas PNG/berkas pribadi di repository.
- [ ] Uji 2–3 device Android/iOS: kanvas dapat ditandatangani dengan jari.

## Troubleshooting

| Gejala | Penyebab / solusi |
|---|---|
| Roster kosong / "Sheet not found" | Jalankan `setup()`; periksa property `DB_SPREADSHEET_ID` |
| Fetch frontend gagal / CORS | Web app belum deploy sebagai **Anyone**; atau Content-Type bukan `text/plain` |
| Ekspor docx gagal "exception" | Pastikan `setup()` sudah pernah dijalankan & izin Docs/Drive disetujui; buka Executions untuk detail error |
| Ekspor docx tanpa gambar | Baris `submissions.drive_file_id` kosong / file dihapus; submit ulang setelah perbaikan |
| `session_expired` saat submit | Sesi 15 menit habis → verifikasi ulang (data tidak hilang) |
| Login admin selalu gagal | `ADMIN_KEY` berbeda antar-project; cek lagi log `setup()` / property |

## Lisensi komponen

- `frontend/vendor/signature_pad.min.js` — Signature Pad v5.0.4, MIT, © Szymon Nowak (dibundel lokal sesuai rekomendasi riset; tanpa CDN).
