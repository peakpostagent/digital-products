/**
 * panel.js
 * Main logic for the API Echo DevTools panel.
 * Captures network requests via chrome.devtools.network,
 * displays them in a filterable list, and shows detailed
 * request/response data in a split-pane view.
 */

/* ============================================================
   State
   ============================================================ */

/** @type {Array<Object>} All captured requests */
var requests = [];

/** @type {number|null} Index of the currently selected request */
var selectedIndex = null;

/* ============================================================
   DOM References
   ============================================================ */

var tableBody       = document.getElementById('request-table-body');
var emptyState      = document.getElementById('empty-state');
var requestCount    = document.getElementById('request-count');
var filterSearch    = document.getElementById('filter-search');
var filterMethod    = document.getElementById('filter-method');
var filterStatus    = document.getElementById('filter-status');
var autoScrollCheck = document.getElementById('auto-scroll');
var btnClear        = document.getElementById('btn-clear');
var detailPane      = document.getElementById('detail-pane');
var resizeHandle    = document.getElementById('resize-handle');
var requestListPane = document.getElementById('request-list-pane');
var btnCloseDetail  = document.getElementById('btn-close-detail');
var btnCopyCurl     = document.getElementById('btn-copy-curl');
var btnCopyResponse = document.getElementById('btn-copy-response');
var toastEl         = document.getElementById('toast');

/* Detail content elements */
var detailMethod    = document.getElementById('detail-method');
var detailUrl       = document.getElementById('detail-url');
var detailStatus    = document.getElementById('detail-status');
var reqHeadersEl    = document.getElementById('request-headers-content');
var reqBodyEl       = document.getElementById('request-body-content');
var resHeadersEl    = document.getElementById('response-headers-content');
var resBodyEl       = document.getElementById('response-body-content');
var timingEl        = document.getElementById('timing-content');

/* ============================================================
   Network Capture
   ============================================================ */

/**
 * Listen for completed network requests via the DevTools API.
 * Each finished request is added to our list and rendered.
 */
chrome.devtools.network.onRequestFinished.addListener(function (entry) {
  var request = parseHarEntry(entry);

  /* Fetch the response body asynchronously */
  entry.getContent(function (body, encoding) {
    request.responseBody = body || '';
    request.responseEncoding = encoding || '';

    /* Try to parse JSON response for pretty printing */
    if (body) {
      try {
        request.responseParsed = JSON.parse(body);
      } catch (e) {
        request.responseParsed = null;
      }
    }

    /* If this request is currently selected, refresh the detail view */
    if (selectedIndex !== null && requests[selectedIndex] === request) {
      renderDetail(request);
    }
  });

  requests.push(request);
  renderRequestRow(request, requests.length - 1);
  updateRequestCount();
  toggleEmptyState();

  /* Auto-scroll to the latest row if enabled */
  if (autoScrollCheck.checked) {
    requestListPane.scrollTop = requestListPane.scrollHeight;
  }
});

/**
 * Parse a HAR entry into a simpler object for our use.
 * @param {Object} entry - HAR 1.2 entry from chrome.devtools.network
 * @returns {Object} Simplified request object
 */
function parseHarEntry(entry) {
  var req = entry.request;
  var res = entry.response;
  var timings = entry.timings || {};

  return {
    method: req.method || 'GET',
    url: req.url || '',
    status: res.status || 0,
    statusText: res.statusText || '',
    requestHeaders: req.headers || [],
    requestBody: getPostData(req),
    responseHeaders: res.headers || [],
    responseBody: '',
    responseParsed: null,
    responseEncoding: '',
    contentSize: res.content ? res.content.size : 0,
    transferSize: res._transferSize || res.bodySize || 0,
    duration: entry.time || 0,
    timestamp: new Date(entry.startedDateTime),
    timings: {
      blocked: timings.blocked || 0,
      dns: timings.dns || 0,
      connect: timings.connect || 0,
      ssl: timings.ssl || 0,
      send: timings.send || 0,
      wait: timings.wait || 0,
      receive: timings.receive || 0
    }
  };
}

/**
 * Extract POST data from a HAR request object.
 * @param {Object} req - HAR request
 * @returns {string} The request body or empty string
 */
function getPostData(req) {
  if (!req.postData) return '';
  return req.postData.text || '';
}

/* ============================================================
   Rendering
   ============================================================ */

/**
 * Create and append a table row for a captured request.
 * @param {Object} request - Parsed request object
 * @param {number} index - Index in the requests array
 */
function renderRequestRow(request, index) {
  /* Check if this request passes current filters */
  if (!matchesFilters(request)) return;

  var tr = document.createElement('tr');
  tr.dataset.index = index;

  /* Method cell */
  var tdMethod = document.createElement('td');
  var badge = document.createElement('span');
  badge.className = 'method-badge method-' + request.method;
  badge.textContent = request.method;
  tdMethod.appendChild(badge);
  tr.appendChild(tdMethod);

  /* URL cell */
  var tdUrl = document.createElement('td');
  tdUrl.className = 'cell-url';
  tdUrl.textContent = shortenUrl(request.url);
  tdUrl.title = request.url;
  tr.appendChild(tdUrl);

  /* Status cell */
  var tdStatus = document.createElement('td');
  var statusSpan = document.createElement('span');
  statusSpan.className = 'status-badge ' + getStatusClass(request.status);
  statusSpan.textContent = request.status || '--';
  tdStatus.appendChild(statusSpan);
  tr.appendChild(tdStatus);

  /* Duration cell */
  var tdDuration = document.createElement('td');
  tdDuration.className = 'cell-duration';
  tdDuration.textContent = formatDuration(request.duration);
  tr.appendChild(tdDuration);

  /* Size cell */
  var tdSize = document.createElement('td');
  tdSize.className = 'cell-size';
  tdSize.textContent = formatSize(request.transferSize || request.contentSize);
  tr.appendChild(tdSize);

  /* Timestamp cell */
  var tdTime = document.createElement('td');
  tdTime.className = 'cell-timestamp';
  tdTime.textContent = formatTime(request.timestamp);
  tr.appendChild(tdTime);

  /* Click to show detail */
  tr.addEventListener('click', function () {
    selectRequest(parseInt(tr.dataset.index, 10));
  });

  tableBody.appendChild(tr);
}

/**
 * Re-render the entire request list (called after filter changes).
 */
function rerenderAllRows() {
  tableBody.innerHTML = '';
  for (var i = 0; i < requests.length; i++) {
    renderRequestRow(requests[i], i);
  }
  updateRequestCount();
  toggleEmptyState();
}

/**
 * Select a request and show its detail panel.
 * @param {number} index - Index of the request to show
 */
function selectRequest(index) {
  selectedIndex = index;
  var request = requests[index];

  /* Highlight the selected row */
  var rows = tableBody.querySelectorAll('tr');
  for (var i = 0; i < rows.length; i++) {
    rows[i].classList.toggle('selected', parseInt(rows[i].dataset.index, 10) === index);
  }

  /* Show detail pane */
  detailPane.classList.remove('hidden');
  resizeHandle.classList.add('visible');

  renderDetail(request);
}

/**
 * Populate the detail panel with request data.
 * @param {Object} request - The request to display
 */
function renderDetail(request) {
  /* Header bar */
  detailMethod.className = 'method-badge method-' + request.method;
  detailMethod.textContent = request.method;
  detailUrl.textContent = request.url;
  detailUrl.title = request.url;
  detailStatus.className = 'status-badge ' + getStatusClass(request.status);
  detailStatus.textContent = request.status + ' ' + request.statusText;

  /* Request headers */
  reqHeadersEl.innerHTML = formatHeaders(request.requestHeaders);

  /* Request body */
  if (request.requestBody) {
    reqBodyEl.innerHTML = formatJsonString(request.requestBody);
  } else {
    reqBodyEl.textContent = '(no request body)';
  }

  /* Response headers */
  resHeadersEl.innerHTML = formatHeaders(request.responseHeaders);

  /* Response body */
  if (request.responseParsed !== null && request.responseParsed !== undefined) {
    resBodyEl.innerHTML = highlightJson(request.responseParsed);
  } else if (request.responseBody) {
    resBodyEl.textContent = request.responseBody;
  } else {
    resBodyEl.textContent = '(loading or empty response)';
  }

  /* Timing */
  timingEl.innerHTML = renderTiming(request);
}

/* ============================================================
   Formatting Helpers
   ============================================================ */

/**
 * Shorten a URL to show just the pathname and query.
 * @param {string} url - Full URL
 * @returns {string} Shortened version
 */
function shortenUrl(url) {
  try {
    var parsed = new URL(url);
    var path = parsed.pathname + parsed.search;
    if (path.length > 80) {
      return path.substring(0, 77) + '...';
    }
    return path;
  } catch (e) {
    return url;
  }
}

/**
 * Get the CSS class for a status code.
 * @param {number} status - HTTP status code
 * @returns {string} CSS class name
 */
function getStatusClass(status) {
  if (status >= 200 && status < 300) return 'status-2xx';
  if (status >= 300 && status < 400) return 'status-3xx';
  if (status >= 400 && status < 500) return 'status-4xx';
  if (status >= 500) return 'status-5xx';
  return 'status-0';
}

/**
 * Format duration in milliseconds to a human-readable string.
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted string
 */
function formatDuration(ms) {
  if (ms < 0) return '--';
  if (ms < 1) return '<1 ms';
  if (ms < 1000) return Math.round(ms) + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

/**
 * Format byte size to a human-readable string.
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted string
 */
function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '--';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Format a Date to a time string (HH:MM:SS.mmm).
 * @param {Date} date - The date to format
 * @returns {string} Time string
 */
function formatTime(date) {
  if (!date || !(date instanceof Date)) return '--';
  var h = String(date.getHours()).padStart(2, '0');
  var m = String(date.getMinutes()).padStart(2, '0');
  var s = String(date.getSeconds()).padStart(2, '0');
  var ms = String(date.getMilliseconds()).padStart(3, '0');
  return h + ':' + m + ':' + s + '.' + ms;
}

/**
 * Format HAR headers array into a readable string with highlighting.
 * @param {Array} headers - Array of {name, value} objects
 * @returns {string} HTML string
 */
function formatHeaders(headers) {
  if (!headers || headers.length === 0) return '(no headers)';
  return headers.map(function (h) {
    return '<span class="json-key">' + escapeHtml(h.name) + '</span>: ' + escapeHtml(h.value);
  }).join('\n');
}

/**
 * Try to parse and pretty-print a JSON string.
 * @param {string} str - Possibly JSON string
 * @returns {string} HTML with syntax highlighting, or escaped plain text
 */
function formatJsonString(str) {
  try {
    var parsed = JSON.parse(str);
    return highlightJson(parsed);
  } catch (e) {
    return escapeHtml(str);
  }
}

/**
 * Syntax-highlight a parsed JSON value.
 * Keys = purple, strings = green, numbers = blue, booleans = red, null = gray.
 * @param {*} obj - Parsed JSON value
 * @returns {string} HTML string with highlight spans
 */
function highlightJson(obj) {
  var json = JSON.stringify(obj, null, 2);
  if (!json) return '';

  /* HTML-escape first to prevent XSS when injecting into innerHTML */
  json = escapeHtml(json);

  /* Replace JSON tokens with highlighted spans */
  return json.replace(
    /("(?:\\.|[^"\\])*")\s*:/g,
    '<span class="json-key">$1</span>:'
  ).replace(
    /:\s*("(?:\\.|[^"\\])*")/g,
    function (match, str) {
      return ': <span class="json-string">' + str + '</span>';
    }
  ).replace(
    /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
    ': <span class="json-number">$1</span>'
  ).replace(
    /:\s*(true|false)/g,
    ': <span class="json-bool">$1</span>'
  ).replace(
    /:\s*(null)/g,
    ': <span class="json-null">$1</span>'
  ).replace(
    /^\s*("(?:\\.|[^"\\])*")$/gm,
    function (match, str) {
      /* Standalone strings in arrays */
      if (match.indexOf(':') === -1) {
        return match.replace(str, '<span class="json-string">' + str + '</span>');
      }
      return match;
    }
  );
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str - Raw string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================
   Timing Breakdown
   ============================================================ */

/**
 * Render the timing waterfall for a request.
 * @param {Object} request - Request with timings data
 * @returns {string} HTML string for the timing tab
 */
function renderTiming(request) {
  var t = request.timings;
  var phases = [
    { label: 'Blocked', value: t.blocked, cls: 'blocked' },
    { label: 'DNS Lookup', value: t.dns, cls: 'dns' },
    { label: 'Connection', value: t.connect, cls: 'connect' },
    { label: 'SSL/TLS', value: t.ssl, cls: 'ssl' },
    { label: 'Request Sent', value: t.send, cls: 'send' },
    { label: 'Waiting (TTFB)', value: t.wait, cls: 'wait' },
    { label: 'Content Download', value: t.receive, cls: 'receive' }
  ];

  /* Find the max phase duration for bar scaling */
  var maxVal = 1;
  for (var i = 0; i < phases.length; i++) {
    if (phases[i].value > maxVal) maxVal = phases[i].value;
  }

  var html = '';
  var total = 0;

  for (var j = 0; j < phases.length; j++) {
    var p = phases[j];
    var val = Math.max(0, p.value);
    total += val;
    var pct = (val / maxVal) * 100;

    html += '<div class="timing-row">';
    html += '<span class="timing-label">' + p.label + '</span>';
    html += '<div class="timing-bar-container">';
    html += '<div class="timing-bar ' + p.cls + '" style="width:' + pct + '%"></div>';
    html += '</div>';
    html += '<span class="timing-value">' + formatDuration(val) + '</span>';
    html += '</div>';
  }

  html += '<div class="timing-row timing-total">';
  html += '<span class="timing-label">Total</span>';
  html += '<span class="timing-value">' + formatDuration(request.duration) + '</span>';
  html += '</div>';

  return html;
}

/* ============================================================
   Filters
   ============================================================ */

/**
 * Check if a request matches the current filter criteria.
 * @param {Object} request - Request to check
 * @returns {boolean} True if it matches all active filters
 */
function matchesFilters(request) {
  /* Method filter */
  var method = filterMethod.value;
  if (method && request.method !== method) return false;

  /* Status filter */
  var status = filterStatus.value;
  if (status) {
    var code = request.status;
    if (status === '2xx' && (code < 200 || code >= 300)) return false;
    if (status === '3xx' && (code < 300 || code >= 400)) return false;
    if (status === '4xx' && (code < 400 || code >= 500)) return false;
    if (status === '5xx' && (code < 500 || code >= 600)) return false;
  }

  /* Text search filter */
  var search = filterSearch.value.toLowerCase().trim();
  if (search) {
    var haystack = request.url.toLowerCase();

    /* Also search in headers */
    for (var i = 0; i < request.requestHeaders.length; i++) {
      haystack += ' ' + request.requestHeaders[i].name.toLowerCase();
      haystack += ' ' + request.requestHeaders[i].value.toLowerCase();
    }
    for (var j = 0; j < request.responseHeaders.length; j++) {
      haystack += ' ' + request.responseHeaders[j].name.toLowerCase();
      haystack += ' ' + request.responseHeaders[j].value.toLowerCase();
    }

    /* Search in body */
    haystack += ' ' + (request.requestBody || '').toLowerCase();
    haystack += ' ' + (request.responseBody || '').toLowerCase();

    if (haystack.indexOf(search) === -1) return false;
  }

  return true;
}

/* ============================================================
   Copy Functions
   ============================================================ */

/**
 * Generate a cURL command string for the given request.
 * @param {Object} request - The request to convert
 * @returns {string} cURL command
 */
function generateCurl(request) {
  var parts = ["curl '" + request.url.replace(/'/g, "'\\''") + "'"];

  /* Add method if not GET */
  if (request.method !== 'GET') {
    parts.push("-X " + request.method);
  }

  /* Add headers */
  for (var i = 0; i < request.requestHeaders.length; i++) {
    var h = request.requestHeaders[i];
    parts.push("-H '" + h.name + ": " + h.value.replace(/'/g, "'\\''") + "'");
  }

  /* Add body */
  if (request.requestBody) {
    parts.push("--data-raw '" + request.requestBody.replace(/'/g, "'\\''") + "'");
  }

  return parts.join(' \\\n  ');
}

/**
 * Copy text to clipboard and show a toast notification.
 * @param {string} text - Text to copy
 * @param {string} message - Toast message to show
 */
function copyToClipboard(text, message) {
  navigator.clipboard.writeText(text).then(function () {
    showToast(message || 'Copied to clipboard');
  }).catch(function () {
    showToast('Failed to copy');
  });
}

/* ============================================================
   Toast Notification
   ============================================================ */

/** @type {number|null} Timer ID for hiding the toast */
var toastTimer = null;

/**
 * Show a brief toast message at the bottom of the panel.
 * @param {string} message - Message to display
 */
function showToast(message) {
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  toastTimer = setTimeout(function () {
    toastEl.classList.add('hidden');
  }, 2000);
}

/* ============================================================
   UI Helpers
   ============================================================ */

/**
 * Update the request counter badge in the toolbar.
 */
function updateRequestCount() {
  var visible = tableBody.querySelectorAll('tr').length;
  var total = requests.length;
  if (visible === total) {
    requestCount.textContent = total + ' request' + (total !== 1 ? 's' : '');
  } else {
    requestCount.textContent = visible + ' / ' + total + ' requests';
  }
}

/**
 * Show or hide the empty state message.
 */
function toggleEmptyState() {
  var hasRows = tableBody.querySelectorAll('tr').length > 0;
  emptyState.classList.toggle('hidden', hasRows);
}

/**
 * Close the detail panel.
 */
function closeDetail() {
  selectedIndex = null;
  detailPane.classList.add('hidden');
  resizeHandle.classList.remove('visible');

  /* Deselect all rows */
  var rows = tableBody.querySelectorAll('tr');
  for (var i = 0; i < rows.length; i++) {
    rows[i].classList.remove('selected');
  }
}

/**
 * Clear all captured requests and reset the UI.
 */
function clearAll() {
  requests = [];
  selectedIndex = null;
  tableBody.innerHTML = '';
  closeDetail();
  updateRequestCount();
  toggleEmptyState();
}

/* ============================================================
   Detail Tabs
   ============================================================ */

/**
 * Switch between detail tabs (Request Headers, Body, Response, Timing).
 * @param {string} tabId - The data-tab value to activate
 */
function switchTab(tabId) {
  /* Update tab buttons */
  var tabs = document.querySelectorAll('.detail-tab');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.toggle('active', tabs[i].dataset.tab === tabId);
  }

  /* Update tab content */
  var contents = document.querySelectorAll('.tab-content');
  for (var j = 0; j < contents.length; j++) {
    contents[j].classList.toggle('active', contents[j].id === 'tab-' + tabId);
  }
}

/* ============================================================
   Resizable Split Pane
   ============================================================ */

var isResizing = false;

/**
 * Initialize the drag-to-resize behavior for the split pane handle.
 */
function initResize() {
  resizeHandle.addEventListener('mousedown', function (e) {
    isResizing = true;
    resizeHandle.classList.add('active');
    e.preventDefault();
  });

  document.addEventListener('mousemove', function (e) {
    if (!isResizing) return;

    var container = document.querySelector('.main-container');
    var containerRect = container.getBoundingClientRect();
    var totalHeight = containerRect.height;
    var mouseY = e.clientY - containerRect.top;

    /* Constrain the split: min 100px for list, min 120px for detail */
    var listHeight = Math.max(100, Math.min(mouseY, totalHeight - 120));

    requestListPane.style.flex = 'none';
    requestListPane.style.height = listHeight + 'px';
    detailPane.style.flex = '1';
  });

  document.addEventListener('mouseup', function () {
    if (isResizing) {
      isResizing = false;
      resizeHandle.classList.remove('active');
    }
  });
}

/* ============================================================
   Event Listeners
   ============================================================ */

/* Clear button */
btnClear.addEventListener('click', clearAll);

/* Close detail panel */
btnCloseDetail.addEventListener('click', closeDetail);

/* Copy as cURL */
btnCopyCurl.addEventListener('click', function () {
  if (selectedIndex === null) return;
  var curl = generateCurl(requests[selectedIndex]);
  copyToClipboard(curl, 'Copied as cURL');
});

/* Copy response body */
btnCopyResponse.addEventListener('click', function () {
  if (selectedIndex === null) return;
  var body = requests[selectedIndex].responseBody || '';
  copyToClipboard(body, 'Response copied');
});

/* Filter inputs - re-render on change */
filterSearch.addEventListener('input', rerenderAllRows);
filterMethod.addEventListener('change', rerenderAllRows);
filterStatus.addEventListener('change', rerenderAllRows);

/* Detail tab switching */
document.querySelector('.detail-tabs').addEventListener('click', function (e) {
  if (e.target.classList.contains('detail-tab')) {
    switchTab(e.target.dataset.tab);
  }
});

/* Keyboard shortcut: Escape to close detail */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeDetail();
  }
});

/* Initialize resize behavior */
initResize();

/* Initialize empty state */
toggleEmptyState();
