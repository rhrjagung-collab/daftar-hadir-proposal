// peserta.js — one-page flow: pick name → auto-verify → draw → submit → live list updates.
(function () {
  'use strict';

  var state = {
    event: null,
    notice: null,
    token: null,
    participant: null,
    roster: [],
    signedByNim: {},
    pad: null,
    canvas: null,
    busy: false,
    idempotencyKey: DH.uuid()
  };

  var el = {};

  document.addEventListener('DOMContentLoaded', function () {
    el.eventLine = document.getElementById('event-line');
    el.select = document.getElementById('nama-select');
    el.signCard = document.getElementById('sign-card');
    el.identity = document.getElementById('identity');
    el.noticeVersion = document.getElementById('notice-version');
    el.chkNotice = document.getElementById('chk-notice');
    el.chkHadir = document.getElementById('chk-hadir');
    el.btnClear = document.getElementById('btn-clear');
    el.btnSubmit = document.getElementById('btn-submit');
    el.msg = document.getElementById('msg');
    el.tblBody = document.querySelector('#tbl-list tbody');
    el.listUpdated = document.getElementById('list-updated');
    el.canvas = document.getElementById('sig-canvas');
    state.canvas = el.canvas;

    el.select.addEventListener('change', onSelectName);
    el.chkNotice.addEventListener('change', updateSubmitEnabled);
    el.chkHadir.addEventListener('change', updateSubmitEnabled);
    el.btnClear.addEventListener('click', function () {
      if (state.pad) state.pad.clear();
      updateSubmitEnabled();
    });
    el.btnSubmit.addEventListener('click', onSubmit);
    window.addEventListener('resize', debounce(function () {
      if (state.pad) DH_PAD.resize(el.canvas, state.pad);
    }, 250));

    loadRoster();
    setInterval(loadRoster, 30000);
  });

  async function loadRoster() {
    try {
      var data = await DH.get({ route: 'roster', event_id: DH.config.EVENT_ID || '' });
      if (!data.ok || !data.event) return;
      state.event = data.event;
      state.notice = data.notice;
      state.roster = data.peserta || [];
      state.signedByNim = {};
      (data.signed || []).forEach(function (s) {
        state.signedByNim[s.nim] = s;
      });
      el.eventLine.textContent =
        data.event.name + ' — ' + data.event.exam_date_label + ' (' + data.event.exam_place + ')';
      el.noticeVersion.textContent = data.notice.version;
      if (!state.participant) renderSelect();
      renderList();
    } catch (e) {
      el.eventLine.textContent = 'Gagal memuat jadwal. Muat ulang halaman.';
    }
  }

  function renderSelect() {
    var current = el.select.value;
    var opts = ['<option value="">— pilih nama —</option>'];
    state.roster.forEach(function (p) {
      var suffix = state.signedByNim[p.nim] ? ' (sudah hadir)' : '';
      opts.push('<option value="' + esc(p.nim) + '">' + esc(p.nama) + ' — ' + esc(p.nim) + suffix + '</option>');
    });
    el.select.innerHTML = opts.join('');
    if (current) el.select.value = current;
  }

  function renderList() {
    el.tblBody.innerHTML = state.roster
      .map(function (p) {
        var s = state.signedByNim[p.nim];
        var me = state.participant && state.participant.nim === p.nim ? ' class="me"' : '';
        return (
          '<tr' + me + '>' +
          '<td>' + esc(p.no) + '</td>' +
          '<td>' + esc(p.nama) + (state.participant && state.participant.nim === p.nim ? ' <strong>(Anda)</strong>' : '') + '</td>' +
          '<td>' + esc(p.nim) + '</td>' +
          '<td>' + (s ? '<span class="pill hadir">Hadir</span>' : '<span class="pill belum">Belum</span>') + '</td>' +
          '<td>' + esc(s ? s.received_at : '') + '</td>' +
          '</tr>'
        );
      })
      .join('');
    var n = Object.keys(state.signedByNim).length;
    el.listUpdated.textContent = '— ' + n + ' dari ' + state.roster.length + ' sudah hadir';
  }

  async function onSelectName() {
    var nim = el.select.value;
    if (!nim) {
      el.signCard.classList.add('hidden');
      return;
    }
    el.msg.innerHTML = '';
    try {
      var data = await DH.post({ route: 'verify', event_id: state.event.event_id, nim: nim });
      if (!data.ok) {
        el.msg.innerHTML = banner('err', data.message || 'Verifikasi gagal.');
        return;
      }
      state.token = data.token;
      state.participant = data.participant;
      state.idempotencyKey = DH.uuid();
      el.identity.innerHTML =
        '<div class="name">' + esc(data.participant.nama) + '</div>' +
        '<div class="meta">NIM ' + esc(data.participant.nim) + '</div>' +
        (data.participant.judul ? '<div class="judul">' + esc(data.participant.judul) + '</div>' : '');
      el.signCard.classList.remove('hidden');
      renderSelect();
      renderList();
      if (!state.pad) {
        state.pad = DH_PAD.create(el.canvas);
      }
      DH_PAD.resize(el.canvas, state.pad);
      state.pad.clear();

      if (state.signedByNim[nim]) {
        el.msg.innerHTML = banner('warn', 'Anda sudah tanda tangan sebelumnya. Tidak perlu mengulang.');
        el.chkNotice.disabled = true;
        el.chkHadir.disabled = true;
        el.btnClear.disabled = true;
      } else {
        el.chkNotice.disabled = false;
        el.chkHadir.disabled = false;
        el.btnClear.disabled = false;
      }
      updateSubmitEnabled();
      el.signCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      el.msg.innerHTML = banner('err', 'Gagal menghubungi server: ' + esc(e.message));
    }
  }

  function updateSubmitEnabled() {
    var already = state.participant && state.signedByNim[state.participant.nim];
    var ready =
      state.pad &&
      !state.pad.isEmpty() &&
      el.chkNotice.checked &&
      el.chkHadir.checked &&
      !state.busy &&
      !already;
    el.btnSubmit.disabled = !ready;
  }

  async function onSubmit() {
    if (state.busy) return;
    if (!state.pad || state.pad.isEmpty()) {
      el.msg.innerHTML = banner('err', 'Tanda tangan belum diisi. Tulis pada kotak putih.');
      return;
    }
    state.busy = true;
    updateSubmitEnabled();
    el.msg.innerHTML = banner('warn', 'Mengirim…');
    try {
      var dataUrl = await DH_PAD.exportPng(state.pad, el.canvas);
      var b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      var data = await DH.post({
        route: 'submit',
        event_id: state.event.event_id,
        type: 'PESERTA',
        token: state.token,
        signature_png_b64: b64,
        idempotency_key: state.idempotencyKey,
        attendance_confirmed: true,
        notice_acknowledged: true,
        notice_version: state.notice.version
      });
      if (!data.ok) {
        if (data.error === 'session_expired') {
          el.msg.innerHTML = banner('err', 'Sesi berakhir. Pilih nama Anda sekali lagi.');
          resetSession();
          return;
        }
        el.msg.innerHTML = banner('err', data.message || 'Pengiriman gagal.');
        return;
      }
      el.msg.innerHTML =
        banner('ok', 'Tanda tangan terkirim. Kehadiran Anda tercatat.') +
        '<div class="receipt">' + esc(data.receipt_id) + '</div>';
      state.signedByNim[state.participant.nim] = {
        nim: state.participant.nim,
        received_at: data.received_at,
        receipt_id: data.receipt_id
      };
      el.chkNotice.disabled = true;
      el.chkHadir.disabled = true;
      el.btnClear.disabled = true;
      renderSelect();
      renderList();
      loadRoster();
    } catch (e) {
      el.msg.innerHTML = banner('err', 'Gagal mengirim: ' + esc(e.message) + '. Periksa koneksi lalu coba lagi.');
    } finally {
      state.busy = false;
      updateSubmitEnabled();
    }
  }

  function resetSession() {
    state.token = null;
    state.participant = null;
    el.select.value = '';
    el.signCard.classList.add('hidden');
    renderSelect();
  }

  function banner(kind, msg) {
    return '<div class="banner ' + kind + '">' + esc(msg) + '</div>';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }
})();
