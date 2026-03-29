/**
 * API Rate Limiter — Popup Script
 *
 * Manages rate-limit rules, displays request counters and logs.
 * All innerHTML usage goes through escapeHtml() to prevent XSS.
 */

/* ── Globals ────────────────────────────────────────────────── */

/** All rules */
var allRules = [];

/** Request counts per rule */
var allCounts = {};

/** Request log entries */
var allLog = [];

/** Refresh interval handle */
var refreshInterval = null;

/* ── DOM references ─────────────────────────────────────────── */

var rulesList = document.getElementById('rules-list');
var emptyRules = document.getElementById('empty-rules');
var logList = document.getElementById('log-list');
var emptyLog = document.getElementById('empty-log');
var logCountEl = document.getElementById('log-count');
var toastEl = document.getElementById('toast');

/* Buttons */
var btnAddRule = document.getElementById('btn-add-rule');
var btnImport = document.getElementById('btn-import');
var btnExport = document.getElementById('btn-export');
var btnReset = document.getElementById('btn-reset');
var btnClearLog = document.getElementById('btn-clear-log');
var importFileInput = document.getElementById('import-file');

/* Tab buttons */
var tabBtns = document.querySelectorAll('.tab-btn');

/* Modal elements */
var ruleModal = document.getElementById('rule-modal');
var modalTitle = document.getElementById('modal-title');
var ruleEditId = document.getElementById('rule-edit-id');
var rulePatternInput = document.getElementById('rule-pattern');
var ruleMaxInput = document.getElementById('rule-max');
var ruleWindowInput = document.getElementById('rule-window');
var ruleStatusSelect = document.getElementById('rule-status');
var ruleRetryInput = document.getElementById('rule-retry');
var ruleBodyInput = document.getElementById('rule-body');
var btnModalCancel = document.getElementById('btn-modal-cancel');
var btnModalSave = document.getElementById('btn-modal-save');

/* ── Utilities ──────────────────────────────────────────────── */

/**
 * Escape HTML entities to prevent XSS when using innerHTML.
 * CRITICAL: Every dynamic string must go through this.
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Format a timestamp into HH:MM:SS.
 */
function formatTime(ts) {
  var d = new Date(ts);
  var pad = function (n) { return String(n).padStart(2, '0'); };
  return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

/**
 * Generate a simple unique ID.
 */
function generateId() {
  return 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
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
 * Truncate a URL for display in the log.
 */
function truncateUrl(url, maxLen) {
  if (!url) return '';
  if (url.length <= (maxLen || 60)) return url;
  return url.substring(0, maxLen || 60) + '...';
}

/* ── Tab switching ──────────────────────────────────────────── */

tabBtns.forEach(function (btn) {
  btn.addEventListener('click', function () {
    tabBtns.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(function (tc) {
      tc.classList.remove('active');
    });
    var tabId = 'tab-' + btn.dataset.tab;
    document.getElementById(tabId).classList.add('active');
  });
});

/* ── Rules rendering ────────────────────────────────────────── */

/**
 * Render the rules list with counters.
 */
function renderRules() {
  if (allRules.length === 0) {
    rulesList.classList.add('hidden');
    emptyRules.classList.remove('hidden');
    return;
  }

  rulesList.classList.remove('hidden');
  emptyRules.classList.add('hidden');

  var html = '';
  allRules.forEach(function (rule) {
    var counts = allCounts[rule.id] || { total: 0, throttled: 0 };
    var pct = rule.maxRequests > 0
      ? Math.min(100, Math.round((counts.total / rule.maxRequests) * 100))
      : 0;
    var fillClass = pct < 60 ? 'rate-fill-ok' : (pct < 90 ? 'rate-fill-warn' : 'rate-fill-danger');
    var checkedAttr = rule.enabled ? 'checked' : '';

    html += '<div class="rule-card" data-rule-id="' + escapeHtml(rule.id) + '">';
    html += '  <div class="rule-header">';
    html += '    <span class="rule-pattern">' + escapeHtml(rule.pattern) + '</span>';
    html += '    <div class="rule-actions">';
    html += '      <button class="rule-edit-btn" data-id="' + escapeHtml(rule.id) + '" title="Edit">&#9998;</button>';
    html += '      <button class="rule-delete-btn" data-id="' + escapeHtml(rule.id) + '" title="Delete">&#10005;</button>';
    html += '      <label class="toggle-switch">';
    html += '        <input type="checkbox" class="rule-toggle" data-id="' + escapeHtml(rule.id) + '" ' + checkedAttr + '>';
    html += '        <span class="toggle-slider"></span>';
    html += '      </label>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="rule-stats">';
    html += '    <span class="rule-stat"><span class="stat-label">Requests:</span> <span class="stat-value">' + escapeHtml(String(counts.total)) + '</span></span>';
    html += '    <span class="rule-stat"><span class="stat-label">Throttled:</span> <span class="stat-value throttled">' + escapeHtml(String(counts.throttled)) + '</span></span>';
    html += '    <span class="rule-stat"><span class="stat-label">Limit:</span> <span class="stat-value">' + escapeHtml(String(rule.maxRequests)) + '/' + escapeHtml(String(rule.windowSeconds)) + 's</span></span>';
    html += '  </div>';
    html += '  <div class="rate-bar"><div class="rate-bar-fill ' + fillClass + '" style="width:' + pct + '%"></div></div>';
    html += '  <div class="rule-config">';
    html += '    <span>Status: ' + escapeHtml(String(rule.statusCode || 429)) + '</span>';
    html += '    <span>Retry-After: ' + escapeHtml(String(rule.retryAfter || 60)) + 's</span>';
    if (rule.customBody) {
      html += '    <span>Custom body</span>';
    }
    html += '  </div>';
    html += '</div>';
  });

  rulesList.innerHTML = html;

  /* Attach event handlers */
  rulesList.querySelectorAll('.rule-toggle').forEach(function (toggle) {
    toggle.addEventListener('change', function () {
      var id = toggle.dataset.id;
      toggleRule(id, toggle.checked);
    });
  });

  rulesList.querySelectorAll('.rule-edit-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openEditModal(btn.dataset.id);
    });
  });

  rulesList.querySelectorAll('.rule-delete-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      deleteRule(btn.dataset.id);
    });
  });
}

/* ── Log rendering ──────────────────────────────────────────── */

/**
 * Render the request log.
 */
function renderLog() {
  logCountEl.textContent = allLog.length + ' entries';

  if (allLog.length === 0) {
    logList.classList.add('hidden');
    emptyLog.classList.remove('hidden');
    return;
  }

  logList.classList.remove('hidden');
  emptyLog.classList.add('hidden');

  /* Show most recent first */
  var sorted = allLog.slice().reverse();

  var html = '';
  sorted.forEach(function (entry) {
    var statusClass = entry.throttled ? 'log-throttled' : 'log-passed';
    var statusLabel = entry.throttled ? 'BLOCKED' : 'PASSED';
    var statusBadge = entry.throttled ? 'status-throttled' : 'status-passed';

    html += '<div class="log-entry ' + statusClass + '">';
    html += '  <span class="log-status ' + statusBadge + '">' + escapeHtml(statusLabel) + '</span>';
    html += '  <span class="log-method">' + escapeHtml(entry.method || 'GET') + '</span>';
    html += '  <span class="log-url" title="' + escapeHtml(entry.url) + '">' + escapeHtml(truncateUrl(entry.url, 50)) + '</span>';
    html += '  <span class="log-time">' + escapeHtml(formatTime(entry.timestamp)) + '</span>';
    html += '</div>';
  });

  logList.innerHTML = html;
}

/* ── Rule CRUD ──────────────────────────────────────────────── */

/**
 * Toggle a rule's enabled state.
 */
function toggleRule(ruleId, enabled) {
  allRules = allRules.map(function (r) {
    if (r.id === ruleId) {
      r.enabled = enabled;
    }
    return r;
  });
  saveAndBroadcast();
}

/**
 * Delete a rule by ID.
 */
function deleteRule(ruleId) {
  allRules = allRules.filter(function (r) {
    return r.id !== ruleId;
  });
  saveAndBroadcast();
  renderRules();
  showToast('Rule deleted');
}

/**
 * Save rules to background and broadcast to content scripts.
 */
function saveAndBroadcast() {
  chrome.runtime.sendMessage({
    type: 'save_rules',
    rules: allRules
  });
}

/* ── Modal logic ────────────────────────────────────────────── */

/**
 * Open the modal for adding a new rule.
 */
function openAddModal() {
  modalTitle.textContent = 'Add Rule';
  ruleEditId.value = '';
  rulePatternInput.value = '';
  ruleMaxInput.value = '10';
  ruleWindowInput.value = '60';
  ruleStatusSelect.value = '429';
  ruleRetryInput.value = '60';
  ruleBodyInput.value = '';
  ruleModal.classList.remove('hidden');
  rulePatternInput.focus();
}

/**
 * Open the modal for editing an existing rule.
 */
function openEditModal(ruleId) {
  var rule = allRules.find(function (r) { return r.id === ruleId; });
  if (!rule) return;

  modalTitle.textContent = 'Edit Rule';
  ruleEditId.value = rule.id;
  rulePatternInput.value = rule.pattern;
  ruleMaxInput.value = String(rule.maxRequests || 10);
  ruleWindowInput.value = String(rule.windowSeconds || 60);
  ruleStatusSelect.value = String(rule.statusCode || 429);
  ruleRetryInput.value = String(rule.retryAfter || 60);
  ruleBodyInput.value = rule.customBody || '';
  ruleModal.classList.remove('hidden');
  rulePatternInput.focus();
}

/**
 * Save the rule from the modal form.
 */
function saveModal() {
  var pattern = rulePatternInput.value.trim();
  if (!pattern) {
    showToast('URL pattern is required');
    return;
  }

  var ruleData = {
    pattern: pattern,
    maxRequests: parseInt(ruleMaxInput.value, 10) || 10,
    windowSeconds: parseInt(ruleWindowInput.value, 10) || 60,
    statusCode: parseInt(ruleStatusSelect.value, 10) || 429,
    retryAfter: parseInt(ruleRetryInput.value, 10) || 60,
    customBody: ruleBodyInput.value.trim()
  };

  var editId = ruleEditId.value;

  if (editId) {
    /* Update existing rule */
    allRules = allRules.map(function (r) {
      if (r.id === editId) {
        return Object.assign({}, r, ruleData);
      }
      return r;
    });
    showToast('Rule updated');
  } else {
    /* Add new rule */
    ruleData.id = generateId();
    ruleData.enabled = true;
    allRules.push(ruleData);
    showToast('Rule added');
  }

  saveAndBroadcast();
  renderRules();
  ruleModal.classList.add('hidden');
}

/* ── Import / Export ────────────────────────────────────────── */

/**
 * Export rules as a JSON file download.
 */
function exportRules() {
  if (allRules.length === 0) {
    showToast('No rules to export');
    return;
  }
  var json = JSON.stringify(allRules, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'api-rate-limiter-rules-' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Rules exported');
}

/**
 * Import rules from a JSON file.
 */
function importRules(file) {
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        showToast('Invalid format: expected an array');
        return;
      }

      /* Validate and assign IDs if missing */
      var valid = imported.map(function (r) {
        return {
          id: r.id || generateId(),
          pattern: r.pattern || '',
          maxRequests: parseInt(r.maxRequests, 10) || 10,
          windowSeconds: parseInt(r.windowSeconds, 10) || 60,
          statusCode: parseInt(r.statusCode, 10) || 429,
          retryAfter: parseInt(r.retryAfter, 10) || 60,
          customBody: r.customBody || '',
          enabled: r.enabled !== false
        };
      }).filter(function (r) {
        return r.pattern.length > 0;
      });

      allRules = valid;
      chrome.runtime.sendMessage({
        type: 'import_rules',
        rules: allRules
      });
      renderRules();
      showToast('Imported ' + valid.length + ' rules');
    } catch (_e) {
      showToast('Failed to parse JSON');
    }
  };
  reader.readAsText(file);
}

/* ── Data loading ───────────────────────────────────────────── */

/**
 * Load rules, counts, and log from the background.
 */
function loadAll() {
  chrome.runtime.sendMessage({ type: 'popup_get_rules' }, function (response) {
    if (response && response.rules) {
      allRules = response.rules;
      renderRules();
    }
  });

  chrome.runtime.sendMessage({ type: 'get_counts' }, function (response) {
    if (response && response.counts) {
      allCounts = response.counts;
      renderRules();
    }
  });

  chrome.runtime.sendMessage({ type: 'get_log' }, function (response) {
    if (response && response.log) {
      allLog = response.log;
      renderLog();
    }
  });
}

/* ── Event handlers ─────────────────────────────────────────── */

btnAddRule.addEventListener('click', openAddModal);

btnExport.addEventListener('click', exportRules);

btnImport.addEventListener('click', function () {
  importFileInput.click();
});

importFileInput.addEventListener('change', function () {
  if (importFileInput.files.length > 0) {
    importRules(importFileInput.files[0]);
    importFileInput.value = '';
  }
});

btnReset.addEventListener('click', function () {
  chrome.runtime.sendMessage({ type: 'reset_counts' }, function () {
    allCounts = {};
    renderRules();
    showToast('Counters reset');
  });
});

btnClearLog.addEventListener('click', function () {
  chrome.runtime.sendMessage({ type: 'clear_log' }, function () {
    allLog = [];
    renderLog();
    showToast('Log cleared');
  });
});

btnModalCancel.addEventListener('click', function () {
  ruleModal.classList.add('hidden');
});

btnModalSave.addEventListener('click', saveModal);

/* Close modal on background click */
ruleModal.addEventListener('click', function (e) {
  if (e.target === ruleModal) {
    ruleModal.classList.add('hidden');
  }
});

/* Save modal on Enter in pattern field */
rulePatternInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    saveModal();
  }
});

/* ── Initialise ─────────────────────────────────────────────── */

loadAll();

/* Refresh data every 2 seconds while popup is open */
refreshInterval = setInterval(function () {
  chrome.runtime.sendMessage({ type: 'get_counts' }, function (response) {
    if (response && response.counts) {
      allCounts = response.counts;
      renderRules();
    }
  });
  chrome.runtime.sendMessage({ type: 'get_log' }, function (response) {
    if (response && response.log) {
      allLog = response.log;
      renderLog();
    }
  });
}, 2000);
