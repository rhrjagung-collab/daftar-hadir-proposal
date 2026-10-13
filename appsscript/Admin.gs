// Admin.gs — admin login, status dashboard data, export triggers, audit trail.

function apiAdminLogin_(payload) {
  const key = getProp_(CFG.ADMIN_KEY);
  if (!key) return err_('admin_not_configured', 'ADMIN_KEY belum diatur. Jalankan setup() dan atur script property.');
  if (!checkRateLimit_('admin_login', 10, 10)) {
    return err_('rate_limited', 'Terlalu banyak percobaan login.');
  }
  if (!constantTimeEqual_(payload.admin_key, key)) {
    audit_('admin', 'admin_login_failed', {});
    return err_('unauthorized', 'Kunci admin salah.');
  }
  const session = createSession_('ADMIN', 'admin', CFG.ADMIN_TTL_MINUTES);
  audit_('admin', 'admin_login_ok', {});
  return out_({ ok: true, admin_token: session.token, expires_at: session.expires_at });
}

function requireAdmin_(token) {
  const s = requireSession_(token, 'ADMIN');
  if (!s) throw new Error('UNAUTHORIZED');
  return s;
}

function apiAdminStatus_(payload) {
  try {
    requireAdmin_(payload.admin_token);
  } catch (e) {
    return err_('unauthorized', 'Sesi admin kedaluwarsa. Login ulang.');
  }
  const ev = getActiveEvent_(payload.event_id);
  if (!ev) return err_('event_not_found', 'Event tidak ditemukan.');
  const evId = str_(ev.event_id);
  const subs = readAll_('submissions').filter(function (r) {
    return str_(r.event_id) === evId;
  });
  const byNim = {};
  subs.forEach(function (r) {
    byNim[str_(r.nim) + '|' + str_(r.type)] = r;
  });
  const peserta = readAll_('peserta')
    .filter(function (r) {
      return str_(r.event_id) === evId;
    })
    .sort(function (a, b) {
      return Number(a.no) - Number(b.no);
    })
    .map(function (p) {
      const s = byNim[str_(p.nim) + '|PESERTA'];
      return {
        no: p.no,
        nim: str_(p.nim),
        nama: str_(p.nama),
        peminatan: str_(p.peminatan),
        hadir: !!s,
        receipt_id: s ? str_(s.receipt_id) : '',
        received_at: s ? str_(s.received_at) : '',
        status: s ? str_(s.status) : 'NOT_SIGNED'
      };
    });
  const audiens = readAll_('audiens')
    .filter(function (r) {
      return str_(r.event_id) === evId;
    })
    .sort(function (a, b) {
      return Number(a.no) - Number(b.no);
    })
    .map(function (a) {
      const s = byNim[str_(a.nim) + '|AUDIENS'];
      return {
        no: a.no,
        nim: str_(a.nim),
        nama: str_(a.nama),
        receipt_id: s ? str_(s.receipt_id) : '',
        received_at: s ? str_(s.received_at) : str_(a.received_at),
        status: s ? str_(s.status) : 'STORED'
      };
    });
  let driveRootUrl = '';
  try {
    driveRootUrl = DriveApp.getFolderById(getProp_(CFG.DRIVE_ROOT_FOLDER_ID)).getUrl();
  } catch (ignored) {}
  return out_({
    ok: true,
    event: publicEvent_(ev),
    counts: {
      total_peserta: peserta.length,
      hadir_peserta: peserta.filter(function (p) { return p.hadir; }).length,
      total_audiens: audiens.length
    },
    peserta: peserta,
    audiens: audiens,
    drive_root_url: driveRootUrl
  });
}

function apiAdminExport_(payload) {
  try {
    requireAdmin_(payload.admin_token);
  } catch (e) {
    return err_('unauthorized', 'Sesi admin kedaluwarsa. Login ulang.');
  }
  const ev = getActiveEvent_(payload.event_id);
  if (!ev) return err_('event_not_found', 'Event tidak ditemukan.');
  const docType = str_(payload.doc_type) || 'PESERTA_ALL';
  const allowed = ['PESERTA_ALL', 'AUDIENS_ALL', 'PESERTA_ONE'];
  if (allowed.indexOf(docType) === -1) return err_('bad_doc_type', 'Jenis dokumen tidak dikenal.');
  let result;
  if (docType === 'PESERTA_ALL') result = buildDaftarHadirDoc_(ev, 'PESERTA_ALL', null);
  else if (docType === 'AUDIENS_ALL') result = buildDaftarHadirDoc_(ev, 'AUDIENS_ALL', null);
  else result = buildDaftarHadirDoc_(ev, 'PESERTA_ONE', str_(payload.nim));
  audit_('admin', 'export_' + docType, { event_id: str_(ev.event_id), file_id: result.file_id });
  return out_({ ok: true, doc_type: docType, file_id: result.file_id, file_url: result.file_url, title: result.title });
}

function audit_(actor, action, detail) {
  try {
    appendRow_('audit', {
      ts: nowIso_(),
      actor: str_(actor),
      action: str_(action),
      detail: typeof detail === 'string' ? detail : JSON.stringify(detail || {})
    });
  } catch (ignored) {}
}
