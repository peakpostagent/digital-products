/**
 * Service Worker Inspector — Popup Script
 *
 * Inspects service worker registrations and cache storage for the
 * current tab via chrome.scripting.executeScript. All dynamic content
 * is escaped with escapeHtml() to prevent XSS.
 */

/* ── Globals ────────────────────────────────────────────────── */

/** Current tab ID */
var currentTabId = null;

/** Current tab URL (for origin check) */
var currentTabUrl = '';

/** Whether offline simulation is active */
var isOffline = false;

/* ── DOM references ─────────────────────────────────────────── */

var swList = document.getElementById('sw-list');
var swEmpty = document.getElementById('sw-empty');
var cacheList = document.getElementById('cache-list');
var cacheEmpty = document.getElementById('cache-empty');
var panelWorkers = document.getElementById('panel-workers');
var panelCaches = document.getElementById('panel-caches');
var btnRefresh = document.getElementById('btn-refresh');
var btnOffline = document.getElementById('btn-offline');
var offlineIndicator = document.getElementById('offline-indicator');
var toastEl = document.getElementById('toast');
var tabButtons = document.querySelectorAll('.tab');

/* ── Utilities ──────────────────────────────────────────────── */

/**
 * Escape HTML entities to prevent XSS when using innerHTML.
 * CRITICAL: Every dynamic string must go through this.
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

/**
 * Format byte sizes into human-readable strings.
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
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
 * Execute a script in the current tab's page context and return the result.
 */
function executeInTab(func) {
  return chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: func
  }).then(function (results) {
    if (results && results[0]) {
      return results[0].result;
    }
    return null;
  });
}

/* ── Tab switching ──────────────────────────────────────────── */

tabButtons.forEach(function (btn) {
  btn.addEventListener('click', function () {
    /* Update active tab button */
    tabButtons.forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');

    /* Show the matching panel */
    var target = btn.dataset.tab;
    if (target === 'workers') {
      panelWorkers.classList.remove('hidden');
      panelCaches.classList.add('hidden');
    } else {
      panelWorkers.classList.add('hidden');
      panelCaches.classList.remove('hidden');
    }
  });
});

/* ── Service Worker Inspection ──────────────────────────────── */

/**
 * Query service worker registrations from the page context.
 * Returns an array of { scriptURL, scope, state } objects.
 */
function getServiceWorkers() {
  return executeInTab(function () {
    if (!navigator.serviceWorker) return [];
    return navigator.serviceWorker.getRegistrations().then(function (regs) {
      return regs.map(function (reg) {
        /* Determine which SW instance is most relevant */
        var sw = reg.active || reg.waiting || reg.installing;
        return {
          scriptURL: sw ? sw.scriptURL : '(unknown)',
          scope: reg.scope,
          state: sw ? sw.state : 'redundant'
        };
      });
    });
  });
}

/**
 * Render service worker cards into the popup.
 */
function renderWorkers(workers) {
  if (!workers || workers.length === 0) {
    swList.classList.add('hidden');
    swEmpty.classList.remove('hidden');
    return;
  }

  swList.classList.remove('hidden');
  swEmpty.classList.add('hidden');

  var html = '';
  workers.forEach(function (sw, idx) {
    var stateClass = 'state-' + escapeHtml(sw.state);
    html += '<div class="sw-card" data-index="' + idx + '">';
    html += '  <div class="sw-header">';
    html += '    <span class="sw-state ' + stateClass + '">' + escapeHtml(sw.state) + '</span>';
    html += '    <div class="sw-actions">';
    html += '      <button class="sw-btn btn-update" data-scope="' + escapeHtml(sw.scope) + '" title="Force update">Update</button>';
    html += '      <button class="sw-btn btn-danger btn-unregister" data-scope="' + escapeHtml(sw.scope) + '" title="Unregister">Unregister</button>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="sw-detail"><span class="label">Script:</span>' + escapeHtml(sw.scriptURL) + '</div>';
    html += '  <div class="sw-detail"><span class="label">Scope:</span>' + escapeHtml(sw.scope) + '</div>';
    html += '</div>';
  });

  swList.innerHTML = html;

  /* Attach update button handlers */
  swList.querySelectorAll('.btn-update').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var scope = btn.dataset.scope;
      forceUpdateWorker(scope);
    });
  });

  /* Attach unregister button handlers */
  swList.querySelectorAll('.btn-unregister').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var scope = btn.dataset.scope;
      unregisterWorker(scope);
    });
  });
}

/**
 * Force update a service worker by its scope.
 */
function forceUpdateWorker(scope) {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: function (targetScope) {
      return navigator.serviceWorker.getRegistrations().then(function (regs) {
        var reg = regs.find(function (r) { return r.scope === targetScope; });
        if (reg) return reg.update().then(function () { return true; });
        return false;
      });
    },
    args: [scope]
  }).then(function () {
    showToast('Update triggered');
    /* Refresh data after a short delay */
    setTimeout(loadAll, 500);
  });
}

/**
 * Unregister a service worker by its scope.
 */
function unregisterWorker(scope) {
  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: function (targetScope) {
      return navigator.serviceWorker.getRegistrations().then(function (regs) {
        var reg = regs.find(function (r) { return r.scope === targetScope; });
        if (reg) return reg.unregister();
        return false;
      });
    },
    args: [scope]
  }).then(function () {
    showToast('Worker unregistered');
    setTimeout(loadAll, 500);
  });
}

/* ── Cache Storage Inspection ───────────────────────────────── */

/**
 * Query cache storage from the page context.
 * Returns an array of { name, entries: [{ url, size }] }.
 */
function getCacheData() {
  return executeInTab(function () {
    if (!window.caches) return [];
    return caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) {
        return caches.open(name).then(function (cache) {
          return cache.keys().then(function (requests) {
            return Promise.all(requests.map(function (req) {
              return cache.match(req).then(function (resp) {
                /* Try to get the Content-Length header for size */
                var size = 0;
                if (resp) {
                  var cl = resp.headers.get('content-length');
                  if (cl) size = parseInt(cl, 10);
                }
                return { url: req.url, size: size };
              });
            }));
          }).then(function (entries) {
            return { name: name, entries: entries };
          });
        });
      }));
    });
  });
}

/**
 * Render cache storage data into the popup.
 */
function renderCaches(cacheData) {
  if (!cacheData || cacheData.length === 0) {
    cacheList.classList.add('hidden');
    cacheEmpty.classList.remove('hidden');
    return;
  }

  cacheList.classList.remove('hidden');
  cacheEmpty.classList.add('hidden');

  var html = '';
  cacheData.forEach(function (cache, idx) {
    var totalSize = cache.entries.reduce(function (sum, e) { return sum + e.size; }, 0);
    html += '<div class="cache-group">';
    html += '  <div class="cache-name" data-cache-idx="' + idx + '">';
    html += '    <span class="cache-toggle" id="cache-arrow-' + idx + '">&#9654;</span>';
    html += '    <span class="cache-name-text">' + escapeHtml(cache.name) + '</span>';
    html += '    <span class="cache-count">' + escapeHtml(cache.entries.length) + ' items';
    if (totalSize > 0) {
      html += ' &middot; ' + escapeHtml(formatBytes(totalSize));
    }
    html += '</span>';
    html += '  </div>';
    html += '  <div class="cache-items" id="cache-items-' + idx + '">';

    cache.entries.forEach(function (entry) {
      /* Show just the path portion if same origin */
      var displayUrl = entry.url;
      try {
        var u = new URL(entry.url);
        displayUrl = u.pathname + u.search;
      } catch (e) { /* keep full URL */ }

      html += '    <div class="cache-item">';
      html += '      <span class="cache-url" title="' + escapeHtml(entry.url) + '">' + escapeHtml(displayUrl) + '</span>';
      html += '      <span class="cache-size">' + escapeHtml(formatBytes(entry.size)) + '</span>';
      html += '    </div>';
    });

    html += '  </div>';
    html += '</div>';
  });

  cacheList.innerHTML = html;

  /* Attach expand/collapse handlers */
  cacheList.querySelectorAll('.cache-name').forEach(function (el) {
    el.addEventListener('click', function () {
      var idx = el.dataset.cacheIdx;
      var items = document.getElementById('cache-items-' + idx);
      var arrow = document.getElementById('cache-arrow-' + idx);
      if (items) {
        items.classList.toggle('expanded');
        arrow.innerHTML = items.classList.contains('expanded') ? '&#9660;' : '&#9654;';
      }
    });
  });
}

/* ── Offline Simulation ─────────────────────────────────────── */

/**
 * Toggle offline simulation by overriding fetch in the page context.
 * This injects a fetch override that rejects all requests.
 */
function toggleOffline() {
  isOffline = !isOffline;

  chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: function (goOffline) {
      if (goOffline) {
        /* Store original fetch and override */
        window.__swInspectorOrigFetch = window.fetch;
        window.fetch = function () {
          return Promise.reject(new TypeError('Failed to fetch (offline simulation)'));
        };
        /* Also prevent XMLHttpRequest */
        window.__swInspectorOrigXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function () {
          throw new DOMException('Network request failed (offline simulation)', 'NetworkError');
        };
      } else {
        /* Restore originals */
        if (window.__swInspectorOrigFetch) {
          window.fetch = window.__swInspectorOrigFetch;
          delete window.__swInspectorOrigFetch;
        }
        if (window.__swInspectorOrigXHROpen) {
          XMLHttpRequest.prototype.open = window.__swInspectorOrigXHROpen;
          delete window.__swInspectorOrigXHROpen;
        }
      }
      return goOffline;
    },
    args: [isOffline]
  }).then(function () {
    updateOfflineUI();
    showToast(isOffline ? 'Offline mode ON' : 'Offline mode OFF');
  });

  /* Persist offline state for this tab */
  if (currentTabId) {
    var data = {};
    data['offline_' + currentTabId] = isOffline;
    chrome.storage.local.set(data);
  }
}

/**
 * Update the offline button's visual state.
 */
function updateOfflineUI() {
  if (isOffline) {
    offlineIndicator.classList.add('on');
    offlineIndicator.classList.remove('off');
    btnOffline.title = 'Offline simulation ON — click to disable';
  } else {
    offlineIndicator.classList.remove('on');
    offlineIndicator.classList.add('off');
    btnOffline.title = 'Offline simulation OFF — click to enable';
  }
}

/* ── Data Loading ───────────────────────────────────────────── */

/**
 * Load all data: service workers, caches, and offline state.
 */
function loadAll() {
  if (!currentTabId) return;

  /* Load service workers */
  getServiceWorkers().then(function (workers) {
    renderWorkers(workers || []);
    /* Update badge via background */
    chrome.runtime.sendMessage({
      type: 'update_badge',
      tabId: currentTabId,
      count: (workers || []).length
    });
  }).catch(function () {
    renderWorkers([]);
  });

  /* Load cache data */
  getCacheData().then(function (data) {
    renderCaches(data || []);
  }).catch(function () {
    renderCaches([]);
  });

  /* Load offline state */
  var offlineKey = 'offline_' + currentTabId;
  chrome.storage.local.get(offlineKey, function (data) {
    isOffline = data[offlineKey] || false;
    updateOfflineUI();
  });
}

/* ── Event Handlers ─────────────────────────────────────────── */

/* Refresh button */
btnRefresh.addEventListener('click', function () {
  loadAll();
  showToast('Refreshed');
});

/* Offline toggle */
btnOffline.addEventListener('click', toggleOffline);

/* ── Initialise ─────────────────────────────────────────────── */

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  if (tabs.length > 0) {
    currentTabId = tabs[0].id;
    currentTabUrl = tabs[0].url || '';

    /* Check if we can script this tab (not chrome:// or extension pages) */
    if (currentTabUrl.startsWith('chrome://') ||
        currentTabUrl.startsWith('chrome-extension://') ||
        currentTabUrl.startsWith('about:')) {
      swEmpty.querySelector('p').textContent = 'Cannot inspect this page.';
      swEmpty.querySelector('.muted').textContent = 'Service worker inspection is not available on internal browser pages.';
      return;
    }

    loadAll();
  }
});
