/**
 * LocalStorage Manager — Popup script
 *
 * Reads localStorage / sessionStorage from the active tab via
 * chrome.scripting.executeScript, then renders a searchable,
 * sortable, editable table.
 */

/* ---- State ---- */
let currentTab   = 'local';   // 'local' or 'session'
let sortField    = 'key';     // 'key', 'value', or 'size'
let sortAsc      = true;
let entries      = [];        // { key, value, size }
let activeTabId  = null;
let refreshTimer = null;

/* ---- DOM refs ---- */
const storageBody   = document.getElementById('storageBody');
const emptyState    = document.getElementById('emptyState');
const searchInput   = document.getElementById('searchInput');
const sizeInfo      = document.getElementById('sizeInfo');
const addForm       = document.getElementById('addForm');
const newKeyInput   = document.getElementById('newKey');
const newValueInput = document.getElementById('newValue');
const toastContainer = document.getElementById('toastContainer');
const confirmDialog  = document.getElementById('confirmDialog');
const confirmMsg     = document.getElementById('confirmMsg');

/* ====================================================
   Utility helpers
   ==================================================== */

/**
 * Escape HTML entities to prevent XSS when rendering
 * storage keys/values into the DOM.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Return a human-readable byte size string.
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Calculate byte length of a UTF-16 string (JS strings).
 * Each char is 2 bytes in storage.
 */
function byteLength(str) {
  return str.length * 2;
}

/* ====================================================
   Toast notifications
   ==================================================== */

/**
 * Show a brief toast message.
 * @param {string} message — text to display
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type) {
  type = type || 'success';
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  /* Remove after animation completes */
  setTimeout(function() { toast.remove(); }, 2500);
}

/* ====================================================
   Confirm dialog
   ==================================================== */

/**
 * Show a confirmation dialog and return a Promise<boolean>.
 */
function showConfirm(message) {
  return new Promise(function(resolve) {
    confirmMsg.textContent = message;
    confirmDialog.classList.remove('hidden');

    function cleanup() {
      confirmDialog.classList.add('hidden');
      document.getElementById('confirmYes').removeEventListener('click', onYes);
      document.getElementById('confirmNo').removeEventListener('click', onNo);
    }
    function onYes() { cleanup(); resolve(true); }
    function onNo()  { cleanup(); resolve(false); }

    document.getElementById('confirmYes').addEventListener('click', onYes);
    document.getElementById('confirmNo').addEventListener('click', onNo);
  });
}

/* ====================================================
   Communication with the page
   ==================================================== */

/**
 * Execute a function in the context of the active tab's page.
 * Uses chrome.scripting.executeScript so we can access window.localStorage.
 */
function execInPage(fn, args) {
  return chrome.scripting.executeScript({
    target: { tabId: activeTabId },
    func: fn,
    args: args || []
  }).then(function(results) {
    return results && results[0] ? results[0].result : null;
  });
}

/**
 * Read all entries from the selected storage type on the page.
 * Returns an array of { key, value }.
 */
function readStorage() {
  var storageType = currentTab;
  return execInPage(function(type) {
    var store = type === 'local' ? window.localStorage : window.sessionStorage;
    var items = [];
    for (var i = 0; i < store.length; i++) {
      var k = store.key(i);
      items.push({ key: k, value: store.getItem(k) });
    }
    return items;
  }, [storageType]);
}

/**
 * Set a single key in the page's storage.
 */
function setStorageItem(key, value) {
  var storageType = currentTab;
  return execInPage(function(type, k, v) {
    var store = type === 'local' ? window.localStorage : window.sessionStorage;
    store.setItem(k, v);
  }, [storageType, key, value]);
}

/**
 * Remove a single key from the page's storage.
 */
function removeStorageItem(key) {
  var storageType = currentTab;
  return execInPage(function(type, k) {
    var store = type === 'local' ? window.localStorage : window.sessionStorage;
    store.removeItem(k);
  }, [storageType, key]);
}

/**
 * Clear all entries from the page's storage.
 */
function clearStorage() {
  var storageType = currentTab;
  return execInPage(function(type) {
    var store = type === 'local' ? window.localStorage : window.sessionStorage;
    store.clear();
  }, [storageType]);
}

/* ====================================================
   Rendering
   ==================================================== */

/**
 * Fetch data from the page, sort/filter, and render the table.
 */
function refresh() {
  readStorage().then(function(items) {
    if (!items) items = [];
    /* Add computed size */
    entries = items.map(function(e) {
      return {
        key: e.key,
        value: e.value,
        size: byteLength(e.key) + byteLength(e.value)
      };
    });
    render();
  }).catch(function(err) {
    console.error('Failed to read storage:', err);
    entries = [];
    render();
  });
}

/**
 * Render entries to the table, applying current filter and sort.
 */
function render() {
  var filter = searchInput.value.toLowerCase();

  /* Filter */
  var visible = entries.filter(function(e) {
    if (!filter) return true;
    return e.key.toLowerCase().indexOf(filter) !== -1 ||
           e.value.toLowerCase().indexOf(filter) !== -1;
  });

  /* Sort */
  visible.sort(function(a, b) {
    var va, vb;
    if (sortField === 'size') {
      va = a.size; vb = b.size;
    } else if (sortField === 'value') {
      va = a.value.toLowerCase(); vb = b.value.toLowerCase();
    } else {
      va = a.key.toLowerCase(); vb = b.key.toLowerCase();
    }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  /* Total size */
  var total = entries.reduce(function(sum, e) { return sum + e.size; }, 0);
  sizeInfo.textContent = entries.length + ' entries \u00B7 ' + formatSize(total);

  /* Build table rows */
  storageBody.innerHTML = '';

  if (visible.length === 0) {
    emptyState.classList.remove('hidden');
    document.getElementById('storageTable').classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  document.getElementById('storageTable').classList.remove('hidden');

  visible.forEach(function(entry) {
    var tr = document.createElement('tr');

    /* Key cell */
    var tdKey = document.createElement('td');
    tdKey.className = 'cell-key';
    tdKey.innerHTML = escapeHtml(entry.key);
    tr.appendChild(tdKey);

    /* Value cell (clickable to edit) */
    var tdVal = document.createElement('td');
    tdVal.className = 'cell-value';
    tdVal.title = 'Click to edit';
    /* Truncate display to 120 chars */
    var displayVal = entry.value.length > 120
      ? entry.value.substring(0, 120) + '\u2026'
      : entry.value;
    tdVal.innerHTML = escapeHtml(displayVal);
    tdVal.addEventListener('click', function() {
      startInlineEdit(tdVal, entry.key, entry.value);
    });
    tr.appendChild(tdVal);

    /* Size cell */
    var tdSize = document.createElement('td');
    tdSize.className = 'cell-size';
    tdSize.textContent = formatSize(entry.size);
    tr.appendChild(tdSize);

    /* Actions cell */
    var tdActions = document.createElement('td');
    tdActions.className = 'cell-actions';

    /* Copy button */
    var copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn';
    copyBtn.title = 'Copy value';
    copyBtn.innerHTML = '&#128203;';
    copyBtn.addEventListener('click', function() {
      navigator.clipboard.writeText(entry.value).then(function() {
        showToast('Copied to clipboard', 'success');
      });
    });
    tdActions.appendChild(copyBtn);

    /* Delete button */
    var delBtn = document.createElement('button');
    delBtn.className = 'action-btn delete';
    delBtn.title = 'Delete';
    delBtn.innerHTML = '&#128465;';
    delBtn.addEventListener('click', function() {
      showConfirm('Delete key "' + entry.key + '"?').then(function(yes) {
        if (!yes) return;
        removeStorageItem(entry.key).then(function() {
          showToast('Deleted', 'info');
          refresh();
        });
      });
    });
    tdActions.appendChild(delBtn);

    tr.appendChild(tdActions);
    storageBody.appendChild(tr);
  });
}

/* ====================================================
   Inline editing
   ==================================================== */

/**
 * Replace a value cell's content with a text input for inline editing.
 */
function startInlineEdit(cell, key, currentValue) {
  /* Prevent double-editing */
  if (cell.querySelector('.inline-edit')) return;

  var input = document.createElement('textarea');
  input.className = 'inline-edit';
  input.value = currentValue;
  input.rows = Math.min(4, Math.ceil(currentValue.length / 40) || 1);
  input.style.resize = 'vertical';

  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();
  input.select();

  /** Save on blur or Enter (Shift+Enter for newline) */
  function save() {
    var newVal = input.value;
    if (newVal !== currentValue) {
      setStorageItem(key, newVal).then(function() {
        showToast('Saved', 'success');
        refresh();
      });
    } else {
      refresh();
    }
  }

  input.addEventListener('blur', save);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      input.blur();
    }
    if (e.key === 'Escape') {
      input.removeEventListener('blur', save);
      refresh();
    }
  });
}

/* ====================================================
   Export / Import
   ==================================================== */

/**
 * Export current storage type as a JSON download.
 */
function exportEntries() {
  var data = {};
  entries.forEach(function(e) { data[e.key] = e.value; });
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = currentTab + 'Storage-export.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported ' + entries.length + ' entries', 'success');
}

/**
 * Import entries from a JSON file.
 */
function importEntries(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        showToast('Invalid JSON: expected an object', 'error');
        return;
      }
      var keys = Object.keys(data);
      var promises = keys.map(function(k) {
        return setStorageItem(k, String(data[k]));
      });
      Promise.all(promises).then(function() {
        showToast('Imported ' + keys.length + ' entries', 'success');
        refresh();
      });
    } catch (err) {
      showToast('Failed to parse JSON', 'error');
    }
  };
  reader.readAsText(file);
}

/* ====================================================
   Event listeners
   ==================================================== */

/* Tab switching */
document.querySelectorAll('.tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    refresh();
  });
});

/* Sort buttons */
document.querySelectorAll('.sort-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var field = btn.dataset.sort;
    if (sortField === field) {
      sortAsc = !sortAsc;
    } else {
      sortField = field;
      sortAsc = true;
    }
    document.querySelectorAll('.sort-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    render();
  });
});

/* Search */
searchInput.addEventListener('input', function() { render(); });

/* Refresh */
document.getElementById('btnRefresh').addEventListener('click', refresh);

/* Add entry toggle */
document.getElementById('btnAdd').addEventListener('click', function() {
  addForm.classList.toggle('hidden');
  if (!addForm.classList.contains('hidden')) {
    newKeyInput.value = '';
    newValueInput.value = '';
    newKeyInput.focus();
  }
});
document.getElementById('btnCancelNew').addEventListener('click', function() {
  addForm.classList.add('hidden');
});
document.getElementById('btnSaveNew').addEventListener('click', function() {
  var key = newKeyInput.value.trim();
  var value = newValueInput.value;
  if (!key) {
    showToast('Key cannot be empty', 'error');
    return;
  }
  setStorageItem(key, value).then(function() {
    addForm.classList.add('hidden');
    showToast('Added "' + key + '"', 'success');
    refresh();
  });
});

/* Export */
document.getElementById('btnExport').addEventListener('click', exportEntries);

/* Import */
document.getElementById('importFile').addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    importEntries(e.target.files[0]);
    e.target.value = '';
  }
});

/* Clear all */
document.getElementById('btnClearAll').addEventListener('click', function() {
  if (entries.length === 0) {
    showToast('Nothing to clear', 'info');
    return;
  }
  showConfirm('Delete all ' + entries.length + ' entries from ' + currentTab + 'Storage?').then(function(yes) {
    if (!yes) return;
    clearStorage().then(function() {
      showToast('Cleared all entries', 'info');
      refresh();
    });
  });
});

/* ====================================================
   Auto-refresh: poll for changes every 3 seconds
   ==================================================== */

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(refresh, 3000);
}

/* ====================================================
   Initialisation
   ==================================================== */

/* Get the active tab and do first load */
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  if (tabs && tabs.length > 0) {
    activeTabId = tabs[0].id;
    refresh();
    startAutoRefresh();
  }
});
