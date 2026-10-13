# Pemberitahuan Privasi & catatan kepatuhan (template)

Versi yang aktif di aplikasi: **PN-2026-10-01** (script property `PRIVACY_NOTICE_VERSION`, teks default di `appsscript/Config.gs`).

> Dokumen ini adalah template produk/operasional, **bukan nasihat hukus**. Sesuaikan dengan kebijakan pengendali data (prodi/fakultas) dan konsultasikan ke bagian hukum institusi bila perlu.

## 1. Peran & pengendali data

- **Pengendali data**: Program Studi Kesehatan Masyarakat, Program Sarjana, Fakultas Ilmu Kesehatan UPN "Veteran" Jakarta.
- **Kontak hak subjek data**: Koordinator Program Studi Kesehatan Masyarakat Program Sarjana.
- **Pemroses/infrastruktur**: Google (Drive, Sheets, Apps Script), GitHub (hosting UI statis Pages).

## 2. Inventaris data

| Data | Kategori | Lokasi | Catatan |
|---|---|---|---|
| Nama, NIM | Data umum (nama disebut dalam UU PDP) | Sheet `peserta`/`submissions`/`audiens` | Dibutuhkan untuk kehadiran akademik |
| Gambar tanda tangan (PNG raster) | Data pribadi sensitif praktis; klasifikasi biometrik **tidak otomatis** bila hanya gambar statis tanpa identifikasi unik dinamis | Google Drive `<event>/<receipt>.png` | Riset: perilaku pena (tekanan/kecepatan/timing) **tidak** disimpan agar tidak jatuh ke definisi biometrik dinamis |
| Waktu pengisian, status, receipt, SHA-256 | Metadata | Sheet `submissions` | Bukti integritas & audit |
| Versi pemberitahuan + checkbox | Bukti pemberitahuan | Sheet `submissions` | FR-C/FR-D |
| Log admin | Audit | Sheet `audit` | Tanpa isi tanda tangan |

**Yang tidak dikumpulkan**: foto wajah, lokasi perangkat, IP (tidak dibaca Apps Script), dinamika pena, data pembayaran.

## 3. Dasar pemrosesan (konfigurasi pengendali)

UU No. 27/2022 (PDP) menyediakan beberapa dasar (mis. persetujuan, kewajiban hukum, kepentingan sah). Pemrosesan daftar hadir seminar akademik umumnya bertumpu pada **kewajiban akademik / kepentingan sah penyelenggara**, bukan persetujuan promosi. Aplikasi tetap merekam **acknowledge pemberitahuan** + **pernyataan kehadiran** sebagai dua kontrol terpisah.

Bila institusi memilih persetujuan sebagai dasar, tambahkan checkbox persetujuan pemrosesan eksplisit terpisah dan catat versi teksnya.

## 4. Pemberitahuan kepada subjek data (ringkas)

Teks resmi yang ditampilkan aplikasi (dan disimpan versinya):

```text
Pemberitahuan Privasi Pemrosesan Data Daftar Hadir (versi PN-2026-10-01)

1. Pengendali data: Program Studi Kesehatan Masyarakat, Program Sarjana,
   Fakultas Ilmu Kesehatan, UPN "Veteran" Jakarta.
2. Data yang dikumpulkan: nama, NIM, gambar tanda tangan (raster PNG),
   waktu pengisian, dan status kehadiran.
3. Tujuan pemrosesan: pembukuan kehadiran peserta Seminar Proposal Skripsi
   dan penyusunan berita acara/daftar hadir resmi.
4. Dasar pemrosesan: kepentingan sah penyelenggara serta kewajiban akademik
   penyelenggaraan seminar (dikonfigurasi pengendali data).
5. Penyimpanan: berkas tanda tangan disimpan pada Google Drive institusi;
   metadata pada lembar kerja Google milik prodi. Berkas TIDAK disimpan pada GitHub.
6. Retensi: disimpan selama diperlukan sesuai kebijakan akademik prodi;
   atas permintaan subjek data dapat dilakukan akses, koreksi, atau penghapusan
   melalui Koordinator Program Studi.
7. Hak subjek data sebagaimana UU No. 27 Tahun 2022 dapat diajukan kepada
   Koordinator Program Studi.
8. Tanda tangan adalah gambar raster sebagai tanda kehadiran, BUKAN tanda
   tangan elektronik tersertifikasi (PSrE).
9. Karakteristik dinamis pena TIDAK disimpan.
10. Kontak: Koordinator Program Studi Kesehatan Masyarakat Program Sarjana.
```

Salinan identik ada di `frontend/privacy.html`. Bila teks diubah: perbarui teks default `Config.gs`, `privacy.html`, dan naikkan versi (`PRIVACY_NOTICE_VERSION`).

## 5. Retensi & penghapusan

Tiga jam (ikuti pola riset; belum otomatis di MVP):

| Aset | Penyimpanan primer | Retensi usulan | Penghapusan |
|---|---|---|---|
| PNG tanda tangan | Drive folder event | 1 tahun ajaran / sesuai kebijakan prodi | Hapus folder event / berkas per receipt |
| Metadata & bukti notice | Sheet `submissions` | Ikut kebijakan akademik | Hapus baris terkait (catat di `audit`) |
| Sesi token | Sheet `sessions` | ≤ 24 jam (otomatis dibersihkan) | Otomatis |
| Audit | Sheet `audit` | 2 tahun | Manual terjadwal |

Mekanisme subjek data: Koordinator Prodi menerima permintaan → verifikasi identitas → hapus Drive PNG (catat `file_id` dari sheet) → hapus/merahasiakan baris → catat di `audit`.

## 6. Insiden (UU PDP Pasal 46)

Kegagalan perlindungan data pribadi yang memenuhi syarat wajib diberitahukan tertulis paling lambat **3 × 24 jam**. Prosedur minimum:

1. Hentikan paparan (cabut akses berkas/folder yang terbuka tidak sengaja).
2. Inventarisasi: berkas/receipt/subjek terdampak dari sheet `submissions` + `audit`.
3. Lapor ke pimpinan fakultas/prodi untuk keputusan notifikasi.
4. Dokumentasikan timeline, dampak, remediasi.

## 7. Transfer lintas batas

GitHub Pages dan Google dapat memproses data di luar Indonesia tergantung konfigurasi akun. Dokumentasikan pengaturan akun institusi (region, DPA vendor) sebagai bagian analisis Pasal 56. Mitigasi desain: GitHub menerima **nol** data peserta (hanya UI); data mengalir browser → Apps Script → Drive/Sheets dalam ekosistem Google akun institusi.

## 8. Tanda tangan elektronik

Kanvas PNG = **tanda kehadiran**, bukan tanda tangan elektronik tersertifikasi (PSrE/Komdigi) dan bukan bukti identitas kriptografis. Untuk berkas dengan konsekuensi hukum kuat, gunakan penyedia PSrE tersertifikasi (rujukan riset: PP 71/2019 & ekosistem PSrE Komdigi).

## 9. Checklist pra-peluncuran (ringkas, dari riset)

- [ ] Dasar pemrosesan disetujui pengendali data
- [ ] Teks pemberitahuan versi sesuai kebijakan prodi
- [ ] Analisis biometrik: hanya raster statis; tanpa dinamika pena
- [ ] Inventaris pemroses (Google, GitHub) & transfer lintas batas tercatat
- [ ] Jadwal retensi disetujui; prosedur penghapusan diuji sekali
- [ ] Prosedur insiden 3×24 jam diketahui petugas
- [ ] Folder Drive tidak publik; akses dibatasi akun prodi
- [ ] Repository GitHub tidak berisi data peserta/tanda tangan/kunci
