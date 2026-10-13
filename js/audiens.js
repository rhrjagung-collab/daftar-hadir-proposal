// audiens.js — flow: isi identitas → tanggal/tempat → tanda tangan (gambar/tulis) → daftar audiens.
(function () {
  'use strict';

  var state = {
    event: null,
    notice: null,
    audiens: [],
    pad: null,
    uploadDataUrl: null,
    busy: false,
    idempotencyKey: DH.uuid()
  };

  var el = {};

  document.addEventListener('DOMContentLoaded', function () {
    el.eventLine = document.getElementById('event-line');
    el.formCard = document.getElementById('form-card');
    el.doneCard = document.getElementById('done-card');
    el.doneBody = document.getElementById('done-body');
    el.nim = document.getElementById('nim-input');
    el.nama = document.getElementById('nama-input');
    el.tanggal = document.getElementById('in-tanggal');
    el.tempat = document.getElementById('in-tempat');
    el.noticeVersion = document.getElementById('notice-version');
    el.chkNotice = document.getElementById('chk-notice');
    el.chkHadir = document.getElementById('chk-hadir');
    el.canvas = document.getElementById('sig-canvas');
    el.fileInput = document.getElementById('file-input');
    el.filePreview = document.getElementById('file-preview');
    el.btnRemoveFile = document.getElementById('btn-remove-file');
    el.btnClear = document.getElementById('btn-clear');
    el.btnSubmit = document.getElementById('btn-submit');
    el.btnAgain = document.getElementById('btn-again');
    el.submitMsg = document.getElementById('submit-msg');
    el.sigSourceHint = document.getElementById('sig-source-hint');
    el.tblBody = document.querySelector('#tbl-audiens tbody');
    el.listUpdated = document.getElementById('list-updated');

    el.nim.addEventListener('input', function () {
      el.nim.value = el.nim.value.replace(/\D/g, '');
      updateEnabled();
    });
    el.nama.addEventListener('input', updateEnabled);
    el.tanggal.addEventListener('input', updateEnabled);
    el.tempat.addEventListener('input', updateEnabled);
    el.chkNotice.addEventListener('change', updateEnabled);
    el.chkHadir.addEventListener('change', updateEnabled);
    el.btnClear.addEventListener('click', function () {
      if (state.pad) state.pad.clear();
      updateEnabled();
    });
    el.fileInput.addEventListener('change', onFile);
    el.btnRemoveFile.addEventListener('click', removeUpload);
    el.btnSubmit.addEventListener('click', onSubmit);
    el.btnAgain.addEventListener('click', resetForm);
    window.addEventListener('resize', debounce(function () {
      if (state.pad) DH_PAD.resize(el.canvas, state.pad);
    }, 250));

    initPad();
    refresh();
    setInterval(refresh, 30000);
  });

  function initPad() {
    state.pad = DH_PAD.create(el.canvas);
    DH_PAD.resize(el.canvas, state.pad);
  }

  /* ---------- data ---------- */

  async function refresh() {
    try {
      var data = await DH.get({ route: 'audiens_list', event_id: DH.config.EVENT_ID || '' });
      if (!data.ok) return;
      state.event = data.event;
      state.notice = data.notice;
      state.audiens = data.audiens || [];
      el.eventLine.textContent =
        data.event.name + ' — ' + data.event.exam_date_label + ', ' + data.event.exam_place;
      el.noticeVersion.textContent = data.notice.version;
      if (!el.tanggal.value.trim()) el.tanggal.value = data.event.exam_date_label || '';
      if (!el.tempat.value.trim()) el.tempat.value = data.event.exam_place || '';
      renderTable();
      updateEnabled();
      el.listUpdated.textContent = '(diperbarui ' + new Date().toLocaleTimeString('id-ID') + ')';
    } catch (e) {
      /* keep last good view */
    }
  }

  function renderTable() {
    if (!state.audiens.length) {
      el.tblBody.innerHTML = '<tr><td colspan="4" class="sig-hint" style="text-align:center">Belum ada audiens yang mendaftar.</td></tr>';
      return;
    }
    el.tblBody.innerHTML = state.audiens
      .map(function (a) {
        return (
          '<tr>' +
          '<td class="center">' + esc(a.no) + '.</td>' +
          '<td>' + esc(a.nama) + '</td>' +
          '<td>' + esc(a.nim) + '</td>' +
          '<td class="center">' + esc(a.received_at || '') + '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  /* ---------- form ---------- */

  function onFile() {
    var file = el.fileInput.files && el.fileInput.files[0];
    if (!file) return;
    el.submitMsg.innerHTML = '<div class="banner warn">Memproses gambar…</div>';
    DH_PAD.fileToPng(file)
      .then(function (dataUrl) {
        state.uploadDataUrl = dataUrl;
        el.filePreview.src = dataUrl;
        el.filePreview.classList.remove('hidden');
        el.btnRemoveFile.classList.remove('hidden');
        if (state.pad) state.pad.clear();
        el.sigSourceHint.textContent = 'Tanda tangan dipakai dari gambar yang diunggah.';
        el.submitMsg.innerHTML = '';
        updateEnabled();
      })
      .catch(function (e) {
        el.fileInput.value = '';
        el.submitMsg.innerHTML = '<div class="banner err">' + esc(e.message) + '</div>';
      });
  }

  function removeUpload() {
    state.uploadDataUrl = null;
    el.fileInput.value = '';
    el.filePreview.src = '';
    el.filePreview.classList.add('hidden');
    el.btnRemoveFile.classList.add('hidden');
    el.sigSourceHint.textContent = 'Belum ada tanda tangan. Tulis di kotak kiri atau unggah gambar.';
    updateEnabled();
  }

  function hasSignature() {
    return !!state.uploadDataUrl || (state.pad && !state.pad.isEmpty());
  }

  function updateEnabled() {
    var ok =
      state.event &&
      el.nim.value.trim().length >= 6 &&
      el.nama.value.trim().length >= 3 &&
      el.tanggal.value.trim() &&
      el.tempat.value.trim() &&
      hasSignature() &&
      el.chkNotice.checked &&
      el.chkHadir.checked &&
      !state.busy;
    el.btnSubmit.disabled = !ok;
    if (state.uploadDataUrl) {
      el.sigSourceHint.textContent = 'Tanda tangan dipakai dari gambar yang diunggah.';
    } else if (state.pad && !state.pad.isEmpty()) {
      el.sigSourceHint.textContent = 'Tanda tangan dipakai dari tulisan di layar.';
    }
  }

  async function onSubmit() {
    if (state.busy || !state.event) return;
    if (!el.nim.value.trim() || !el.nama.value.trim()) {
      el.submitMsg.innerHTML = '<div class="banner err">Isi NIM dan Nama Lengkap.</div>';
      return;
    }
    if (!el.tanggal.value.trim() || !el.tempat.value.trim()) {
      el.submitMsg.innerHTML = '<div class="banner err">Isi Tanggal Ujian dan Tempat Ujian.</div>';
      return;
    }
    if (!hasSignature()) {
      el.submitMsg.innerHTML = '<div class="banner err">Tanda tangan belum diisi.</div>';
      return;
    }
    state.busy = true;
    updateEnabled();
    el.submitMsg.innerHTML = '<div class="banner warn">Menyimpan…</div>';
    try {
      var dataUrl;
      if (state.uploadDataUrl) dataUrl = state.uploadDataUrl;
      else dataUrl = await DH_PAD.exportPng(state.pad, el.canvas);
      var b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      var data = await DH.post({
        route: 'submit',
        event_id: state.event.event_id,
        type: 'AUDIENS',
        nim: el.nim.value.trim(),
        nama: el.nama.value.trim(),
        signature_png_b64: b64,
        idempotency_key: state.idempotencyKey,
        attendance_confirmed: true,
        notice_acknowledged: true,
        notice_version: state.notice.version,
        exam_date: el.tanggal.value.trim(),
        exam_place: el.tempat.value.trim()
      });
      if (!data.ok) {
        el.submitMsg.innerHTML = '<div class="banner err">' + esc(data.message || 'Gagal menyimpan.') + '</div>';
        return;
      }
      showDone(data);
      refresh();
    } catch (e) {
      el.submitMsg.innerHTML = '<div class="banner err">Gagal menyimpan: ' + esc(e.message) + '. Coba lagi.</div>';
    } finally {
      state.busy = false;
      updateEnabled();
    }
  }

  function showDone(data) {
    el.doneBody.innerHTML =
      '<div class="banner ok">Tanda tangan Anda tersimpan. Daftar audiens sudah diperbarui.</div>' +
      '<p><strong>' + esc(el.nama.value.trim()) + '</strong> — NIM ' + esc(el.nim.value.trim()) + '</p>' +
      '<p>Tanggal Ujian: ' + esc(el.tanggal.value.trim()) + '<br>Tempat Ujian: ' + esc(el.tempat.value.trim()) + '</p>' +
      '<div class="receipt">Kode tanda terima: ' + esc(data.receipt_id) + '</div>' +
      '<p class="sig-hint">Disimpan pada ' + esc(data.received_at || '') + '</p>';
    el.formCard.classList.add('hidden');
    el.doneCard.classList.remove('hidden');
    el.doneCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetForm() {
    state.idempotencyKey = DH.uuid();
    state.uploadDataUrl = null;
    el.nim.value = '';
    el.nama.value = '';
    el.fileInput.value = '';
    el.filePreview.src = '';
    el.filePreview.classList.add('hidden');
    el.btnRemoveFile.classList.add('hidden');
    el.chkNotice.checked = false;
    el.chkHadir.checked = false;
    el.submitMsg.innerHTML = '';
    el.sigSourceHint.textContent = 'Belum ada tanda tangan. Tulis di kotak kiri atau unggah gambar.';
    if (state.pad) state.pad.clear();
    el.doneCard.classList.add('hidden');
    el.formCard.classList.remove('hidden');
    el.nim.focus();
    updateEnabled();
  }

  /* ---------- utils ---------- */

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
