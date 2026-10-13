// Web.gs — HTTP router for the GitHub Pages frontend (doGet / doPost).
// Frontend must POST with Content-Type: text/plain to avoid CORS preflight;
// the JSON body is read from e.postData.contents.

function doGet(e) {
  try {
    maybeCleanupSessions_();
    const route = str_(e && e.parameter && e.parameter.route);
    const q = (e && e.parameter) || {};
    switch (route) {
      case 'health':
        return out_({ ok: true, now: nowIso_() });
      case 'notice':
        return out_({ ok: true, notice: noticePayload_() });
      case 'roster':
        return out_(Object.assign({ ok: true }, rosterPayload_(q.event_id)));
      case 'sig':
        return out_(sigImages_(q.event_id, q.nims));
      default:
        return err_('unknown_route', 'Unknown GET route: ' + route);
    }
  } catch (err) {
    return err_('server_error', 'Terjadi kesalahan server. Coba lagi.', { detail: String(err) });
  }
}

function doPost(e) {
  let payload = {};
  try {
    maybeCleanupSessions_();
    let raw = '';
    if (e && e.postData && e.postData.contents) raw = e.postData.contents;
    else if (e && e.parameter && e.parameter.payload) raw = e.parameter.payload;
    try {
      payload = JSON.parse(raw || '{}');
    } catch (parseErr) {
      return err_('bad_json', 'Body permintaan bukan JSON yang valid.');
    }
    const route = str_(payload.route);
    switch (route) {
      case 'verify':
        return apiVerify_(payload);
      case 'submit':
        return apiSubmit_(payload);
      case 'admin_login':
        return apiAdminLogin_(payload);
      case 'admin_status':
        return apiAdminStatus_(payload);
      case 'admin_export':
        return apiAdminExport_(payload);
      default:
        return err_('unknown_route', 'Unknown POST route: ' + route);
    }
  } catch (err) {
    return err_('server_error', 'Terjadi kesalahan server. Coba lagi.', { detail: String(err) });
  }
}

function maybeCleanupSessions_() {
  if (Math.random() > 0.05) return;
  try {
    const sh = sheet_('sessions');
    const values = sh.getDataRange().getValues();
    const now = Date.now();
    for (let i = values.length - 1; i >= 1; i--) {
      const exp = new Date(values[i][4]).getTime();
      if (!exp || exp < now - 24 * 3600 * 1000) sh.deleteRow(i + 1);
    }
  } catch (ignored) {}
}

function noticePayload_() {
  const version = getProp_(CFG.PRIVACY_NOTICE_VERSION) || CFG.NOTICE_VERSION_DEFAULT;
  return {
    version: version,
    attendance_statement: CFG.ATTENDANCE_STATEMENT,
    notice_text: getProp_('PRIVACY_NOTICE_TEXT') || CFG.PRIVACY_NOTICE_TEXT_DEFAULT
  };
}

function publicEvent_(ev) {
  if (!ev) return null;
  return {
    event_id: str_(ev.event_id),
    name: str_(ev.name),
    academic_year: str_(ev.academic_year),
    semester: str_(ev.semester),
    program: str_(ev.program),
    faculty: str_(ev.faculty),
    exam_date_label: str_(ev.exam_date_label),
    exam_place: str_(ev.exam_place)
  };
}

function getEventById_(eventId) {
  const rows = readAll_('events');
  for (let i = 0; i < rows.length; i++) {
    if (str_(rows[i].event_id) === str_(eventId)) return rows[i];
  }
  return null;
}

function getActiveEvent_(eventId) {
  if (eventId) return getEventById_(eventId);
  const rows = readAll_('events').filter(function (r) {
    return str_(r.status) === 'ACTIVE';
  });
  if (rows.length) return rows[rows.length - 1];
  const all = readAll_('events');
  return all.length ? all[all.length - 1] : null;
}

// Returns signature images as data URLs for the document-style attendance table.
function sigImages_(eventId, nimsCsv) {
  const ev = getActiveEvent_(eventId);
  if (!ev) return { ok: false, error: 'event_not_found', message: 'Event tidak ditemukan.' };
  const evId = str_(ev.event_id);
  const nims = str_(nimsCsv)
    .split(',')
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean)
    .slice(0, 60);
  const wanted = {};
  nims.forEach(function (n) {
    wanted[n] = true;
  });
  const subs = readAll_('submissions').filter(function (r) {
    return str_(r.event_id) === evId && str_(r.type) === 'PESERTA' && wanted[str_(r.nim)];
  });
  const images = {};
  subs.forEach(function (s) {
    try {
      const file = DriveApp.getFileById(str_(s.drive_file_id));
      images[str_(s.nim)] = 'data:image/png;base64,' + Utilities.base64Encode(file.getBytes());
    } catch (ignored) {}
  });
  return { ok: true, images: images };
}

function rosterPayload_(eventId) {
  const ev = getActiveEvent_(eventId);
  if (!ev) return { event: null, peserta: [], signed_nims: [], notice: noticePayload_() };
  const evId = str_(ev.event_id);
  const peserta = readAll_('peserta')
    .filter(function (r) {
      return str_(r.event_id) === evId;
    })
    .map(function (r) {
      return {
        no: r.no,
        nim: str_(r.nim),
        nama: str_(r.nama),
        peminatan: str_(r.peminatan),
        judul: str_(r.judul)
      };
    })
    .sort(function (a, b) {
      return Number(a.no) - Number(b.no);
    });
  const signedRows = readAll_('submissions').filter(function (r) {
    return str_(r.event_id) === evId && str_(r.type) === 'PESERTA';
  });
  const signed = signedRows.map(function (r) {
    return { nim: str_(r.nim), received_at: str_(r.received_at), receipt_id: str_(r.receipt_id) };
  });
  const signed_nims = signed.map(function (s) {
    return s.nim;
  });
  return { event: publicEvent_(ev), peserta: peserta, signed: signed, signed_nims: signed_nims, notice: noticePayload_() };
}
