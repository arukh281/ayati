(function () {
  'use strict';

  const SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbwrUo4cq5kINMHwdCaqSQsu7s5DRGj_5GKiOrZzuUBz3WdNC_jyay5AG5v2ykmHW67b/exec';

  const QUEUE_KEY = 'ayati_lead_queue';
  const MAX_RETRIES = 5;

  // ── Retry queue ─────────────────────────────────────────────────────
  // Every submission is written to localStorage BEFORE the network call.
  // Queued items are retried on next page load and when the browser comes
  // back online. clientId is included in every payload so the Sheet side
  // can deduplicate retry duplicates via that field.

  function readQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function writeQueue(queue) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch { /* storage full or private-browsing restriction */ }
  }

  function enqueue(payload) {
    const queue = readQueue();
    queue.push({ ...payload, attempts: 0 });
    writeQueue(queue);
  }

  function removeFromQueue(clientId) {
    writeQueue(readQueue().filter((item) => item.clientId !== clientId));
  }

  function bumpAttempts(clientId) {
    writeQueue(
      readQueue().map((item) =>
        item.clientId === clientId
          ? { ...item, attempts: (item.attempts || 0) + 1 }
          : item
      )
    );
  }

  function sendPayload(payload) {
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));
    return fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: formData,
    });
  }

  async function flushQueue() {
    const snapshot = readQueue();
    for (const item of snapshot) {
      if ((item.attempts || 0) >= MAX_RETRIES) {
        removeFromQueue(item.clientId);
        continue;
      }
      try {
        await sendPayload(item);
        removeFromQueue(item.clientId);
      } catch {
        bumpAttempts(item.clientId);
      }
    }
  }

  // Flush queued leads on page load and when reconnecting
  flushQueue();
  window.addEventListener('online', flushQueue);

  // ── sendToGoogleSheet ────────────────────────────────────────────────
  function sendToGoogleSheet(data) {
    const clientId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const payload = { ...data, clientId, ts: Date.now() };

    // Write to queue before the network attempt; item stays until confirmed
    enqueue(payload);

    return sendPayload(payload).then(
      () => {
        removeFromQueue(clientId);
        return { ok: true };
      },
      (error) => {
        // Network failure — item stays in queue for next-load retry
        console.warn('Lead send failed; queued for retry:', error);
        return Promise.reject(error);
      }
    );
  }

  window.AyatiLeads = { sendToGoogleSheet };
})();
