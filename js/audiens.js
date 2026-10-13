// audiens.js — audience signing flow: identity → sign → receipt.
(function () {
  'use strict';

  var state = {
    event: null,
    notice: null,
    idempotencyKey: DH.uuid(),
    pad: null,
    canvas: null,
    busy: false
  };

  var el = {};

  document.addEventListener('DOMContentLoaded', function () {
    el.eventLine = document.getElementById('event-line');
    el.nim = document.getElementById('nim-input');
    el.nama = document.getElementById('nama-input');
    el.noticeVersion = document.getElementById('notice-version');
    el.chkNotice = document.getElementById('chk-notice');
    el.chkHadir = document.getElementById('chk-hadir');
    el.btnClear = document.getElementById('btn-clear');
    el.btnSubmit = document.getElementById('btn-submit');
    el.submitMsg = document.getElementById('submit-msg');
    el.stepForm = document.getElementById('step-form');
    el.stepDone = document.getElementById('step-done');
    el.doneBody = document.getElementById('done-body');
    el.canvas = document.getElementById('sig-canvas');
    state.canvas = el.canvas;

    el.nim.addEventListener('input', function () {
      el.nim.value = el.nim.value.replace(/\D/g, '');
      updateSubmitEnabled();
    });
    el.nama.addEventListener('input', updateSubmitEnabled);
    el.chkNotice.addEventListener('change', updateSubmitEnabled);
    el.chkHadir.addEventListener('change', updateSubmitEnabled);
    el.btnClear.addEventListener('click', function () {
      if (state.pad) state.pad.clear();
      updateSubmitEnabled();
    });
    el.btnSubmit.addEventListener('click', onSubmit);

    window.addEventListener('load', initPad);
    window.addEventListener('resize', debounce(function () {
      if (state.pad) DH_PAD.resize(el.canvas, state.pad);
    }, 250));

    loadEvent();
  });

  function initPad() {
    if (state.pad) return;
    state.pad = DH_PAD.create(el.canvas);
    DH_PAD.resize(el.canvas, state.pad);
  }

  async function loadEvent() {
    try {
      var data = await DH.get({ route: 'roster', event_id: DH.config.EVENT_ID || '' });
      if (data.ok && data.event) {
        state.event = data.event;
        state.notice = data.notice;
        el.eventLine.textContent =
          data.event.name + ' — ' + data.event.exam_date_label + ' (' + data.event.exam_place + ')';
        el.noticeVersion.textContent = data.notice.version;
      } else {
        el.eventLine.textContent = 'Jadwal tidak tersedia. Hubungi prodi.';
      }
    } catch (e) {
      el.eventLine.textContent = 'Gagal memuat jadwal: ' + esc(e.message);
    }
  }

  function updateSubmitEnabled() {
    var ready =
      state.pad &&
      !state.pad.isEmpty() &&
      el.nim.value.length >= 6 &&
      el.nama.value.trim().length >= 3 &&
      el.chkNotice.checked &&
      el.chkHadir.checked &&
      !state.busy;
    el.btnSubmit.disabled = !ready;
  }

  async function onSubmit() {
    if (state.busy) return;
    if (!state.event) {
      el.submitMsg.innerHTML = banner('err', 'Jadwal belum termuat. Muat ulang halaman.');
      return;
    }
    if (!state.pad || state.pad.isEmpty()) {
      el.submitMsg.innerHTML = banner('err', 'Tanda tangan belum diisi.');
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
        type: 'AUDIENS',
        nim: el.nim.value,
        nama: el.nama.value.trim(),
        signature_png_b64: b64,
        idempotency_key: state.idempotencyKey,
        attendance_confirmed: true,
        notice_acknowledged: true,
        notice_version: state.notice.version
      });
      if (!data.ok) {
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

  function showDone(data) {
    el.stepForm.classList.add('hidden');
    el.stepDone.classList.remove('hidden');
    var head = data.already_signed
      ? banner('warn', 'NIM ini sudah tercatat sebagai audiens. Data sebelumnya tetap berlaku.')
      : banner('ok', 'Kehadiran sebagai audiens berhasil dicatat.');
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
