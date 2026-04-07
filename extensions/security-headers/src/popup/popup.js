/**
 * Security Headers — Popup logic.
 *
 * Handles scanning, rendering results, history, and copy-to-clipboard.
 * Depends on: ../lib/utils.js, ../lib/headers.js (loaded via script tags)
 */

/* ---- DOM references ---- */
var gradeCard     = document.getElementById('gradeCard');
var gradeBadge    = document.getElementById('gradeBadge');
var gradeUrl      = document.getElementById('gradeUrl');
var gradeScore    = document.getElementById('gradeScore');
var scanSection   = document.getElementById('scanSection');
var btnScan       = document.getElementById('btnScan');
var errorSection  = document.getElementById('errorSection');
var errorText     = document.getElementById('errorText');
var loadingSection = document.getElementById('loadingSection');
var resultsSection = document.getElementById('resultsSection');
var resultsList   = document.getElementById('resultsList');
var actionsSection = document.getElementById('actionsSection');
var btnCopy       = document.getElementById('btnCopy');
var btnHistory    = document.getElementById('btnHistory');
var historySection = document.getElementById('historySection');
var historyList   = document.getElementById('historyList');
var btnBackFromHistory = document.getElementById('btnBackFromHistory');
var btnClearHistory = document.getElementById('btnClearHistory');

/* ---- State ---- */
var currentResults = null;
var currentGradeInfo = null;
var currentUrl = '';

/* ---- Event listeners ---- */
btnScan.addEventListener('click', startScan);
btnCopy.addEventListener('click', copyReport);
btnHistory.addEventListener('click', showHistory);
btnBackFromHistory.addEventListener('click', hideHistory);
btnClearHistory.addEventListener('click', clearHistory);

/**
 * Start a header scan on the active tab.
 */
async function startScan() {
  // Reset UI
  showLoading();

  try {
    // Get the active tab
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      showError('No active tab found.');
      return;
    }

    var tab = tabs[0];

    // Check for restricted URLs
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
      showError('Cannot scan browser internal pages. Navigate to a website first.');
      return;
    }

    // Inject the fetch script into the active tab
    var results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fetchPageHeaders
    });

    if (!results || !results[0] || !results[0].result) {
      showError('Failed to read headers from this page.');
      return;
    }

    var data = results[0].result;

    if (data.error) {
      showError('Error fetching headers: ' + data.error);
      return;
    }

    // Analyze the headers
    currentUrl = data.url;
    currentResults = analyzeHeaders(data.headers);
    currentGradeInfo = calculateGrade(currentResults);

    // Update badge on the tab
    chrome.runtime.sendMessage({
      action: 'updateBadge',
      tabId: tab.id,
      grade: currentGradeInfo.grade
    });

    // Save to history
    saveHistory({
      url: currentUrl,
      hostname: getHostname(currentUrl),
      grade: currentGradeInfo.grade,
      percentage: currentGradeInfo.percentage,
      timestamp: Date.now()
    });

    // Render results
    renderResults();
  } catch (err) {
    showError('Scan failed: ' + err.message);
  }
}

/**
 * This function runs IN THE PAGE CONTEXT (injected via scripting API).
 * Performs a HEAD fetch to the current URL and returns response headers.
 */
function fetchPageHeaders() {
  return fetch(location.href, { method: 'HEAD', credentials: 'same-origin' })
    .then(function (response) {
      var headers = {};
      response.headers.forEach(function (value, key) {
        headers[key] = value;
      });
      return { url: location.href, headers: headers, error: null };
    })
    .catch(function (err) {
      return { url: location.href, headers: {}, error: err.message };
    });
}

/**
 * Render the grade card and results list.
 */
function renderResults() {
  // Hide loading and scan section
  loadingSection.style.display = 'none';
  scanSection.style.display = 'none';
  errorSection.style.display = 'none';

  // Show grade card
  gradeCard.style.display = 'flex';
  gradeBadge.textContent = currentGradeInfo.grade;
  gradeBadge.style.background = gradeColor(currentGradeInfo.grade);
  gradeUrl.textContent = escapeHtml(getHostname(currentUrl));
  gradeScore.textContent = currentGradeInfo.percentage + '% — ' +
    currentGradeInfo.score + '/' + currentGradeInfo.maxScore + ' points';

  // Build results HTML
  var html = '';
  currentResults.forEach(function (r, index) {
    var statusText = r.status === 'good' ? 'Pass' : (r.status === 'weak' ? 'Weak' : 'Missing');
    var deprecatedTag = r.deprecated ? '<span class="deprecated-tag">deprecated</span>' : '';

    html += '<div class="header-row-item" data-index="' + index + '">';
    html += '  <div class="header-row-summary">';
    html += '    <div class="status-dot ' + escapeHtml(r.status) + '"></div>';
    html += '    <div class="header-name">' + escapeHtml(r.name) + deprecatedTag + '</div>';
    html += '    <span class="status-label ' + escapeHtml(r.status) + '">' + escapeHtml(statusText) + '</span>';
    html += '    <span class="chevron">&#9654;</span>';
    html += '  </div>';
    html += '  <div class="header-row-detail">';

    // Current value
    html += '    <div class="detail-field">';
    html += '      <div class="detail-label">Current Value</div>';
    if (r.value) {
      html += '      <div class="detail-value value-text">' + escapeHtml(r.value) + '</div>';
    } else {
      html += '      <div class="detail-value missing-text">Not set</div>';
    }
    html += '    </div>';

    // Description
    html += '    <div class="detail-field">';
    html += '      <div class="detail-label">What it does</div>';
    html += '      <div class="detail-value">' + escapeHtml(r.description) + '</div>';
    html += '    </div>';

    // Recommendation
    html += '    <div class="detail-field">';
    html += '      <div class="detail-label">Recommendation</div>';
    html += '      <div class="detail-value">' + escapeHtml(r.recommendation) + '</div>';
    html += '    </div>';

    html += '  </div>';
    html += '</div>';
  });

  resultsList.innerHTML = html;

  // Add click handlers for collapsible rows
  var rows = resultsList.querySelectorAll('.header-row-summary');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var item = row.closest('.header-row-item');
      item.classList.toggle('expanded');
    });
  });

  // Show results and actions
  resultsSection.style.display = 'block';
  actionsSection.style.display = 'block';
}

/**
 * Show the loading spinner.
 */
function showLoading() {
  scanSection.style.display = 'none';
  errorSection.style.display = 'none';
  gradeCard.style.display = 'none';
  resultsSection.style.display = 'none';
  actionsSection.style.display = 'none';
  loadingSection.style.display = 'block';
}

/**
 * Show an error message.
 * @param {string} msg
 */
function showError(msg) {
  loadingSection.style.display = 'none';
  errorSection.style.display = 'block';
  errorText.textContent = msg;
  scanSection.style.display = 'block';
}

/**
 * Copy the formatted report to clipboard.
 */
async function copyReport() {
  if (!currentResults || !currentGradeInfo) return;

  var report = formatReport(currentUrl, currentGradeInfo, currentResults);

  try {
    await navigator.clipboard.writeText(report);
    btnCopy.textContent = 'Copied!';
    btnCopy.classList.add('copied');
    setTimeout(function () {
      btnCopy.textContent = 'Copy Report';
      btnCopy.classList.remove('copied');
    }, 2000);
  } catch (err) {
    btnCopy.textContent = 'Copy failed';
    setTimeout(function () {
      btnCopy.textContent = 'Copy Report';
    }, 2000);
  }
}

/**
 * Save a scan entry to history via chrome.storage.local.
 * @param {Object} entry
 */
async function saveHistory(entry) {
  var data = await chrome.storage.local.get({ scanHistory: [] });
  var history = data.scanHistory;

  // Add at the beginning
  history.unshift(entry);

  // Keep only the last 50
  if (history.length > 50) {
    history = history.slice(0, 50);
  }

  await chrome.storage.local.set({ scanHistory: history });
}

/**
 * Show the history panel.
 */
async function showHistory() {
  // Hide main content
  scanSection.style.display = 'none';
  gradeCard.style.display = 'none';
  resultsSection.style.display = 'none';
  actionsSection.style.display = 'none';
  errorSection.style.display = 'none';
  loadingSection.style.display = 'none';

  // Show history
  historySection.style.display = 'block';

  // Load history data
  var data = await chrome.storage.local.get({ scanHistory: [] });
  var history = data.scanHistory;

  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No scans yet.</div>';
    return;
  }

  var html = '';
  history.forEach(function (entry) {
    html += '<div class="history-entry">';
    html += '  <div class="history-grade" style="background:' + escapeHtml(gradeColor(entry.grade)) + ';">' + escapeHtml(entry.grade) + '</div>';
    html += '  <div class="history-info">';
    html += '    <div class="history-hostname">' + escapeHtml(entry.hostname) + '</div>';
    html += '    <div class="history-date">' + escapeHtml(formatDate(entry.timestamp)) + ' ' + escapeHtml(formatTime(entry.timestamp)) + '</div>';
    html += '  </div>';
    html += '  <div class="history-pct">' + escapeHtml(String(entry.percentage)) + '%</div>';
    html += '</div>';
  });

  historyList.innerHTML = html;
}

/**
 * Hide the history panel and show the main view.
 */
function hideHistory() {
  historySection.style.display = 'none';

  // Show whichever view was active
  if (currentResults) {
    gradeCard.style.display = 'flex';
    resultsSection.style.display = 'block';
    actionsSection.style.display = 'block';
  } else {
    scanSection.style.display = 'block';
  }
}

/**
 * Clear all scan history.
 */
async function clearHistory() {
  await chrome.storage.local.set({ scanHistory: [] });
  historyList.innerHTML = '<div class="history-empty">No scans yet.</div>';
}
