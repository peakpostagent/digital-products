/**
 * Z-Index Inspector — Popup Script
 *
 * Handles user interaction in the popup. Communicates with
 * the background service worker and content script to
 * activate scanning, toggle overlays, and manage sidebar.
 */

/* ── State ──────────────────────────────────────────────────────── */

var overlayEnabled = false;
var sidebarEnabled = false;
var contentScriptInjected = false;

/* ── DOM references ─────────────────────────────────────────────── */

var countBadge = document.getElementById('count-badge');
var btnActivate = document.getElementById('btn-activate');
var btnRescan = document.getElementById('btn-rescan');
var toggleOverlayRow = document.getElementById('toggle-overlay-row');
var toggleOverlayDot = document.getElementById('toggle-overlay-dot');
var toggleSidebarRow = document.getElementById('toggle-sidebar-row');
var toggleSidebarDot = document.getElementById('toggle-sidebar-dot');
var statusMsg = document.getElementById('status-msg');

/* ── Utilities ──────────────────────────────────────────────────── */

/**
 * Get the active tab ID.
 */
function getActiveTabId(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs && tabs[0]) {
      callback(tabs[0].id);
    }
  });
}

/**
 * Send a message to the content script in the active tab.
 */
function sendToContent(msg, callback) {
  getActiveTabId(function (tabId) {
    chrome.tabs.sendMessage(tabId, msg, function (response) {
      if (chrome.runtime.lastError) {
        /* Content script not injected yet */
        if (callback) callback(null, chrome.runtime.lastError.message);
        return;
      }
      if (callback) callback(response);
    });
  });
}

/**
 * Inject the content script via the background service worker.
 */
function injectAndActivate() {
  getActiveTabId(function (tabId) {
    chrome.runtime.sendMessage(
      { type: 'inject_content_script', tabId: tabId },
      function (response) {
        if (chrome.runtime.lastError || !response || !response.ok) {
          setStatus('Could not inject into this page.', 'error');
          return;
        }
        contentScriptInjected = true;

        /* Small delay for the script to initialize */
        setTimeout(function () {
          sendToContent({ type: 'activate' }, function (resp, err) {
            if (err) {
              setStatus('Could not connect to page.', 'error');
              return;
            }
            overlayEnabled = true;
            sidebarEnabled = true;
            updateToggles();
            updateCount(resp ? resp.count : 0);
            setStatus('Scanning complete.', 'success');
          });
        }, 200);
      }
    );
  });
}

/**
 * Update the count badge display.
 */
function updateCount(count) {
  countBadge.textContent = count > 99 ? '99+' : String(count);
}

/**
 * Update toggle dot states.
 */
function updateToggles() {
  toggleOverlayDot.className = 'toggle-dot' + (overlayEnabled ? ' on' : '');
  toggleSidebarDot.className = 'toggle-dot' + (sidebarEnabled ? ' on' : '');
}

/**
 * Show a status message.
 */
function setStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status' + (type ? ' ' + type : '');
  if (type === 'success') {
    setTimeout(function () {
      statusMsg.textContent = '';
      statusMsg.className = 'status';
    }, 2000);
  }
}

/* ── Event Handlers ─────────────────────────────────────────────── */

/** Activate button: inject + scan + show everything */
btnActivate.addEventListener('click', function () {
  setStatus('Scanning...', '');
  injectAndActivate();
});

/** Toggle overlay badges */
toggleOverlayRow.addEventListener('click', function () {
  overlayEnabled = !overlayEnabled;
  updateToggles();
  sendToContent({ type: 'toggle_overlay', enabled: overlayEnabled });

  /* Save preference */
  chrome.storage.local.set({ zii_overlay: overlayEnabled });
});

/** Toggle sidebar */
toggleSidebarRow.addEventListener('click', function () {
  sidebarEnabled = !sidebarEnabled;
  updateToggles();
  sendToContent({ type: 'toggle_sidebar', open: sidebarEnabled });
});

/** Re-scan button */
btnRescan.addEventListener('click', function () {
  setStatus('Re-scanning...', '');
  sendToContent({ type: 'scan_page' }, function (resp, err) {
    if (err) {
      setStatus('Not connected. Click "Scan & Inspect" first.', 'error');
      return;
    }
    updateCount(resp ? resp.count : 0);
    setStatus('Re-scan complete.', 'success');
  });
});

/* ── Init: check if content script is already running ──────────── */

sendToContent({ type: 'get_state' }, function (resp, err) {
  if (!err && resp) {
    contentScriptInjected = true;
    overlayEnabled = resp.overlayVisible;
    sidebarEnabled = resp.sidebarOpen;
    updateToggles();
    updateCount(resp.count);
  }
});
