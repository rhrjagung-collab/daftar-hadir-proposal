// peserta.js — participant signing flow: roster → verify (NIM) → sign → receipt.
(function () {
  'use strict';

  var state = {
    event: null,
    notice: null,
    token: null,
    participant: null,
    idempotencyKey: DH.uuid(),
    pad: null,
    canvas: null,
    busy: false
  };

  var el = {};

  document.addEventListener('DOMContentLoaded', function () {
    el.eventLine = document.getElementById('event-line');
    el.select = document.getElementById('nama-select');
    el.btnVerify = document.getElementById('btn-verify');
    el.verifyMsg = document.getElementById('verify-msg');
    el.stepVerify = document.getElementById('step-verify');
    el.stepSign = document.getElementById('step-sign');
    el.stepDone = document.getElementById('step-done');
    el.identity = document.getElementById('identity');
    el.noticeVersion = document.getElementById('notice-version');
    el.chkNotice = document.getElementById('chk-notice');
    el.chkHadir = document.getElementById('chk-hadir');
    el.btnClear = document.getElementById('btn-clear');
    el.btnSubmit = document.getElementById('btn-submit');
    el.submitMsg = document.getElementById('submit-msg');
    el.doneBody = document.getElementById('done-body');
    el.canvas = document.getElementById('sig-canvas');
    state.canvas = el.canvas;

    el.btnVerify.addEventListener('click', onVerify);
    el.btnClear.addEventListener('click', function () {
      if (state.pad) state.pad.clear();
      updateSubmitEnabled();
    });
    el.chkNotice.addEventListener('change', updateSubmitEnabled);
    el.chkHadir.addEventListener('change', updateSubmitEnabled);
    el.btnSubmit.addEventListener('click', onSubmit);
    el.select.addEventListener('change', function () {
      el.btnVerify.disabled = !el.select.value;
    });

    window.addEventListener('resize', debounce(function () {
      if (state.pad && !el.stepSign.classList.contains('hidden')) DH_PAD.resize(el.canvas, state.pad);
    }, 250));

    loadRoster();
  });

  function initPad() {
    if (state.pad) {
      DH_PAD.resize(el.canvas, state.pad);
      return;
    }
    state.pad = DH_PAD.create(el.canvas);
    DH_PAD.resize(el.canvas, state.pad);
  }

  async function loadRoster() {
    try {
      var data = await DH.get({ route: 'roster', event_id: DH.config.EVENT_ID || '' });
      if (!data.ok || !data.event) {
        el.eventLine.textContent = 'Jadwal tidak tersedia. Hubungi prodi.';
        return;
      }
      state.event = data.event;
      state.notice = data.notice;
      el.eventLine.textContent =
        data.event.name + ' — ' + data.event.exam_date_label + ' (' + data.event.exam_place + ')';
      el.noticeVersion.textContent = data.notice.version;

      var signed = {};
      (data.signed_nims || []).forEach(function (n) { signed[n] = true; });

      var opts = ['<option value="">— pilih nama Anda —</option>'];
      (data.peserta || []).forEach(function (p) {
        var suffix = signed[p.nim] ? ' (sudah hadir)' : '';
        opts.push('<option value="' + esc(p.nim) + '">' + esc(p.nama) + ' (' + esc(p.nim) + ')' + suffix + '</option>');
      });
      el.select.innerHTML = opts.join('');
    } catch (e) {
      el.eventLine.textContent = 'Gagal memuat jadwal: ' + esc(e.message);
    }
  }

  async function onVerify() {
    var nim = el.select.value;
    if (!nim) return;
    el.btnVerify.disabled = true;
    el.verifyMsg.innerHTML = '';
    try {
      var data = await DH.post({ route: 'verify', event_id: state.event.event_id, nim: nim });
      if (!data.ok) {
        el.verifyMsg.innerHTML = banner('err', data.message || 'Verifikasi gagal.');
        el.btnVerify.disabled = false;
        return;
      }
      state.token = data.token;
      state.participant = data.participant;
      renderIdentity(data.participant, data.event);
      el.stepVerify.classList.add('hidden');
      el.stepSign.classList.remove('hidden');
      window.scrollTo(0, 0);
      setTimeout(initPad, 50);
      updateSubmitEnabled();
    } catch (e) {
      el.verifyMsg.innerHTML = banner('err', 'Gagal menghubungi server: ' + esc(e.message));
      el.btnVerify.disabled = false;
    }
  }

  function renderIdentity(p, ev) {
    el.identity.innerHTML =
      '<div class="name">' + esc(p.nama) + '</div>' +
      '<div class="meta">NIM ' + esc(p.nim) + (p.peminatan ? ' — ' + esc(p.peminatan) : '') + '</div>' +
      (p.judul ? '<div class="judul">' + esc(p.judul) + '</div>' : '');
  }

  function updateSubmitEnabled() {
    var ready =
      state.pad &&
      !state.pad.isEmpty() &&
      el.chkNotice.checked &&
      el.chkHadir.checked &&
      !state.busy;
    el.btnSubmit.disabled = !ready;
  }

  async function onSubmit() {
    if (state.busy) return;
    if (!state.pad || state.pad.isEmpty()) {
      el.submitMsg.innerHTML = banner('err', 'Tanda tangan belum diisi.');
      return;
    }
    if (!el.chkNotice.checked || !el.chkHadir.checked) {
      el.submitMsg.innerHTML = banner('err', 'Centang pernyataan privasi dan kehadiran.');
      return;
    }
    state.busy = true;
    updateSubmitEnabled();
    el.submitMsg.innerHTML = banner('warn', 'Mengirim…');
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
          resetToVerify(data.message);
          return;
        }
        el.submitMsg.innerHTML = banner('err', data.message || 'Pengiriman gagal.');
        return;
      }
      showDone(data);
    } catch (e) {
      el.submitMsg.innerHTML = banner('err', 'Gagal mengirim: ' + esc(e.message) + '. Periksa koneksi lalu coba lagi.');
    } finally {
      state.busy = false;
      updateSubmitEnabled();
    }
  }

  function resetToVerify(msg) {
    state.token = null;
    state.participant = null;
    state.idempotencyKey = DH.uuid();
    el.stepSign.classList.add('hidden');
    el.stepVerify.classList.remove('hidden');
    el.verifyMsg.innerHTML = banner('warn', msg || 'Sesi berakhir. Silakan verifikasi ulang.');
    el.btnVerify.disabled = !el.select.value;
    window.scrollTo(0, 0);
  }

  function showDone(data) {
    el.stepSign.classList.add('hidden');
    el.stepVerify.classList.add('hidden');
    el.stepDone.classList.remove('hidden');
    var head = data.already_signed
      ? banner('warn', 'Anda sudah pernah menandatangani daftar hadir untuk sesi ini. Data sebelumnya tetap berlaku — tidak perlu mengulang.')
      : banner('ok', 'Kehadiran berhasil dicatat dan tanda tangan tersimpan di Google Drive institusi.');
    el.doneBody.innerHTML =
      head +
      '<div>Bukti kehadiran (receipt):</div>' +
      '<div class="receipt">' + esc(data.receipt_id) + '</div>' +
      (data.sha256 ? '<div class="sha">SHA-256: ' + esc(data.sha256) + '</div>' : '') +
      (data.received_at ? '<div class="sha">Waktu: ' + esc(data.received_at) + '</div>' : '');
    window.scrollTo(0, 0);
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
