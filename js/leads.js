(function () {
  'use strict';

  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbwrUo4cq5kINMHwdCaqSQsu7s5DRGj_5GKiOrZzuUBz3WdNC_jyay5AG5v2ykmHW67b/exec';

  function sendToGoogleSheet(data) {
    const payload = JSON.stringify(data);
    const formData = new FormData();
    formData.append('data', payload);

    if (typeof navigator.sendBeacon === 'function') {
      const beaconData = new FormData();
      beaconData.append('data', payload);
      if (navigator.sendBeacon(SCRIPT_URL, beaconData)) {
        return Promise.resolve({ ok: true, method: 'beacon' });
      }
    }

    return fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData,
    }).then(
      () => ({ ok: true, method: 'fetch' }),
      (error) => {
        console.error('Error sending lead to Google Sheets:', error);
        return Promise.reject(error);
      }
    );
  }

  window.AyatiLeads = {
    sendToGoogleSheet: sendToGoogleSheet,
  };
})();
