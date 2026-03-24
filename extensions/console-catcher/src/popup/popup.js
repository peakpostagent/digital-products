/**
 * Console Catcher — Popup Script
 *
 * Renders the log viewer, handles filtering, search, export,
 * and clear actions. All innerHTML usage goes through escapeHtml()
 * to prevent XSS.
 */

/* ── Globals ────────────────────────────────────────────────── */

/** Current tab ID */
let currentTabId = null;

/** All log entries for the current tab */
let allLogs = [];

/* ── DOM references ─────────────────────────────────────────── */

const logList = document.getElementById('log-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const toggleBtn = document.getElementById('btn-toggle');
const toggleIndicator = document.getElementById('toggle-indicator');
const btnExportClipboard = document.getElementById('btn-export-clipboard');
const btnExportJson = document.getElementById('btn-export-json');
const btnClear = document.getElementById('btn-clear');
const toastEl = document.getElementById('toast');

/* Level filter checkboxes */
const filterCheckboxes = document.querySelectorAll('#level-filters input[type="checkbox"]');

/* Level count badges */
const countEls = {
  error: document.getElementById('count-error'),
  warn: document.getElementById('count-warn'),
  info: document.getElementById('count-info'),
  log: document.getElementById('count-log'),
  debug: document.getElementById('count-debug')
};

/* ── Utilities ──────────────────────────────────────────────── */

/**
 * Escape HTML entities to prevent XSS when using innerHTML.
 * CRITICAL: Every user-supplied string must go through this.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Format a timestamp into a readable time string (HH:MM:SS.mmm).
 */
function formatTime(ts) {
  const d = new Date(ts);
  const pad = function (n, len) {
    return String(n).padStart(len || 2, '0');
  };
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' +
         pad(d.getSeconds()) + '.' + pad(d.getMilliseconds(), 3);
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

/* ── Rendering ──────────────────────────────────────────────── */

/**
 * Get the currently active level filters.
 */
function getActiveFilters() {
  const active = [];
  filterCheckboxes.forEach(function (cb) {
    if (cb.checked) active.push(cb.dataset.level);
  });
  return active;
}

/**
 * Filter logs by active levels and search text, then render.
 */
function renderLogs() {
  const activeFilters = getActiveFilters();
  const searchTerm = searchInput.value.toLowerCase().trim();

  /* Filter entries */
  const filtered = allLogs.filter(function (entry) {
    if (activeFilters.indexOf(entry.level) === -1) return false;
    if (searchTerm && entry.message.toLowerCase().indexOf(searchTerm) === -1) {
      return false;
    }
    return true;
  });

  /* Update counts */
  const counts = { error: 0, warn: 0, info: 0, log: 0, debug: 0 };
  allLogs.forEach(function (entry) {
    if (counts[entry.level] !== undefined) counts[entry.level]++;
  });
  Object.keys(counts).forEach(function (level) {
    countEls[level].textContent = counts[level];
  });

  /* Show/hide empty state */
  if (filtered.length === 0) {
    logList.classList.add('hidden');
    emptyState.classList.remove('hidden');
  } else {
    logList.classList.remove('hidden');
    emptyState.classList.add('hidden');
  }

  /* Build log entries HTML (all values escaped!) */
  let html = '';
  filtered.forEach(function (entry, index) {
    const levelClass = 'level-' + escapeHtml(entry.level);
    const timeStr = formatTime(entry.timestamp);
    const hasStack = entry.level === 'error' && entry.stack;

    html += '<div class="log-entry ' + levelClass + '">';
    html += '  <div class="log-meta">';
    html += '    <span class="log-level">' + escapeHtml(entry.level) + '</span>';
    html += '    <span class="log-time">' + escapeHtml(timeStr) + '</span>';
    html += '  </div>';
    html += '  <div class="log-message">' + escapeHtml(entry.message) + '</div>';

    if (hasStack) {
      html += '  <span class="stack-toggle" data-index="' + index + '">&#9654; Stack trace</span>';
      html += '  <div class="stack-content" id="stack-' + index + '">' +
              escapeHtml(entry.stack) + '</div>';
    }

    html += '</div>';
  });

  logList.innerHTML = html;

  /* Attach stack trace toggle handlers */
  logList.querySelectorAll('.stack-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      const idx = toggle.dataset.index;
      const stackEl = document.getElementById('stack-' + idx);
      if (stackEl) {
        stackEl.classList.toggle('expanded');
        toggle.innerHTML = stackEl.classList.contains('expanded')
          ? '&#9660; Stack trace'
          : '&#9654; Stack trace';
      }
    });
  });
}

/* ── Data loading ───────────────────────────────────────────── */

/**
 * Load logs from the background service worker for the current tab.
 */
function loadLogs() {
  if (!currentTabId) return;
  chrome.runtime.sendMessage(
    { type: 'get_logs', tabId: currentTabId },
    function (response) {
      if (response && response.logs) {
        allLogs = response.logs;
        renderLogs();
      }
    }
  );
}

/**
 * Load the capture-enabled state for the current tab.
 */
function loadCaptureState() {
  if (!currentTabId) return;
  chrome.runtime.sendMessage(
    { type: 'get_capture_state', tabId: currentTabId },
    function (response) {
      if (response) {
        updateToggleUI(response.enabled);
      }
    }
  );
}

/**
 * Update the toggle button's visual state.
 */
function updateToggleUI(enabled) {
  if (enabled) {
    toggleIndicator.classList.add('on');
    toggleIndicator.classList.remove('off');
    toggleBtn.title = 'Capture ON — click to pause';
  } else {
    toggleIndicator.classList.remove('on');
    toggleIndicator.classList.add('off');
    toggleBtn.title = 'Capture OFF — click to resume';
  }
}

/* ── Event handlers ─────────────────────────────────────────── */

/* Toggle capture on/off */
toggleBtn.addEventListener('click', function () {
  const isCurrentlyOn = toggleIndicator.classList.contains('on');
  chrome.runtime.sendMessage(
    { type: 'toggle_capture', tabId: currentTabId, enabled: !isCurrentlyOn },
    function (response) {
      if (response) {
        updateToggleUI(response.enabled);
        showToast(response.enabled ? 'Capture ON' : 'Capture OFF');
      }
    }
  );
});

/* Clear logs */
btnClear.addEventListener('click', function () {
  chrome.runtime.sendMessage(
    { type: 'clear_logs', tabId: currentTabId },
    function () {
      allLogs = [];
      renderLogs();
      showToast('Logs cleared');
    }
  );
});

/* Export to clipboard */
btnExportClipboard.addEventListener('click', function () {
  if (allLogs.length === 0) {
    showToast('No logs to copy');
    return;
  }
  const text = allLogs.map(function (entry) {
    return '[' + entry.level.toUpperCase() + '] ' +
           formatTime(entry.timestamp) + ' ' +
           entry.message +
           (entry.stack ? '\n' + entry.stack : '');
  }).join('\n\n');

  navigator.clipboard.writeText(text).then(function () {
    showToast('Copied to clipboard');
  });
});

/* Export to JSON file */
btnExportJson.addEventListener('click', function () {
  if (allLogs.length === 0) {
    showToast('No logs to export');
    return;
  }
  const json = JSON.stringify(allLogs, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'console-catcher-logs-' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON exported');
});

/* Search input filtering */
searchInput.addEventListener('input', renderLogs);

/* Level filter checkboxes */
filterCheckboxes.forEach(function (cb) {
  cb.addEventListener('change', renderLogs);
});

/* ── Initialise ─────────────────────────────────────────────── */

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs.length > 0) {
    currentTabId = tabs[0].id;
    loadLogs();
    loadCaptureState();
  }
});
