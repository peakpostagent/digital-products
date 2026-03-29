/**
 * Shadow DOM Debugger — Popup Script
 *
 * Controls for scanning, highlighting, toggling visibility,
 * opening the sidebar, and copying shadow HTML.
 * All innerHTML usage goes through escapeHtml() to prevent XSS.
 */

/* ── Globals ────────────────────────────────────────────────── */

/** Current tab ID */
var currentTabId = null;

/** Whether highlighting is enabled */
var highlightOn = false;

/** Whether shadow content is dimmed */
var visibilityHidden = false;

/* ── DOM references ─────────────────────────────────────────── */

var countBadge = document.getElementById('count-badge');
var btnScan = document.getElementById('btn-scan');
var btnHighlight = document.getElementById('btn-highlight');
var highlightIndicator = document.getElementById('highlight-indicator');
var btnVisibility = document.getElementById('btn-visibility');
var visibilityIndicator = document.getElementById('visibility-indicator');
var btnSidebar = document.getElementById('btn-sidebar');
var btnCopy = document.getElementById('btn-copy');
var hostList = document.getElementById('host-list');
var emptyState = document.getElementById('empty-state');
var toastEl = document.getElementById('toast');

/* ── Utilities ──────────────────────────────────────────────── */

/**
 * Escape HTML entities to prevent XSS when using innerHTML.
 * CRITICAL: Every user-supplied string must go through this.
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Show a brief toast notification.
 */
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  toastEl.classList.add('show');
  setTimeout(function () {
    toastEl.classList.remove('show');
    setTimeout(function () {
      toastEl.classList.add('hidden');
    }, 200);
  }, 1500);
}

/**
 * Send a message to the content script on the active tab.
 */
function sendToContent(msg, callback) {
  if (!currentTabId) return;
  chrome.tabs.sendMessage(currentTabId, msg, function (response) {
    if (chrome.runtime.lastError) {
      /* Content script not yet injected or tab not accessible */
      return;
    }
    if (callback) callback(response);
  });
}

/* ── Actions ────────────────────────────────────────────────── */

/**
 * Scan the page and update the UI with results.
 */
function doScan() {
  sendToContent({ type: 'scan_page' }, function (response) {
    if (response) {
      updateCount(response.count);
    }
  });
}

/**
 * Update the count badge and list display.
 */
function updateCount(count) {
  countBadge.textContent = count;

  if (count > 0) {
    emptyState.classList.add('hidden');
    hostList.classList.remove('hidden');
    hostList.innerHTML = '<div class="host-summary">' +
      escapeHtml(String(count)) + ' shadow root' +
      (count === 1 ? '' : 's') + ' found on this page.' +
      '</div>';
  } else {
    emptyState.classList.remove('hidden');
    hostList.classList.add('hidden');
    hostList.innerHTML = '';
  }
}

/* ── Event Handlers ─────────────────────────────────────────── */

/* Scan page */
btnScan.addEventListener('click', function () {
  doScan();
  showToast('Scanning...');
});

/* Toggle highlighting */
btnHighlight.addEventListener('click', function () {
  highlightOn = !highlightOn;
  updateHighlightUI(highlightOn);

  /* Save preference */
  chrome.storage.local.set({ sdd_highlight: highlightOn });

  sendToContent({
    type: 'toggle_highlight',
    enabled: highlightOn
  }, function (response) {
    if (response) {
      updateCount(response.count);
    }
  });
});

/* Toggle shadow visibility (dim) */
btnVisibility.addEventListener('click', function () {
  visibilityHidden = !visibilityHidden;
  updateVisibilityUI(visibilityHidden);

  sendToContent({
    type: 'toggle_shadow_visibility',
    hidden: visibilityHidden
  });
});

/* Open sidebar */
btnSidebar.addEventListener('click', function () {
  sendToContent({ type: 'toggle_sidebar', open: true });
  showToast('Sidebar opened');
});

/* Copy all shadow HTML */
btnCopy.addEventListener('click', function () {
  sendToContent({ type: 'copy_all_html' }, function (response) {
    if (response && response.ok) {
      showToast('Copied to clipboard');
    } else {
      showToast('No shadow roots to copy');
    }
  });
});

/* ── UI State Updates ───────────────────────────────────────── */

/**
 * Update the highlight toggle button appearance.
 */
function updateHighlightUI(enabled) {
  if (enabled) {
    highlightIndicator.classList.add('on');
    highlightIndicator.classList.remove('off');
  } else {
    highlightIndicator.classList.remove('on');
    highlightIndicator.classList.add('off');
  }
}

/**
 * Update the visibility toggle button appearance.
 */
function updateVisibilityUI(hidden) {
  if (hidden) {
    visibilityIndicator.classList.add('on');
    visibilityIndicator.classList.remove('off');
  } else {
    visibilityIndicator.classList.remove('on');
    visibilityIndicator.classList.add('off');
  }
}

/* ── Initialise ─────────────────────────────────────────────── */

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs.length > 0) {
    currentTabId = tabs[0].id;

    /* Load saved highlight state */
    chrome.storage.local.get('sdd_highlight', function (data) {
      if (data.sdd_highlight) {
        highlightOn = true;
        updateHighlightUI(true);
      }
    });

    /* Get current state from content script */
    sendToContent({ type: 'get_state' }, function (response) {
      if (response) {
        updateCount(response.count);
        highlightOn = response.highlightEnabled;
        updateHighlightUI(highlightOn);
      }
    });
  }
});
