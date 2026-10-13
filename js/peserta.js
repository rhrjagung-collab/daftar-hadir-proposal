// peserta.js — document-style daftar hadir: sign inside your own table row.
(function () {
  'use strict';

  var state = {
    event: null,
    notice: null,
    roster: [],
    signedByNim: {},
    images: {},
    active: null,
    pad: null,
    busy: false,
    idempotencyKey: DH.uuid()
  };

  var el = {};

  document.addEventListener('DOMContentLoaded', function () {
    el.tblBody = document.querySelector('#tbl-doc tbody');
    el.metaTanggal = document.getElementById('meta-tanggal');
    el.metaTempat = document.getElementById('meta-tempat');
    el.modal = document.getElementById('modal');
    el.modalIdentity = document.getElementById('modal-identity');
    el.modalNim = document.getElementById('modal-nim');
    el.noticeVersion = document.getElementById('notice-version');
    el.chkNotice = document.getElementById('chk-notice');
    el.chkHadir = document.getElementById('chk-hadir');
    el.btnClear = document.getElementById('btn-clear');
    el.btnSave = document.getElementById('btn-save');
    el.btnClose = document.getElementById('btn-close');
    el.modalMsg = document.getElementById('modal-msg');
    el.canvas = document.getElementById('sig-canvas');

    el.tblBody.addEventListener('click', function (e) {
      var btn = e.target.closest('button.btn-sign');
      if (!btn) return;
      openModal(btn.getAttribute('data-nim'));
    });
    el.btnClear.addEventListener('click', function () {
      if (state.pad) state.pad.clear();
      updateSaveEnabled();
    });
    el.btnSave.addEventListener('click', onSave);
    el.btnClose.addEventListener('click', closeModal);
    el.modal.addEventListener('click', function (e) {
      if (e.target === el.modal) closeModal();
    });
    el.chkNotice.addEventListener('change', updateSaveEnabled);
    el.chkHadir.addEventListener('change', updateSaveEnabled);
    el.modalNim.addEventListener('input', function () {
      el.modalNim.value = el.modalNim.value.replace(/\D/g, '');
      updateSaveEnabled();
    });
    window.addEventListener('resize', debounce(function () {
      if (state.pad && !el.modal.classList.contains('hidden')) DH_PAD.resize(el.canvas, state.pad);
    }, 250));

    refresh();
    setInterval(refresh, 30000);
  });

  async function refresh() {
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
      el.metaTanggal.textContent = 'Tanggal Ujian: ' + data.event.exam_date_label;
      el.metaTempat.textContent = 'Tempat Ujian: ' + data.event.exam_place;
      el.noticeVersion.textContent = data.notice.version;
      renderTable();
      loadMissingImages();
    } catch (e) {
      /* keep last good table on transient errors */
    }
  }

  function renderTable() {
    el.tblBody.innerHTML = state.roster
      .map(function (p) {
        var signed = state.signedByNim[p.nim];
        var ttd;
        if (signed) {
          ttd = state.images[p.nim]
            ? '<img class="sig-img" src="' + state.images[p.nim] + '" alt="Tanda tangan ' + esc(p.nama) + '">'
            : '<span class="sig-hint">…</span>';
        } else {
          ttd =
            '<button type="button" class="btn-sign" data-nim="' + esc(p.nim) + '">Tanda tangan</button>';
        }
        var ket = signed ? 'Hadir' : '';
        return (
          '<tr>' +
          '<td class="center">' + esc(p.no) + '.</td>' +
          '<td>' + esc(p.nama) + '</td>' +
          '<td>' + esc(p.nim) + '</td>' +
          '<td class="center ttd-cell">' + ttd + '</td>' +
          '<td class="center"><strong>' + ket + '</strong></td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function loadMissingImages() {
    var missing = Object.keys(state.signedByNim).filter(function (nim) {
      return !state.images[nim];
    });
    if (!missing.length) return;
    DH.get({ route: 'sig', event_id: state.event.event_id, nims: missing.join(',') })
      .then(function (data) {
        if (!data.ok || !data.images) return;
        Object.keys(data.images).forEach(function (nim) {
          state.images[nim] = data.images[nim];
        });
        renderTable();
      })
      .catch(function () {});
  }

  function openModal(nim) {
    var p = null;
    state.roster.forEach(function (row) {
      if (row.nim === nim) p = row;
    });
    if (!p) return;
    if (state.signedByNim[nim]) return;
    state.active = p;
    state.idempotencyKey = DH.uuid();
    el.modalIdentity.innerHTML =
      '<div class="name">' + esc(p.nama) + '</div>' +
      '<div class="meta">NIM ' + esc(p.nim) + '</div>' +
      (p.judul ? '<div class="judul">' + esc(p.judul) + '</div>' : '');
    el.modalNim.value = '';
    el.chkNotice.checked = false;
    el.chkHadir.checked = false;
    el.chkNotice.disabled = false;
    el.chkHadir.disabled = false;
    el.modalMsg.innerHTML = '';
    el.modal.classList.remove('hidden');
    if (!state.pad) state.pad = DH_PAD.create(el.canvas);
    setTimeout(function () {
      DH_PAD.resize(el.canvas, state.pad);
      state.pad.clear();
      updateSaveEnabled();
      el.modalNim.focus();
    }, 30);
  }

  function closeModal() {
    el.modal.classList.add('hidden');
    state.active = null;
    if (state.pad) state.pad.clear();
  }

  function updateSaveEnabled() {
    var ok =
      state.active &&
      el.modalNim.value === state.active.nim &&
      state.pad &&
      !state.pad.isEmpty() &&
      el.chkNotice.checked &&
      el.chkHadir.checked &&
      !state.busy;
    el.btnSave.disabled = !ok;
  }

  async function onSave() {
    if (state.busy || !state.active) return;
    if (el.modalNim.value !== state.active.nim) {
      el.modalMsg.innerHTML = banner('err', 'NIM tidak sesuai dengan baris yang dipilih.');
      return;
    }
    if (!state.pad || state.pad.isEmpty()) {
      el.modalMsg.innerHTML = banner('err', 'Tanda tangan belum diisi.');
      return;
    }
    state.busy = true;
    updateSaveEnabled();
    el.modalMsg.innerHTML = banner('warn', 'Menyimpan…');
    try {
      var vr = await DH.post({ route: 'verify', event_id: state.event.event_id, nim: state.active.nim });
      if (!vr.ok) {
        el.modalMsg.innerHTML = banner('err', vr.message || 'Verifikasi gagal.');
        return;
      }
      var dataUrl = await DH_PAD.exportPng(state.pad, el.canvas);
      var b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      var data = await DH.post({
        route: 'submit',
        event_id: state.event.event_id,
        type: 'PESERTA',
        token: vr.token,
        signature_png_b64: b64,
        idempotency_key: state.idempotencyKey,
        attendance_confirmed: true,
        notice_acknowledged: true,
        notice_version: state.notice.version
      });
      if (!data.ok) {
        el.modalMsg.innerHTML = banner('err', data.message || 'Gagal menyimpan.');
        return;
      }
      state.signedByNim[state.active.nim] = {
        nim: state.active.nim,
        received_at: data.received_at,
        receipt_id: data.receipt_id
      };
      el.modalMsg.innerHTML =
        banner('ok', 'Tanda tangan tersimpan. Baris Anda pada daftar sudah diperbarui.') +
        '<div class="receipt">' + esc(data.receipt_id) + '</div>';
      renderTable();
      loadMissingImages();
      setTimeout(closeModal, 1600);
      refresh();
    } catch (e) {
      el.modalMsg.innerHTML = banner('err', 'Gagal menyimpan: ' + esc(e.message) + '. Coba lagi.');
    } finally {
      state.busy = false;
      updateSaveEnabled();
    }
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
