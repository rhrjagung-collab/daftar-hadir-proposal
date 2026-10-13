// Auth.gs — participant NIM lookup, short-lived sessions, rate limiting (FR-B scaled to Apps Script MVP).

function checkRateLimit_(key, max, windowMinutes) {
  const sh = sheet_('ratelimit');
  const now = Date.now();
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (str_(values[i][0]) !== key) continue;
    const start = new Date(values[i][1]).getTime();
    const count = Number(values[i][2]) || 0;
    if (now - start < windowMinutes * 60000) {
      if (count >= max) return false;
      sh.getRange(i + 1, 3).setValue(count + 1);
      return true;
    }
    sh.getRange(i + 1, 2, 1, 2).setValues([[new Date(now), 1]]);
    return true;
  }
  sh.appendRow([key, new Date(now), 1]);
  return true;
}

function createSession_(scope, ref, ttlMinutes) {
  const token = uuid_().replace(/-/g, '') + uuid_().replace(/-/g, '');
  const expires = Date.now() + ttlMinutes * 60000;
  appendRow_('sessions', {
    token_hash: sha256Hex_(token),
    scope: scope,
    ref: ref,
    created_at: nowIso_(),
    expires_at: new Date(expires).toISOString()
  });
  return { token: token, expires_at: new Date(expires).toISOString() };
}

function requireSession_(token, scope) {
  if (!token) return null;
  const hash = sha256Hex_(String(token));
  const now = Date.now();
  const rows = readAll_('sessions');
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (str_(r.token_hash) === hash && str_(r.scope) === scope) {
      const exp = new Date(r.expires_at).getTime();
      if (!exp || exp < now) return null;
      return r;
    }
  }
  return null;
}

// Participant confirms identity by picking their name / entering NIM from the seeded jadwal roster.
function apiVerify_(payload) {
  const nim = str_(payload.nim).replace(/\D/g, '');
  if (nim.length < 6) return err_('nim_invalid', 'NIM tidak valid.');
  if (!checkRateLimit_('verify:' + nim, 5, 10)) {
    return err_('rate_limited', 'Terlalu banyak percobaan. Silakan tunggu beberapa menit.');
  }
  const ev = getActiveEvent_(payload.event_id);
  if (!ev) return err_('event_not_found', 'Jadwal seminar tidak ditemukan.');
  const evId = str_(ev.event_id);
  const matches = readAll_('peserta').filter(function (r) {
    return str_(r.event_id) === evId && str_(r.nim) === nim;
  });
  if (!matches.length) return err_('not_in_roster', 'NIM tidak terdaftar sebagai peserta pada jadwal ini.');
  const p = matches[0];
  const session = createSession_('PARTICIPANT', evId + '|' + nim, CFG.SESSION_TTL_MINUTES);
  audit_(nim, 'verify_ok', { event_id: evId, nama: str_(p.nama) });
  return out_({
    ok: true,
    token: session.token,
    expires_at: session.expires_at,
    participant: { no: p.no, nim: nim, nama: str_(p.nama), peminatan: str_(p.peminatan), judul: str_(p.judul) },
    event: publicEvent_(ev),
    notice: noticePayload_()
  });
}
