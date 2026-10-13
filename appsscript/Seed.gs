// Seed.gs — one-time setup + jadwal seed from Penguji Proposal Skripsi Ganjil 26 27_shared.pdf.
// Run setup() once from the Apps Script editor after creating the project.

var JADWAL = {
  event: {
    event_id: 'EVT-2026G-PROPOSAL',
    name: 'Seminar Proposal Skripsi',
    academic_year: '2026/2027',
    semester: 'GANJIL',
    program: 'PROGRAM STUDI KESEHATAN MASYARAKAT PROGRAM SARJANA',
    faculty: 'FAKULTAS ILMU KESEHATAN UPN \"VETERAN\" JAKARTA',
    exam_date_label: 'Kamis, 15 Oktober 2026',
    exam_place: 'Zoom Meeting',
    timezone: 'Asia/Jakarta'
  },
  koordinator: {
    nama: 'Dr. Suparni, ST., M.K.K.K',
    nip: '197705072024212008',
    jabatan: 'Koordinator Program Studi Kesehatan Masyarakat Program Sarjana'
  },
  peserta: [
  {
    "no": 1,
    "nim": "2210713073",
    "nama": "Almeria Annisa Putri",
    "peminatan": "Administrasi & Kebijakan Kesehatan (2022)",
    "judul": "Faktor-Faktor yang berhubungan dengan Kesediaan Mengikuti Program Rujuk Balik (PRB) pada Pasien Diabetes Melitus Tipe 2 Peserta JKN di Poli Penyakit dalam RSUD Tanggerang Selatan Tahun 2026",
    "pembimbing": "Dr. Putri Permatasari, S.K.M., M.K.M. (L)",
    "pendamping": "Cahya Arbitera, S.K.M., M.K.M. (L)",
    "penguji_utama": "Ayu Anggraeni Dyah Purbasari, S.K.M., MPH(M) (L)"
  },
  {
    "no": 2,
    "nim": "2210713132",
    "nama": "Alinda Mahardika Alba",
    "peminatan": "Administrasi & Kebijakan Kesehatan (2022)",
    "judul": "HUBUNGAN KUALITAS APLIKASI MOBILE JKN PADA LAYANAN PENDAFTARAN ONLINE TERHADAP KEPUASAN PASIEN RAWAT JALAN DI RS SUMBER WARAS TAHUN 2026",
    "pembimbing": "Prof. Dr. A. Heri Iswanto, S.K.M., M.A.R.S. (LK)",
    "pendamping": "Ayu Anggraeni Dyah Purbasari, S.K.M., MPH(M) (L)",
    "penguji_utama": "Dr. Hj. Een Kurnaesih, S.K.M., M.Kes. (LK)"
  },
  {
    "no": 3,
    "nim": "2210713008",
    "nama": "Winda Dwiastuti",
    "peminatan": "Administrasi & Kebijakan Kesehatan (2022)",
    "judul": "Hubungan Kualitas Pelayanan Pendaftaran Online berbasis Whatsapp dengan Minat Kunjungan Ulang Pasien Umum di Instalasi Rawat Jalan RSPPN Soedirman Tahun 2026",
    "pembimbing": "Prof. Dr. A. Heri Iswanto, S.K.M., M.A.R.S. (LK)",
    "pendamping": "Dr. Putri Permatasari, S.K.M., M.K.M. (L)",
    "penguji_utama": "Apt. Riswandy Wasir, M.P.H., PhD (L)"
  },
  {
    "no": 4,
    "nim": "2310713089",
    "nama": "Raeesah Wahlullizar",
    "peminatan": "Administrasi & Kebijakan Kesehatan (2023)",
    "judul": "Evaluasi Ketercapaian Target Universal Health Coverage Melalui Optimalisasi Program Jaminan Kesehatan Nasional di Kota Tangerang Selatan Tahun 2026",
    "pembimbing": "Apt. Riswandy Wasir, M.P.H., PhD (L)",
    "pendamping": "Cahya Arbitera, S.K.M., M.K.M. (L)",
    "penguji_utama": "Dr. Putri Permatasari, S.K.M., M.K.M. (L)"
  },
  {
    "no": 5,
    "nim": "2310713082",
    "nama": "Nirna Dwi Anggraini",
    "peminatan": "Administrasi & Kebijakan Kesehatan (2023)",
    "judul": "Faktor-Faktor yang Berhubungan dengan Tingkat Pemanfaatan Aplikasi Mobile JKN pada Peserta JKN Rawat Jalan di Puskesmas Kecamatan Pasar Minggu Tahun 2026",
    "pembimbing": "Ayu Anggraeni Dyah Purbasari, S.K.M., MPH(M) (L)",
    "pendamping": "Apt. Riswandy Wasir, M.P.H., PhD (L)",
    "penguji_utama": "Cahya Arbitera, S.K.M., M.K.M. (L)"
  },
  {
    "no": 6,
    "nim": "2310713091",
    "nama": "Nadya Nur Syafina Putri",
    "peminatan": "Administrasi & Kebijakan Kesehatan (2023)",
    "judul": "ANALISIS FAKTOR-FAKTOR YANG BERHUBUNGAN DENGAN IMPLEMENTASI KEBIJAKAN KAWASAN TANPA ROKOK (KTR) PADA SMA DAN SMK DI KECAMATAN CIPAYUNG KOTA DEPOK TAHUN 2026",
    "pembimbing": "Dr. Hj. Een Kurnaesih, S.K.M., M.Kes. (LK)",
    "pendamping": "Dr. Putri Permatasari, S.K.M., M.K.M. (L)",
    "penguji_utama": "Cahya Arbitera, S.K.M., M.K.M. (L)"
  },
  {
    "no": 7,
    "nim": "2310713107",
    "nama": "Aditya Ibnu Gunawan",
    "peminatan": "Kesehatan Lingkungan (2023)",
    "judul": "Hubungan Higiene Perorangan, Sanitasi Lingkungan, dan Faktor Individu Terhadap Kejadian Skabies Klinis Pada Anak Di Panti Asuhan di Jakarta Timur 2026",
    "pembimbing": "Nayla Kamilia Fithri, S.K.M., M.P.H. (L)",
    "pendamping": "Arga Buntara, S.K.M., M.P.H. (AA)",
    "penguji_utama": "Dr. Fajaria Nurcandra, S.K.M., M.Epid. (L)"
  },
  {
    "no": 8,
    "nim": "2310713079",
    "nama": "Mazaya Fazila Syahira",
    "peminatan": "Kesehatan Reproduksi (2023)",
    "judul": "HUBUNGAN STRES AKADEMIK DENGAN GANGGUAN SIKLUS MENSTRUASI PADA MAHASISWI PROGRAM SARJANA KESEHATAN MASYARAKAT DI UNIVERSITAS PEMBANGUNAN \"VETERAN\" JAKARTA TAHUN 2026",
    "pembimbing": "Chahya Kharin Herbawani, S.Keb., Bd., M.K.M. (L)",
    "pendamping": "Dr. Laily Hanifah, S.K.M., M.Kes. (L)",
    "penguji_utama": "Dr. Fathinah Ranggauni Hardy, S.K.M., M.Epid. (L)"
  },
  {
    "no": 9,
    "nim": "2310713158",
    "nama": "Azzahra Athyahanna Harahap",
    "peminatan": "Kesehatan Reproduksi (2023)",
    "judul": "HUBUNGAN FAKTOR INDIVIDU, PENDIDIKAN IBU, DAN FASILITAS WASH DENGAN MENSTRUAL HYGIENE MANAGEMENT PADA SISWI SMP NEGERI DI KOTA DEPOK TAHUN 2026",
    "pembimbing": "Chahya Kharin Herbawani, S.Keb., Bd., M.K.M. (L)",
    "pendamping": "Dr. Lusyta Puri Ardhiyanti, S.ST., M.Kes. (L)",
    "penguji_utama": "Dr. Hj. Een Kurnaesih, S.K.M., M.Kes. (LK)"
  },
  {
    "no": 10,
    "nim": "2310713090",
    "nama": "Seftiani Syafira",
    "peminatan": "Kesehatan Reproduksi (2023)",
    "judul": "Determinan dalam Perilaku Pemanfaatan Pelayanan Kesehatan Peduli Remaja (PKPR) di Kota Depok Tahun 2026",
    "pembimbing": "Dr. Fathinah Ranggauni Hardy, S.K.M., M.Epid. (L)",
    "pendamping": "Dr. Yunita Amraeni, S.K.M., M.Kes. (L)",
    "penguji_utama": "Dr. Chandrayani Simanjorang, S.K.M., M.Epid. (LK)"
  },
  {
    "no": 11,
    "nim": "2310713159",
    "nama": "Salsa Cahya Amira",
    "peminatan": "Kesehatan Reproduksi (2023)",
    "judul": "Hubungan Pola Asuh Orang Tua dengan Komunikasi Kesehatan Reproduksi pada Remaja di SMA Negeri 37 Jakarta",
    "pembimbing": "Dr. Lusyta Puri Ardhiyanti, S.ST., M.Kes. (L)",
    "pendamping": "Dr. Laily Hanifah, S.K.M., M.Kes. (L)",
    "penguji_utama": "Chahya Kharin Herbawani, S.Keb., Bd., M.K.M. (L)"
  },
  {
    "no": 12,
    "nim": "2310713100",
    "nama": "Salwa Febriana Ekasari Siregar",
    "peminatan": "Kesehatan Reproduksi (2023)",
    "judul": "FAKTOR-FAKTOR YANG BERHUBUNGAN DENGAN NIAT VASEKTOMI PADA PRIA USIA 18-25 TAHUN DI JABODETABEK TAHUN 2026",
    "pembimbing": "Dr. Fajaria Nurcandra, S.K.M., M.Epid. (L)",
    "pendamping": "Dr. Fathinah Ranggauni Hardy, S.K.M., M.Epid. (L)",
    "penguji_utama": "Dr. Yunita Amraeni, S.K.M., M.Kes. (L)"
  },
  {
    "no": 13,
    "nim": "2310713111",
    "nama": "Maritza Adelia Putri",
    "peminatan": "Kesehatan Reproduksi (2023)",
    "judul": "Analisis Cakupan Skrining Anemia pada Remaja Putri melalui Program Cek Kesehatan Gratis (CKG) Sekolah di Wilayah Kerja Puskesmas Sawangan Tahun 2026",
    "pembimbing": "Dr. Yunita Amraeni, S.K.M., M.Kes. (L)",
    "pendamping": "Dr. Fajaria Nurcandra, S.K.M., M.Epid. (L)",
    "penguji_utama": "Dr. Fathinah Ranggauni Hardy, S.K.M., M.Epid. (L)"
  },
  {
    "no": 14,
    "nim": "2310713123",
    "nama": "Rizkiana Putrika Maharani",
    "peminatan": "Kesehatan Reproduksi (2023)",
    "judul": "PENGALAMAN MAHASISWI TERHADAP KETIMPANGAN RELASI KUASA DALAM HUBUNGAN PACARAN DAN KERENTANANNYA TERHADAP KEKERASAN SEKSUAL DI UNIVERSITAS PEMBANGUNAN NASIONAL \"VETERAN\" JAKARTA",
    "pembimbing": "Dr. Laily Hanifah, S.K.M., M.Kes. (L)",
    "pendamping": "Dr. Lusyta Puri Ardhiyanti, S.ST., M.Kes. (L)",
    "penguji_utama": "Chahya Kharin Herbawani, S.Keb., Bd., M.K.M. (L)"
  },
  {
    "no": 15,
    "nim": "2310713084",
    "nama": "Keira Dwinova",
    "peminatan": "Keselamatan & Kesehatan Kerja (2023)",
    "judul": "HUBUNGAN FAKTOR INDIVIDU DAN FAKTOR PEKERJAAN DENGAN KELELAHAN KERJA PADA PEKERJA DI PT X TAHUN 2026",
    "pembimbing": "Ulya Qoulan Karima, S.K.M., M.Epid. (L)",
    "pendamping": "Afif Amir Amrullah, S.Kp., M.K.K.K. (L)",
    "penguji_utama": "Dr. Januar Ariyanto, S.K.M., M.Kes. (L)"
  },
  {
    "no": 16,
    "nim": "2310713062",
    "nama": "Saffana Urfa Setiawan",
    "peminatan": "Keselamatan & Kesehatan Kerja (2023)",
    "judul": "ANALISIS IMPLEMENTASI CRISIS MANAGEMENT EMERGENCY RESPONSE (CMER) DI PERUSAHAAN X PADA TAHUN 2026",
    "pembimbing": "Dr. Suparni, S.T., M.K.K.K. (L)",
    "pendamping": "Agung Raharjo, S.K.M., M.K.K.K",
    "penguji_utama": "Dr. Agus Joko Susanto, S.K.M., M.K.K.K. (L)"
  },
  {
    "no": 17,
    "nim": "2310713108",
    "nama": "Adzra Nabilah Widyatama",
    "peminatan": "Keselamatan & Kesehatan Kerja (2023)",
    "judul": "HUBUNGAN PERSENTASE LEMAK TUBUH DENGAN KEJADIAN GEJALA HEAT STRESS PADA PEKERJA KONSTRUKSI DI PT. X TAHUN 2026",
    "pembimbing": "Dr. Ns. Dyah Utari, S.Kep., M.K.K.K. (LK)",
    "pendamping": "Agung Raharjo, S.K.M., M.K.K.K (AA)",
    "penguji_utama": "Dr. Suparni, S.T., M.K.K.K. (L)"
  },
  {
    "no": 18,
    "nim": "2310713099",
    "nama": "Ghaida Ramadhani",
    "peminatan": "Keselamatan & Kesehatan Kerja (2023)",
    "judul": "HUBUNGAN PERILAKU SEDENTARY DENGAN RISIKO COMPUTER VISION SYNDROME PADA KARYAWAN PT X TAHUN 2026",
    "pembimbing": "Dr. Januar Ariyanto, S.K.M., M.Kes. (L)",
    "pendamping": "Promisetyaningrum Fitria Nurani, S.K.M., M.P.H. (AA)",
    "penguji_utama": "Dr. Ns. Dyah Utari, S.Kep., M.K.K.K. (LK)"
  },
  {
    "no": 19,
    "nim": "2310713027",
    "nama": "Faiza Athallah",
    "peminatan": "Keselamatan & Kesehatan Kerja (2023)",
    "judul": "ANALISIS FAKTOR TEKANAN WAKTU KERJA TERHADAP SAFETY BEHAVIOR PADA PEKERJA PENGGUNA MATERIAL HANDLING EQUIPMENT DI PT X TAHUN 2026",
    "pembimbing": "Afif Amir Amrullah, S.Kp., M.K.K.K. (L)",
    "pendamping": "Farahul Jannah, S.Kep., M.K.K.K. (AA)",
    "penguji_utama": "Dr. Agus Joko Susanto, S.K.M., M.K.K.K. (L)"
  },
  {
    "no": 20,
    "nim": "2310713148",
    "nama": "Felicia Avriel Kriestian",
    "peminatan": "Keselamatan & Kesehatan Kerja (2023)",
    "judul": "Hubungan Beban Kerja dan Kualitas Tidur dengan Kelelahan Kerja pada Pekerja Produksi Garmen di PT X",
    "pembimbing": "Dr. Agus Joko Susanto, S.K.M., M.K.K.K. (L)",
    "pendamping": "Promisetyaningrum Fitria Nurani, S.K.M., M.P.H. (AA)",
    "penguji_utama": "Dr. Januar Ariyanto, S.K.M., M.Kes. (L)"
  },
  {
    "no": 21,
    "nim": "2310713101",
    "nama": "Nayla Alfiah",
    "peminatan": "Keselamatan & Kesehatan Kerja (2023)",
    "judul": "HUBUNGAN KARAKTERISTIK INDIVIDU DENGAN KELELAHAN VISUAL PADA PEKERJA BERBASIS LAYAR PT X TAHUN 2026",
    "pembimbing": "Dr. Januar Ariyanto, S.K.M., M.Kes. (L)",
    "pendamping": "Dr. Agus Joko Susanto, S.K.M., M.K.K.K. (L)",
    "penguji_utama": "Dr. Ns. Dyah Utari, S.Kep., M.K.K.K. (LK)"
  },
  {
    "no": 22,
    "nim": "2310713147",
    "nama": "Grace Yohana Meilianie",
    "peminatan": "Keselamatan & Kesehatan Kerja (2023)",
    "judul": "HUBUNGAN PSYCHOLOGICAL SAFETY DAN PENGETAHUAN PEKERJA TERHADAP BUDAYA PELAPORAN INSIDEN NYARIS CELAKA DI PT. X JAKARTA SELATAN 2026",
    "pembimbing": "Dr. Ns. Dyah Utari, S.Kep., M.K.K.K. (LK)",
    "pendamping": "Dr. Suparni, S.T., M.K.K.K. (L)",
    "penguji_utama": "Dr. Januar Ariyanto, S.K.M., M.Kes. (L)"
  }
]
};

function setup() {
  const props = PropertiesService.getScriptProperties();

  if (!props.getProperty('DB_SPREADSHEET_ID')) {
    const ss = SpreadsheetApp.create('Daftar Hadir - DB');
    props.setProperty('DB_SPREADSHEET_ID', ss.getId());
    Logger.log('Spreadsheet dibuat: ' + ss.getUrl());
  }
  if (!props.getProperty('DRIVE_ROOT_FOLDER_ID')) {
    const folder = DriveApp.createFolder('Daftar Hadir Signatures');
    props.setProperty('DRIVE_ROOT_FOLDER_ID', folder.getId());
    Logger.log('Folder Drive dibuat: ' + folder.getUrl());
  }
  if (!props.getProperty('ADMIN_KEY')) {
    props.setProperty('ADMIN_KEY', Utilities.getUuid().replace(/-/g, '').slice(0, 20));
  }
  if (!props.getProperty('PRIVACY_NOTICE_VERSION')) {
    props.setProperty('PRIVACY_NOTICE_VERSION', CFG.NOTICE_VERSION_DEFAULT);
  }

  ensureTables_();
  seedEvent_();
  audit_('system', 'setup', { event_id: JADWAL.event.event_id });

  Logger.log('=== SETUP SELESAI ===');
  Logger.log('ADMIN_KEY = ' + props.getProperty('ADMIN_KEY'));
  Logger.log('Simpan ADMIN_KEY di tempat aman. Diperlukan untuk login halaman Petugas.');
  Logger.log('Langkah berikutnya: Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).');
}

function seedEvent_() {
  const ev = JADWAL.event;
  const existing = getEventById_(ev.event_id);
  if (!existing) {
    appendRow_('events', {
      event_id: ev.event_id,
      name: ev.name,
      academic_year: ev.academic_year,
      semester: ev.semester,
      program: ev.program,
      faculty: ev.faculty,
      exam_date_label: ev.exam_date_label,
      exam_place: ev.exam_place,
      timezone: ev.timezone,
      privacy_notice_version: getProp_(CFG.PRIVACY_NOTICE_VERSION) || CFG.NOTICE_VERSION_DEFAULT,
      drive_folder_id: '',
      status: 'ACTIVE',
      penguji_i: '',
      penguji_ii: '',
      penguji_iii: '',
      koordinator_nama: JADWAL.koordinator.nama,
      koordinator_nip: JADWAL.koordinator.nip,
      created_at: nowIso_()
    });
  }

  const have = {};
  readAll_('peserta').forEach(function (r) {
    if (str_(r.event_id) === ev.event_id) have[str_(r.nim)] = true;
  });
  JADWAL.peserta.forEach(function (p) {
    if (have[p.nim]) return;
    appendRow_('peserta', {
      event_id: ev.event_id,
      no: p.no,
      nim: p.nim,
      nama: p.nama,
      peminatan: p.peminatan,
      judul: p.judul,
      pembimbing: p.pembimbing,
      pendamping: p.pendamping,
      penguji_utama: p.penguji_utama,
      // Mapping verified against DAFTAR HADIR.docx (NIM 2310713062):
      // Penguji I/Ketua = Penguji Utama, Penguji II = Pembimbing, Penguji III = Pendamping.
      penguji_i: p.penguji_utama,
      penguji_ii: p.pembimbing,
      penguji_iii: p.pendamping
    });
  });
  Logger.log('Seed event ' + ev.event_id + ' selesai. Peserta: ' + JADWAL.peserta.length);
}

// Optional: fill the event-level penguji signature block used in multi-peserta exports.
function setEventPenguji_(eventId, pengujiI, pengujiII, pengujiIII) {
  const sh = sheet_('events');
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (str_(values[i][0]) === str_(eventId)) {
      sh.getRange(i + 1, 13, 1, 3).setValues([[pengujiI, pengujiII, pengujiIII]]);
      return true;
    }
  }
  return false;
}
