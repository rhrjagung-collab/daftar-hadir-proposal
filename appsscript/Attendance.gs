// Attendance.gs — submission pipeline: validate, idempotency (FR-I), Drive write, receipt.

function findSubmission_(evId, type, nim) {
  const rows = readAll_('submissions').filter(function (r) {
    return str_(r.event_id) === evId && str_(r.type) === type && str_(r.nim) === nim;
  });
  return rows.length ? rows[0] : null;
}

function apiSubmit_(payload) {
  const ev = getActiveEvent_(payload.event_id);
  if (!ev) return err_('event_not_found', 'Jadwal seminar tidak ditemukan.');
  const evId = str_(ev.event_id);
  const type = payload.type === 'AUDIENS' ? 'AUDIENS' : 'PESERTA';

  // Separate attendance affirmation from privacy-notice acknowledgment (report UX rule).
  if (payload.attendance_confirmed !== true) {
    return err_('attendance_required', 'Centang pernyataan kehadiran sebelum mengirim.');
  }
  if (payload.notice_acknowledged !== true) {
    return err_('notice_required', 'Centang pengakuan pemberitahuan privasi sebelum mengirim.');
  }
  const notice = noticePayload_();
  if (str_(payload.notice_version) !== notice.version) {
    return err_('notice_version_mismatch', 'Versi pemberitahuan privasi tidak sesuai. Muat ulang halaman.');
  }

  let nim;
  let nama;
  let session = null;

  if (type === 'PESERTA') {
    session = requireSession_(payload.token, 'PARTICIPANT');
    if (!session) return err_('session_expired', 'Sesi kedaluwarsa. Silakan verifikasi ulang.');
    const refParts = str_(session.ref).split('|');
    if (refParts[0] !== evId) return err_('session_event_mismatch', 'Sesi tidak berlaku untuk event ini.');
    nim = refParts[1];
    const match = readAll_('peserta').filter(function (r) {
      return str_(r.event_id) === evId && str_(r.nim) === nim;
    })[0];
    if (!match) return err_('not_in_roster', 'NIM tidak terdaftar sebagai peserta.');
    nama = str_(match.nama);
  } else {
    nim = str_(payload.nim).replace(/\D/g, '');
    nama = str_(payload.nama);
    if (nim.length < 6) return err_('nim_invalid', 'NIM tidak valid.');
    if (nama.length < 3) return err_('nama_required', 'Nama wajib diisi.');
    if (nim.length > 20 || nama.length > 120) return err_('field_too_long', 'Data terlalu panjang.');
    if (!checkRateLimit_('audiens:' + nim, 5, 10)) {
      return err_('rate_limited', 'Terlalu banyak percobaan. Silakan tunggu beberapa menit.');
    }
    const totalAudiens = countRows_('submissions', function (r) {
      return str_(r.event_id) === evId && str_(r.type) === 'AUDIENS';
    });
    const alreadyAudiens = readAll_('audiens').some(function (r) {
      return str_(r.event_id) === evId && str_(r.nim) === nim;
    });
    if (!alreadyAudiens && totalAudiens >= CFG.MAX_AUDIENS_PER_EVENT) {
      return err_('event_full', 'Kuota audiens untuk event ini sudah penuh.');
    }
  }

  // Idempotent success: one attendance entry per (event, type, nim).
  const existing = findSubmission_(evId, type, nim);
  if (existing) {
    return out_({
      ok: true,
      already_signed: true,
      receipt_id: str_(existing.receipt_id),
      status: str_(existing.status),
      received_at: str_(existing.received_at),
      sha256: str_(existing.sha256)
    });
  }

  if (!checkRateLimit_('submit:' + evId + '|' + nim, 10, 60)) {
    return err_('rate_limited', 'Terlalu banyak percobaan pengiriman.');
  }

  const sig = parseSignatureB64_(payload.signature_png_b64);
  if (sig.error) {
    const msgs = {
      signature_missing: 'Tanda tangan belum diisi. Tulis tanda tangan pada kotak di bawah.',
      signature_not_png: 'Gagal membaca gambar tanda tangan. Tekan Hapus lalu tulis ulang.',
      signature_not_base64: 'Gagal membaca data tanda tangan. Tekan Hapus lalu tulis ulang.',
      signature_too_small: 'Tanda tangan terlalu kecil atau masih kosong. Tulis lebih jelas dan panjang.',
      signature_too_large: 'Tanda tangan terlalu besar. Tulis lebih ringkas.'
    };
    return err_(sig.error, msgs[sig.error] || 'Tanda tangan tidak valid.');
  }

  const receiptId = 'DH-' + (str_(ev.academic_year).replace(/\D/g, '').substring(0, 4) || 'EV') + '-' + randHex_(8).toUpperCase();
  const stored = storeSignature_(ev, receiptId, type, sig.bytes, sig.sha256);
  const receivedAt = nowIso_();

  appendRow_('submissions', {
    receipt_id: receiptId,
    event_id: evId,
    type: type,
    nim: nim,
    nama: nama,
    sha256: sig.sha256,
    drive_file_id: stored.file_id,
    status: 'stored',
    notice_version: notice.version,
    notice_ack: true,
    attendance_confirmed: true,
    idempotency_key: str_(payload.idempotency_key) || receiptId,
    received_at: receivedAt,
    stored_at: receivedAt
  });

  if (type === 'AUDIENS') {
    const seq = countRows_('audiens', function (r) {
      return str_(r.event_id) === evId;
    }) + 1;
    if (seq <= CFG.MAX_AUDIENS_PER_EVENT) {
      appendRow_('audiens', { event_id: evId, no: seq, nim: nim, nama: nama, received_at: receivedAt });
    }
  }

  audit_(nim, 'submit_' + type, { event_id: evId, receipt_id: receiptId, sha256: sig.sha256 });

  return out_({
    ok: true,
    already_signed: false,
    receipt_id: receiptId,
    status: 'stored',
    received_at: receivedAt,
    sha256: sig.sha256
  });
}
