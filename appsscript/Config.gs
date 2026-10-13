// Config.gs — constants, script-property access, JSON helpers, crypto/util.

var CFG = {
  DB_SPREADSHEET_ID: 'DB_SPREADSHEET_ID',
  DRIVE_ROOT_FOLDER_ID: 'DRIVE_ROOT_FOLDER_ID',
  ADMIN_KEY: 'ADMIN_KEY',
  PRIVACY_NOTICE_VERSION: 'PRIVACY_NOTICE_VERSION',
  SESSION_TTL_MINUTES: 15,
  ADMIN_TTL_MINUTES: 60,
  MAX_SIGNATURE_BYTES: 250000,
  MIN_SIGNATURE_BYTES: 100,
  MAX_AUDIENS_PER_EVENT: 500,
  MAX_PESERTA_PER_EVENT: 500,
  NOTICE_VERSION_DEFAULT: 'PN-2026-10-01',
  ATTENDANCE_STATEMENT:
    'Saya menyatakan bahwa saya hadir pada Seminar Proposal Skripsi ini dan tanda tangan yang saya buat adalah milik saya sendiri.',
  PRIVACY_NOTICE_TEXT_DEFAULT:
    'Pemberitahuan Privasi Pemrosesan Data Daftar Hadir (versi PN-2026-10-01)\n\n' +
    '1. Pengendali data: Program Studi Kesehatan Masyarakat, Program Sarjana, Fakultas Ilmu Kesehatan, UPN "Veteran" Jakarta.\n' +
    '2. Data yang dikumpulkan: nama, NIM, gambar tanda tangan (raster PNG), waktu pengisian, dan status kehadiran.\n' +
    '3. Tujuan pemrosesan: pembukuan kehadiran peserta Seminar Proposal Skripsi dan penyusunan berita acara/daftar hadir resmi.\n' +
    '4. Dasar pemrosesan: kepentingan sah penyelenggara serta kewajiban akademik penyelenggaraan seminar (dikonfigurasi pengendali data; bukan semata-mata persetujuan).\n' +
    '5. Penyimpanan: berkas tanda tangan disimpan pada Google Drive institusi; metadata pada lembar kerja Google milik prodi. Berkas TIDAK disimpan pada GitHub.\n' +
    '6. Retensi: disimpan selama diperlukan sesuai kebijakan akademik prodi; atas permintaan subjek data dapat dilakukan akses, koreksi, atau penghapusan melalui Koordinator Program Studi.\n' +
    '7. Hak subjek data sebagaimana UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi dapat diajukan kepada Koordinator Program Studi.\n' +
    '8. Tanda tangan yang dikumpulkan adalah gambar raster sebagai tanda kehadiran, BUKAN tanda tangan elektronik tersertifikasi (PSrE).\n' +
    '9. Karakteristik dinamis pena (tekanan, kecepatan, timing) TIDAK disimpan.\n' +
    '10. Kontak: Koordinator Program Studi Kesehatan Masyarakat Program Sarjana.'
};

function getProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function setProp_(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function err_(code, message, extra) {
  const body = { ok: false, error: code, message: message };
  if (extra) {
    Object.keys(extra).forEach(function (k) {
      body[k] = extra[k];
    });
  }
  return out_(body);
}

function nowIso_() {
  return new Date().toISOString();
}

function uuid_() {
  return Utilities.getUuid();
}

function randHex_(len) {
  const h = uuid_().replace(/-/g, '');
  return h.substring(0, len);
}

function sha256Hex_(data) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data);
  return digest
    .map(function (b) {
      const v = b < 0 ? b + 256 : b;
      return ('0' + v.toString(16)).slice(-2);
    })
    .join('');
}

function constantTimeEqual_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return d === 0;
}

function str_(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}
