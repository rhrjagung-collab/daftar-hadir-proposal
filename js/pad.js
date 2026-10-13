// pad.js — canvas helpers: high-DPI 2:1 pad, PNG export with size guard.
(function () {
  'use strict';

  var MAX_PNG_BYTES = 220000;

  function create(canvas) {
    return new window.SignaturePad(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#102a43',
      minWidth: 0.8,
      maxWidth: 2.4,
      velocityFilterWeight: 0.7,
      minDistance: 2
    });
  }

  function resize(canvas, pad) {
    var dataUrl = pad.isEmpty() ? null : pad.toDataURL();
    var width = Math.max(280, Math.floor(canvas.parentElement.clientWidth));
    var height = Math.floor(width / 2);
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    pad.clear();
    if (dataUrl) pad.fromDataURL(dataUrl);
  }

  function exportPng(pad, canvas) {
    var dataUrl = pad.toDataURL('image/png');
    var approxBytes = Math.floor(dataUrl.length * 0.75);
    if (approxBytes <= MAX_PNG_BYTES) {
      return Promise.resolve(dataUrl);
    }
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var tmp = document.createElement('canvas');
        tmp.width = Math.max(1, Math.floor(canvas.width / 2));
        tmp.height = Math.max(1, Math.floor(canvas.height / 2));
        tmp.getContext('2d').drawImage(img, 0, 0, tmp.width, tmp.height);
        resolve(tmp.toDataURL('image/png'));
      };
      img.onerror = function () {
        reject(new Error('Gagal memproses gambar tanda tangan.'));
      };
      img.src = dataUrl;
    });
  }

  // Turn an uploaded PNG/JPEG into a safe, re-encoded PNG data URL
  // (strips metadata/EXIF, white background, size-guarded like pad export).
  function fileToPng(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error('Pilih berkas gambar tanda tangan terlebih dahulu.'));
        return;
      }
      if (!/^image\/(png|jpeg|jpg)$/.test(file.type)) {
        reject(new Error('Berkas harus berupa gambar PNG atau JPG.'));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error('Ukuran berkas maksimal 8 MB.'));
        return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        try {
          var dataUrl = encodeOnWhite_(img, 1600);
          var approx = Math.floor(dataUrl.length * 0.75);
          var width = 1600;
          while (approx > MAX_PNG_BYTES && width > 400) {
            width = Math.floor(width / 2);
            dataUrl = encodeOnWhite_(img, width);
            approx = Math.floor(dataUrl.length * 0.75);
          }
          if (approx > MAX_PNG_BYTES) {
            reject(new Error('Gambar terlalu rumit atau besar. Kompres foto atau gunakan tulisan tangan di layar.'));
            return;
          }
          resolve(dataUrl);
        } catch (e) {
          reject(new Error('Gagal memproses gambar. Coba gambar lain.'));
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Berkas gambar tidak dapat dibaca.'));
      };
      img.src = url;
    });
  }

  function encodeOnWhite_(img, maxWidth) {
    var scale = Math.min(1, maxWidth / (img.width || maxWidth));
    var w = Math.max(1, Math.round((img.width || maxWidth) * scale));
    var h = Math.max(1, Math.round((img.height || maxWidth) * scale));
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/png');
  }

  window.DH_PAD = { create: create, resize: resize, exportPng: exportPng, fileToPng: fileToPng };
})();
