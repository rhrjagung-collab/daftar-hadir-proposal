// admin.js — officer dashboard: login, status tables, .docx export.
(function () {
  'use strict';

  var state = { token: null, eventId: null, busy: false };
  var el = {};

  document.addEventListener('DOMContentLoaded', function () {
    el.loginCard = document.getElementById('login-card');
    el.dashCard = document.getElementById('dash-card');
    el.adminKey = document.getElementById('admin-key');
    el.btnLogin = document.getElementById('btn-login');
    el.loginMsg = document.getElementById('login-msg');
    el.eventLine = document.getElementById('event-line');
    el.statTotal = document.getElementById('stat-total');
    el.statHadir = document.getElementById('stat-hadir');
    el.statAudiens = document.getElementById('stat-audiens');
    el.btnRefresh = document.getElementById('btn-refresh');
    el.btnExportPeserta = document.getElementById('btn-export-peserta');
    el.btnExportAudiens = document.getElementById('btn-export-audiens');
    el.exportMsg = document.getElementById('export-msg');
    el.linkDrive = document.getElementById('link-drive');
    el.tblPeserta = document.querySelector('#tbl-peserta tbody');
    el.tblAudiens = document.querySelector('#tbl-audiens tbody');

    el.btnLogin.addEventListener('click', onLogin);
    el.adminKey.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onLogin();
    });
    el.btnRefresh.addEventListener('click', loadStatus);
    el.btnExportPeserta.addEventListener('click', function () { doExport('PESERTA_ALL'); });
    el.btnExportAudiens.addEventListener('click', function () { doExport('AUDIENS_ALL'); });
  });

  async function onLogin() {
    var key = el.adminKey.value.trim();
    if (!key) {
      el.loginMsg.innerHTML = banner('err', 'Masukkan kunci admin.');
      return;
    }
    el.btnLogin.disabled = true;
    el.loginMsg.innerHTML = '';
    try {
      var data = await DH.post({ route: 'admin_login', admin_key: key });
      if (!data.ok) {
        el.loginMsg.innerHTML = banner('err', data.message || 'Login gagal.');
        return;
      }
      state.token = data.admin_token;
      el.loginCard.classList.add('hidden');
      el.dashCard.classList.remove('hidden');
      await loadStatus();
    } catch (e) {
      el.loginMsg.innerHTML = banner('err', 'Gagal menghubungi server: ' + esc(e.message));
    } finally {
      el.btnLogin.disabled = false;
    }
  }

  async function loadStatus() {
    el.btnRefresh.disabled = true;
    try {
      var data = await DH.post({
        route: 'admin_status',
        admin_token: state.token,
        event_id: DH.config.EVENT_ID || ''
      });
      if (!data.ok) {
        el.exportMsg.innerHTML = banner('err', data.message || 'Gagal memuat status.');
        if (data.error === 'unauthorized') showLoginAgain();
        return;
      }
      state.eventId = data.event.event_id;
      el.eventLine.textContent =
        data.event.name + ' — ' + data.event.exam_date_label + ' (' + data.event.exam_place + ')';
      el.statTotal.textContent = data.counts.total_peserta;
      el.statHadir.textContent = data.counts.hadir_peserta;
      el.statAudiens.textContent = data.counts.total_audiens;
      if (data.drive_root_url) el.linkDrive.href = data.drive_root_url;

      el.tblPeserta.innerHTML = (data.peserta || [])
        .map(function (p) {
          return (
            '<tr>' +
            '<td>' + esc(p.no) + '</td>' +
            '<td>' + esc(p.nama) + '</td>' +
            '<td>' + esc(p.nim) + '</td>' +
            '<td>' + (p.hadir ? '<span class="pill hadir">Hadir</span>' : '<span class="pill belum">Belum</span>') + '</td>' +
            '<td>' + esc(p.received_at || '—') + '</td>' +
            '<td>' + esc(p.receipt_id || '—') + '</td>' +
            '<td><button type="button" class="secondary" data-nim="' + esc(p.nim) + '" style="padding:6px 10px;font-size:0.8rem">Docx</button></td>' +
            '</tr>'
          );
        })
        .join('');

      Array.prototype.forEach.call(el.tblPeserta.querySelectorAll('button[data-nim]'), function (btn) {
        btn.addEventListener('click', function () {
          doExport('PESERTA_ONE', btn.getAttribute('data-nim'));
        });
      });

      el.tblAudiens.innerHTML = (data.audiens || [])
        .map(function (a) {
          return (
            '<tr>' +
            '<td>' + esc(a.no) + '</td>' +
            '<td>' + esc(a.nama) + '</td>' +
            '<td>' + esc(a.nim) + '</td>' +
            '<td>' + esc(a.received_at || '—') + '</td>' +
            '<td>' + esc(a.receipt_id || '—') + '</td>' +
            '</tr>'
          );
        })
        .join('') || '<tr><td colspan="5">Belum ada audiens.</td></tr>';
    } catch (e) {
      el.exportMsg.innerHTML = banner('err', 'Gagal memuat status: ' + esc(e.message));
    } finally {
      el.btnRefresh.disabled = false;
    }
  }

  async function doExport(docType, nim) {
    if (state.busy) return;
    state.busy = true;
    el.exportMsg.innerHTML = banner('warn', 'Menyiapkan dokumen…');
    try {
      var data = await DH.post({
        route: 'admin_export',
        admin_token: state.token,
        event_id: state.eventId,
        doc_type: docType,
        nim: nim || ''
      });
      if (!data.ok) {
        el.exportMsg.innerHTML = banner('err', data.message || 'Ekspor gagal.');
        if (data.error === 'unauthorized') showLoginAgain();
        return;
      }
      el.exportMsg.innerHTML =
        banner('ok', 'Dokumen .docx dibuat: ' + data.title) +
        '<div class="btn-row"><a class="home-card" href="' + esc(data.file_url) + '" target="_blank" rel="noopener" style="border-top-color:var(--ok-ink);padding:10px 14px"><strong style="font-size:0.9rem">Buka .docx di Google Drive</strong></a></div>';
      if (data.file_url) window.open(data.file_url, '_blank', 'noopener');
    } catch (e) {
      el.exportMsg.innerHTML = banner('err', 'Ekspor gagal: ' + esc(e.message));
    } finally {
      state.busy = false;
    }
  }

  function showLoginAgain() {
    state.token = null;
    el.dashCard.classList.add('hidden');
    el.loginCard.classList.remove('hidden');
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
})();
