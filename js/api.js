// api.js — thin client for the Apps Script backend.
// POSTs use Content-Type text/plain so the browser sends a CORS "simple request"
// without a preflight; Apps Script reads the JSON from e.postData.contents.
(function () {
  'use strict';

  function webAppUrl() {
    var url = (window.DH_CONFIG && window.DH_CONFIG.WEB_APP_URL) || '';
    if (!url || url.indexOf('PASTE_DEPLOYMENT_ID') !== -1) {
      throw new Error('WEB_APP_URL belum diisi di config.js.');
    }
    return url;
  }

  window.DH = {
    config: window.DH_CONFIG || {},

    get: async function (params) {
      var u = new URL(webAppUrl());
      Object.keys(params || {}).forEach(function (k) {
        u.searchParams.set(k, params[k]);
      });
      var res = await fetch(u.toString(), { method: 'GET', redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    },

    post: async function (payload) {
      var res = await fetch(webAppUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    },

    uuid: function () {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
  };
})();
