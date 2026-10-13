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

  window.DH_PAD = { create: create, resize: resize, exportPng: exportPng };
})();
