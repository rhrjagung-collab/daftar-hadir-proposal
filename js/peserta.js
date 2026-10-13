// peserta.js — flow: pilih nama → formulir (tanggal, tempat, tanda tangan gambar/tulis) → daftar.
(function () {
  'use strict';

  var state = {
    event: null,
    notice: null,
    roster: [],
    signedByNim: {},
    images: {},
    selected: null,
    pad: null,
    uploadDataUrl: null,
    busy: false,
    idempotencyKey: DH.uuid()
  };

  var el = {};

  document.addEventListener('DOMContentLoaded', function () {
    el.eventLine = document.getElementById('event-line');
    el.select = document.getElementById('nama-select');
    el.selectCard = document.getElementById('select-card');
    el.selectMsg = document.getElementById('select-msg');
    el.formCard = document.getElementById('form-card');
    el.identity = document.getElementById('identity');
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
    el.btnBack = document.getElementById('btn-back');
    el.btnAgain = document.getElementById('btn-again');
    el.submitMsg = document.getElementById('submit-msg');
    el.sigSourceHint = document.getElementById('sig-source-hint');
    el.doneCard = document.getElementById('done-card');
    el.doneBody = document.getElementById('done-body');
    el.tblBody = document.querySelector('#tbl-doc tbody');
    el.listUpdated = document.getElementById('list-updated');

    el.select.addEventListener('change', onSelect);
    el.btnBack.addEventListener('click', backToSelect);
    el.btnAgain.addEventListener('click', backToSelect);
    el.btnClear.addEventListener('click', function () {
      if (state.pad) state.pad.clear();
      updateEnabled();
    });
    el.btnRemoveFile.addEventListener('click', removeUpload);
    el.fileInput.addEventListener('change', onFile);
    el.btnSubmit.addEventListener('click', onSubmit);
    el.chkNotice.addEventListener('change', updateEnabled);
    el.chkHadir.addEventListener('change', updateEnabled);
    el.tanggal.addEventListener('input', updateEnabled);
    el.tempat.addEventListener('input', updateEnabled);
    window.addEventListener('resize', debounce(function () {
      if (state.pad && !el.formCard.classList.contains('hidden')) DH_PAD.resize(el.canvas, state.pad);
    }, 250));

    refresh();
    setInterval(refresh, 30000);
  });

  /* ---------- data ---------- */

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
      el.eventLine.textContent =
        data.event.name + ' — ' + data.event.exam_date_label + ', ' + data.event.exam_place;
      el.noticeVersion.textContent = data.notice.version;
      populateSelect();
      renderTable();
      loadMissingImages();
      el.listUpdated.textContent = '(diperbarui ' + new Date().toLocaleTimeString('id-ID') + ')';
    } catch (e) {
      /* keep last good view on transient errors */
    }
  }

  function populateSelect() {
    var current = el.select.value;
    var opts = ['<option value="">— Pilih nama Anda —</option>'];
    state.roster.forEach(function (p) {
      opts.push(
        '<option value="' + esc(p.nim) + '">' + esc(p.no) + '. ' + esc(p.nama) + ' — NIM ' + esc(p.nim) + '</option>'
      );
    });
    el.select.innerHTML = opts.join('');
    if (current) el.select.value = current;
  }

  function renderTable() {
    el.tblBody.innerHTML = state.roster
      .map(function (p) {
        var signed = state.signedByNim[p.nim];
        var ttd = '';
        if (signed) {
          ttd = state.images[p.nim]
            ? '<img class="sig-img" src="' + state.images[p.nim] + '" alt="Tanda tangan ' + esc(p.nama) + '">'
            : '<span class="sig-hint">…</span>';
        }
        return (
          '<tr>' +
          '<td class="center">' + esc(p.no) + '.</td>' +
          '<td>' + esc(p.nama) + '</td>' +
          '<td>' + esc(p.nim) + '</td>' +
          '<td class="center ttd-cell">' + ttd + '</td>' +
          '<td class="center"><strong>' + (signed ? 'Hadir' : '') + '</strong></td>' +
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

  /* ---------- step 1: select ---------- */

  async function onSelect() {
    var nim = el.select.value;
    el.selectMsg.innerHTML = '';
    if (!nim) return;
    var p = null;
    state.roster.forEach(function (row) {
      if (row.nim === nim) p = row;
    });
    if (!p) return;
    if (state.signedByNim[nim]) {
      showAlreadySigned(p);
      return;
    }
    el.selectMsg.innerHTML = '<div class="banner warn">Memeriksa data…</div>';
    try {
      var vr = await DH.post({ route: 'verify', event_id: state.event.event_id, nim: nim });
      if (!vr.ok) {
        el.selectMsg.innerHTML = '<div class="banner err">' + esc(vr.message || 'Verifikasi gagal.') + '</div>';
        return;
      }
      el.selectMsg.innerHTML = '';
      openForm(p);
    } catch (e) {
      el.selectMsg.innerHTML = '<div class="banner err">Gagal memeriksa data. Coba lagi.</div>';
    }
  }

  /* ---------- step 2: form ---------- */

  function openForm(p) {
    state.selected = p;
    state.idempotencyKey = DH.uuid();
    state.uploadDataUrl = null;
    el.fileInput.value = '';
    el.filePreview.classList.add('hidden');
    el.btnRemoveFile.classList.add('hidden');
    el.chkNotice.checked = false;
    el.chkHadir.checked = false;
    el.submitMsg.innerHTML = '';
    el.identity.innerHTML =
      '<div class="name">' + esc(p.nama) + '</div>' +
      '<div class="meta">NIM ' + esc(p.nim) + '</div>' +
      (p.judul ? '<div class="judul">' + esc(p.judul) + '</div>' : '');
    el.tanggal.value = state.event.exam_date_label || '';
    el.tempat.value = state.event.exam_place || '';
    el.sigSourceHint.textContent = 'Belum ada tanda tangan. Tulis di kotak kiri atau unggah gambar.';

    el.selectCard.classList.add('hidden');
    el.doneCard.classList.add('hidden');
    el.formCard.classList.remove('hidden');
    setTimeout(function () {
      if (!state.pad) state.pad = DH_PAD.create(el.canvas);
      DH_PAD.resize(el.canvas, state.pad);
      state.pad.clear();
      updateEnabled();
      el.tanggal.focus();
    }, 30);
  }

  function backToSelect() {
    state.selected = null;
    state.uploadDataUrl = null;
    el.select.value = '';
    el.selectMsg.innerHTML = '';
    el.formCard.classList.add('hidden');
    el.doneCard.classList.add('hidden');
    el.selectCard.classList.remove('hidden');
  }

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
      state.selected &&
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
    if (state.busy || !state.selected || !state.event) return;
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
      var vr = await DH.post({ route: 'verify', event_id: state.event.event_id, nim: state.selected.nim });
      if (!vr.ok) {
        el.submitMsg.innerHTML = '<div class="banner err">' + esc(vr.message || 'Verifikasi gagal. Pilih nama ulang.') + '</div>';
        return;
      }
      var dataUrl;
      if (state.uploadDataUrl) dataUrl = state.uploadDataUrl;
      else dataUrl = await DH_PAD.exportPng(state.pad, el.canvas);
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
        notice_version: state.notice.version,
        exam_date: el.tanggal.value.trim(),
        exam_place: el.tempat.value.trim()
      });
      if (!data.ok) {
        el.submitMsg.innerHTML = '<div class="banner err">' + esc(data.message || 'Gagal menyimpan.') + '</div>';
        return;
      }
      var p = state.selected;
      state.signedByNim[p.nim] = { nim: p.nim, received_at: data.received_at, receipt_id: data.receipt_id };
      renderTable();
      loadMissingImages();
      showDone(p, data);
      refresh();
    } catch (e) {
      el.submitMsg.innerHTML = '<div class="banner err">Gagal menyimpan: ' + esc(e.message) + '. Coba lagi.</div>';
    } finally {
      state.busy = false;
      updateEnabled();
    }
  }

  /* ---------- step 3: done ---------- */

  function showDone(p, data) {
    el.doneBody.innerHTML =
      '<div class="banner ok">Tanda tangan Anda tersimpan. Baris pada daftar kehadiran sudah diperbarui.</div>' +
      '<p><strong>' + esc(p.nama) + '</strong> — NIM ' + esc(p.nim) + '</p>' +
      '<p>Tanggal Ujian: ' + esc(el.tanggal.value.trim()) + '<br>Tempat Ujian: ' + esc(el.tempat.value.trim()) + '</p>' +
      '<div class="receipt">Kode tanda terima: ' + esc(data.receipt_id) + '</div>' +
      '<p class="sig-hint">Disimpan pada ' + esc(data.received_at || '') + '</p>';
    el.formCard.classList.add('hidden');
    el.selectCard.classList.add('hidden');
    el.doneCard.classList.remove('hidden');
    el.doneCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showAlreadySigned(p) {
    var s = state.signedByNim[p.nim];
    el.doneBody.innerHTML =
      '<div class="banner ok">Nama ini sudah tanda tangan sebelumnya.</div>' +
      '<p><strong>' + esc(p.nama) + '</strong> — NIM ' + esc(p.nim) + '</p>' +
      (s && s.received_at ? '<p class="sig-hint">Tersimpan pada ' + esc(s.received_at) + '</p>' : '') +
      (s && s.receipt_id ? '<div class="receipt">Kode tanda terima: ' + esc(s.receipt_id) + '</div>' : '');
    el.selectCard.classList.add('hidden');
    el.formCard.classList.add('hidden');
    el.doneCard.classList.remove('hidden');
    el.doneCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
