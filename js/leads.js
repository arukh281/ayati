(function () {
  'use strict';

  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbwrUo4cq5kINMHwdCaqSQsu7s5DRGj_5GKiOrZzuUBz3WdNC_jyay5AG5v2ykmHW67b/exec';

  function sendToGoogleSheet(data) {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));

    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData,
    }).catch(function (error) {
      console.error('Error sending lead to Google Sheets:', error);
    });
  }

  window.AyatiLeads = {
    sendToGoogleSheet: sendToGoogleSheet,
  };
})();
