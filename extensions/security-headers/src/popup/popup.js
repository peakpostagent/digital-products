/**
 * Security Headers — Popup logic.
 *
 * Features:
 *  - Scan current page, show letter grade, severity pills
 *  - Expandable per-header card with "Learn more" + fix snippets per stack
 *  - Batch scan multiple URLs with CSV export
 *  - Compare current site with another URL side-by-side
 *  - Share Report as PNG image rendered via Canvas
 *  - History panel
 *
 * Depends on: ../lib/utils.js, ../lib/headers.js (loaded via script tags)
 */

/* ================= DOM references ================= */
var viewMain     = document.getElementById('viewMain');
var viewBatch    = document.getElementById('viewBatch');
var viewCompare  = document.getElementById('viewCompare');
var viewHistory  = document.getElementById('viewHistory');
var viewShare    = document.getElementById('viewShare');

var gradeCard     = document.getElementById('gradeCard');
var gradeBadge    = document.getElementById('gradeBadge');
var gradeUrl      = document.getElementById('gradeUrl');
var gradeScore    = document.getElementById('gradeScore');

var issuePills        = document.getElementById('issuePills');
var pillCriticalCount = document.getElementById('pillCriticalCount');
var pillImportantCount = document.getElementById('pillImportantCount');
var pillOptionalCount = document.getElementById('pillOptionalCount');

var scanSection   = document.getElementById('scanSection');
var btnScan       = document.getElementById('btnScan');
var errorSection  = document.getElementById('errorSection');
var errorText     = document.getElementById('errorText');
var loadingSection = document.getElementById('loadingSection');
var loadingText   = document.getElementById('loadingText');
var resultsSection = document.getElementById('resultsSection');
var resultsList   = document.getElementById('resultsList');
var actionsSection = document.getElementById('actionsSection');
var btnCopy       = document.getElementById('btnCopy');
var btnShare      = document.getElementById('btnShare');
var btnCompare    = document.getElementById('btnCompare');
var compareInline = document.getElementById('compareInline');
var compareInput  = document.getElementById('compareInput');
var btnCompareGo  = document.getElementById('btnCompareGo');

var btnHistory    = document.getElementById('btnHistory');
var btnBatch      = document.getElementById('btnBatch');
var historyList   = document.getElementById('historyList');
var btnBackFromHistory = document.getElementById('btnBackFromHistory');
var btnClearHistory = document.getElementById('btnClearHistory');

var btnBackFromBatch = document.getElementById('btnBackFromBatch');
var batchInput    = document.getElementById('batchInput');
var btnBatchRun   = document.getElementById('btnBatchRun');
var btnBatchExport = document.getElementById('btnBatchExport');
var batchProgress = document.getElementById('batchProgress');
var batchProgressFill = document.getElementById('batchProgressFill');
var batchProgressText = document.getElementById('batchProgressText');
var batchResults  = document.getElementById('batchResults');

var btnBackFromCompare = document.getElementById('btnBackFromCompare');
var compareGrid   = document.getElementById('compareGrid');
var compareDiffs  = document.getElementById('compareDiffs');

var btnBackFromShare = document.getElementById('btnBackFromShare');
var shareCanvas   = document.getElementById('shareCanvas');
var btnShareCopy  = document.getElementById('btnShareCopy');
var btnShareDownload = document.getElementById('btnShareDownload');
var shareHint     = document.getElementById('shareHint');

/* ================= State ================= */
var currentResults = null;
var currentGradeInfo = null;
var currentUrl = '';
var batchData = []; // latest batch results for CSV export

/* ================= Event wiring ================= */
btnScan.addEventListener('click', startScan);
btnCopy.addEventListener('click', copyReport);
btnShare.addEventListener('click', openShareView);
btnCompare.addEventListener('click', toggleCompareInline);
btnCompareGo.addEventListener('click', runCompareFromInline);

btnHistory.addEventListener('click', showHistory);
btnBackFromHistory.addEventListener('click', function () { switchView('main'); });
btnClearHistory.addEventListener('click', clearHistory);

btnBatch.addEventListener('click', function () { switchView('batch'); });
btnBackFromBatch.addEventListener('click', function () { switchView('main'); });
btnBatchRun.addEventListener('click', runBatchScan);
btnBatchExport.addEventListener('click', exportBatchCsv);

btnBackFromCompare.addEventListener('click', function () { switchView('main'); });

btnBackFromShare.addEventListener('click', function () { switchView('main'); });
btnShareCopy.addEventListener('click', copyShareImage);
btnShareDownload.addEventListener('click', downloadShareImage);

// Allow Enter key in compare input to trigger compare
compareInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') { e.preventDefault(); runCompareFromInline(); }
});

/* ================= View switching ================= */

/**
 * Show one of the top-level views and hide the others.
 * @param {string} name - 'main' | 'batch' | 'compare' | 'history' | 'share'
 */
function switchView(name) {
  viewMain.style.display = name === 'main' ? 'block' : 'none';
  viewBatch.style.display = name === 'batch' ? 'block' : 'none';
  viewCompare.style.display = name === 'compare' ? 'block' : 'none';
  viewHistory.style.display = name === 'history' ? 'block' : 'none';
  viewShare.style.display = name === 'share' ? 'block' : 'none';
}

/* ================= Active-tab scan ================= */

/**
 * Start a header scan on the active tab.
 */
async function startScan() {
  showLoading('Fetching headers...');

  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) {
      showError('No active tab found.');
      return;
    }

    var tab = tabs[0];

    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
      showError('Cannot scan browser internal pages. Navigate to a website first.');
      return;
    }

    // Inject a HEAD fetch in the page context (uses same-origin credentials)
    var scriptResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fetchPageHeadersInPage
    });

    if (!scriptResults || !scriptResults[0] || !scriptResults[0].result) {
      showError('Failed to read headers from this page.');
      return;
    }

    var data = scriptResults[0].result;
    if (data.error) {
      showError('Error fetching headers: ' + data.error);
      return;
    }

    currentUrl = data.url;
    currentResults = analyzeHeaders(data.headers);
    currentGradeInfo = calculateGrade(currentResults);

    chrome.runtime.sendMessage({
      action: 'updateBadge',
      tabId: tab.id,
      grade: currentGradeInfo.grade
    });

    saveHistory({
      url: currentUrl,
      hostname: getHostname(currentUrl),
      grade: currentGradeInfo.grade,
      percentage: currentGradeInfo.percentage,
      criticalIssues: currentGradeInfo.criticalIssues,
      timestamp: Date.now()
    });

    renderResults();
  } catch (err) {
    showError('Scan failed: ' + err.message);
  }
}

/**
 * Runs IN THE PAGE CONTEXT via chrome.scripting. Performs HEAD fetch
 * against the current URL and returns response headers.
 */
function fetchPageHeadersInPage() {
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

/* ================= Render main results ================= */

/**
 * Render the grade card, severity pills, and detailed result list.
 */
function renderResults() {
  loadingSection.style.display = 'none';
  scanSection.style.display = 'none';
  errorSection.style.display = 'none';
  compareInline.style.display = 'none';

  gradeCard.style.display = 'flex';
  gradeBadge.textContent = currentGradeInfo.grade;
  gradeBadge.style.background = gradeColor(currentGradeInfo.grade);
  gradeUrl.textContent = getHostname(currentUrl);
  gradeScore.textContent = currentGradeInfo.percentage + '% - ' +
    currentGradeInfo.score + '/' + currentGradeInfo.maxScore + ' points';

  issuePills.style.display = 'flex';
  pillCriticalCount.textContent = currentGradeInfo.criticalIssues;
  pillImportantCount.textContent = currentGradeInfo.importantIssues;
  pillOptionalCount.textContent = currentGradeInfo.optionalIssues;

  resultsList.innerHTML = renderResultsHtml(currentResults);
  wireResultRowHandlers(resultsList);

  resultsSection.style.display = 'block';
  actionsSection.style.display = 'block';
}

/**
 * Build the HTML for a results list (shared by main view and compare view).
 * @param {Array} results
 * @returns {string} HTML
 */
function renderResultsHtml(results) {
  var html = '';
  results.forEach(function (r, index) {
    var statusText = r.status === 'good' ? 'Pass' : (r.status === 'weak' ? 'Weak' : 'Missing');
    var deprecatedTag = r.deprecated ? '<span class="deprecated-tag">deprecated</span>' : '';
    var severityTag = '<span class="severity-tag severity-' + escapeHtml(r.severity || 'optional') + '">' +
      escapeHtml((r.severity || 'optional').toUpperCase()) + '</span>';

    html += '<div class="header-row-item" data-index="' + index + '">';
    html += '  <div class="header-row-summary">';
    html += '    <div class="status-dot ' + escapeHtml(r.status) + '"></div>';
    html += '    <div class="header-name">' + escapeHtml(r.name) + deprecatedTag + '</div>';
    html += '    ' + severityTag;
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

    // Attack prevented
    if (r.attack) {
      html += '    <div class="detail-field">';
      html += '      <div class="detail-label">Attack prevented</div>';
      html += '      <div class="detail-value">' + escapeHtml(r.attack) + '</div>';
      html += '    </div>';
    }

    // Real-world breach example
    if (r.breach) {
      html += '    <div class="detail-field">';
      html += '      <div class="detail-label">Real-world example</div>';
      html += '      <div class="detail-value detail-breach">' + escapeHtml(r.breach) + '</div>';
      html += '    </div>';
    }

    // Recommendation
    html += '    <div class="detail-field">';
    html += '      <div class="detail-label">Recommendation</div>';
    html += '      <div class="detail-value">' + escapeHtml(r.recommendation) + '</div>';
    html += '    </div>';

    // Fix snippets with tabs + copy
    if (r.snippets) {
      html += '    <div class="detail-field">';
      html += '      <div class="detail-label">Fix snippet</div>';
      html += '      <div class="snippet-tabs" role="tablist">';
      var stacks = ['nginx', 'apache', 'express', 'cloudflare'];
      stacks.forEach(function (stack, si) {
        var isActive = si === 0 ? ' active' : '';
        html += '<button type="button" class="snippet-tab' + isActive + '" data-stack="' + stack + '" data-index="' + index + '">' + escapeHtml(labelForStack(stack)) + '</button>';
      });
      html += '      </div>';
      stacks.forEach(function (stack, si) {
        var isActive = si === 0 ? ' active' : '';
        html += '<pre class="snippet-code' + isActive + '" data-stack="' + stack + '" data-index="' + index + '">' + escapeHtml(r.snippets[stack] || '') + '</pre>';
      });
      html += '      <button type="button" class="snippet-copy" data-index="' + index + '">Copy snippet</button>';
      html += '    </div>';
    }

    html += '  </div>';
    html += '</div>';
  });
  return html;
}

/**
 * Readable label for a stack identifier.
 */
function labelForStack(stack) {
  switch (stack) {
    case 'nginx': return 'Nginx';
    case 'apache': return 'Apache';
    case 'express': return 'Express';
    case 'cloudflare': return 'Cloudflare';
    default: return stack;
  }
}

/**
 * Wire up expand/collapse, snippet tab switching, and copy snippet.
 * @param {HTMLElement} container - the results list element
 */
function wireResultRowHandlers(container) {
  // Row expand/collapse
  var rows = container.querySelectorAll('.header-row-summary');
  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var item = row.closest('.header-row-item');
      item.classList.toggle('expanded');
    });
  });

  // Snippet tab switching
  var tabs = container.querySelectorAll('.snippet-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      e.stopPropagation();
      var stack = tab.getAttribute('data-stack');
      var idx = tab.getAttribute('data-index');
      var item = tab.closest('.header-row-item');
      item.querySelectorAll('.snippet-tab[data-index="' + idx + '"]').forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-stack') === stack);
      });
      item.querySelectorAll('.snippet-code[data-index="' + idx + '"]').forEach(function (c) {
        c.classList.toggle('active', c.getAttribute('data-stack') === stack);
      });
    });
  });

  // Copy snippet
  var copyBtns = container.querySelectorAll('.snippet-copy');
  copyBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var item = btn.closest('.header-row-item');
      var activeCode = item.querySelector('.snippet-code.active');
      if (!activeCode) return;
      var text = activeCode.textContent;
      navigator.clipboard.writeText(text).then(function () {
        var original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1500);
      }).catch(function () {
        btn.textContent = 'Copy failed';
        setTimeout(function () { btn.textContent = 'Copy snippet'; }, 1500);
      });
    });
  });
}

/* ================= Loading / error ================= */

function showLoading(msg) {
  scanSection.style.display = 'none';
  errorSection.style.display = 'none';
  gradeCard.style.display = 'none';
  issuePills.style.display = 'none';
  resultsSection.style.display = 'none';
  actionsSection.style.display = 'none';
  loadingSection.style.display = 'block';
  loadingText.textContent = msg || 'Loading...';
}

function showError(msg) {
  loadingSection.style.display = 'none';
  errorSection.style.display = 'block';
  errorText.textContent = msg;
  scanSection.style.display = 'block';
}

/* ================= Copy report ================= */

async function copyReport() {
  if (!currentResults || !currentGradeInfo) return;
  var report = formatReport(currentUrl, currentGradeInfo, currentResults);
  try {
    await navigator.clipboard.writeText(report);
    flashButton(btnCopy, 'Copy Report', 'Copied!');
  } catch (err) {
    flashButton(btnCopy, 'Copy Report', 'Copy failed');
  }
}

/** Flash a button label briefly to confirm an action. */
function flashButton(btn, original, flash) {
  btn.textContent = flash;
  btn.classList.add('copied');
  setTimeout(function () {
    btn.textContent = original;
    btn.classList.remove('copied');
  }, 1500);
}

/* ================= History ================= */

async function saveHistory(entry) {
  var data = await chrome.storage.local.get({ scanHistory: [] });
  var history = data.scanHistory;
  history.unshift(entry);
  if (history.length > 50) history = history.slice(0, 50);
  await chrome.storage.local.set({ scanHistory: history });
}

async function showHistory() {
  switchView('history');
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

async function clearHistory() {
  await chrome.storage.local.set({ scanHistory: [] });
  historyList.innerHTML = '<div class="history-empty">No scans yet.</div>';
}

/* ================= Batch scan ================= */

/**
 * Scan every URL in the textarea in sequence using the background fetch.
 */
async function runBatchScan() {
  var raw = batchInput.value.split(/\r?\n/);
  var urls = [];
  raw.forEach(function (line) {
    var u = normalizeUrl(line);
    if (u) urls.push(u);
  });

  if (urls.length === 0) {
    batchResults.innerHTML = '<div class="batch-empty">Enter at least one valid URL.</div>';
    return;
  }

  batchData = [];
  batchResults.innerHTML = '';
  batchProgress.style.display = 'block';
  btnBatchExport.disabled = true;
  btnBatchRun.disabled = true;

  for (var i = 0; i < urls.length; i++) {
    batchProgressText.textContent = 'Scanning ' + (i + 1) + ' of ' + urls.length + '...';
    batchProgressFill.style.width = Math.round(((i) / urls.length) * 100) + '%';

    var url = urls[i];
    try {
      var resp = await chrome.runtime.sendMessage({ action: 'fetchHeaders', url: url });
      if (!resp) {
        batchData.push({ url: url, error: 'No response' });
        continue;
      }
      if (resp.error) {
        batchData.push({ url: url, error: resp.error });
        continue;
      }
      var results = analyzeHeaders(resp.headers);
      var info = calculateGrade(results);
      batchData.push({
        url: url,
        finalUrl: resp.url,
        grade: info.grade,
        percentage: info.percentage,
        score: info.score,
        maxScore: info.maxScore,
        criticalIssues: info.criticalIssues,
        importantIssues: info.importantIssues,
        optionalIssues: info.optionalIssues,
        missing: countMissing(results),
        results: results
      });
    } catch (err) {
      batchData.push({ url: url, error: err.message || 'Request failed' });
    }
  }

  batchProgressFill.style.width = '100%';
  batchProgressText.textContent = 'Done. Scanned ' + urls.length + ' site(s).';
  btnBatchExport.disabled = batchData.length === 0;
  btnBatchRun.disabled = false;

  renderBatchResults();
}

/** Count missing (not weak) headers in a results array. */
function countMissing(results) {
  var n = 0;
  results.forEach(function (r) { if (r.status === 'missing' && !r.deprecated) n++; });
  return n;
}

/** Order grades from best to worst for sorting. */
var GRADE_ORDER = { 'A+': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'F': 5 };

/**
 * Render batch results sorted by grade (best first).
 */
function renderBatchResults() {
  var sorted = batchData.slice().sort(function (a, b) {
    var ga = a.grade ? GRADE_ORDER[a.grade] : 99;
    var gb = b.grade ? GRADE_ORDER[b.grade] : 99;
    return ga - gb;
  });

  var html = '<table class="batch-table">';
  html += '<thead><tr><th>URL</th><th class="col-grade">Grade</th><th class="col-missing">Missing</th><th class="col-critical">Critical</th></tr></thead><tbody>';
  sorted.forEach(function (row) {
    if (row.error) {
      html += '<tr class="batch-row-error"><td class="col-url" title="' + escapeHtml(row.url) + '">' + escapeHtml(getHostname(row.url) || row.url) + '</td>';
      html += '<td class="col-grade">-</td><td class="col-missing" colspan="2">' + escapeHtml(row.error) + '</td></tr>';
      return;
    }
    html += '<tr>';
    html += '  <td class="col-url" title="' + escapeHtml(row.url) + '">' + escapeHtml(getHostname(row.url) || row.url) + '</td>';
    html += '  <td class="col-grade"><span class="batch-grade" style="background:' + escapeHtml(gradeColor(row.grade)) + ';">' + escapeHtml(row.grade) + '</span></td>';
    html += '  <td class="col-missing">' + escapeHtml(String(row.missing)) + '</td>';
    html += '  <td class="col-critical">' + escapeHtml(String(row.criticalIssues)) + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  batchResults.innerHTML = html;
}

/**
 * Export current batch data as CSV.
 */
function exportBatchCsv() {
  if (!batchData || batchData.length === 0) return;
  var rows = [
    ['URL', 'Grade', 'Percentage', 'Score', 'MaxScore', 'Critical', 'Important', 'Optional', 'Missing', 'Error']
  ];
  batchData.forEach(function (r) {
    if (r.error) {
      rows.push([r.url, '', '', '', '', '', '', '', '', r.error]);
    } else {
      rows.push([
        r.url,
        r.grade,
        r.percentage,
        r.score,
        r.maxScore,
        r.criticalIssues,
        r.importantIssues,
        r.optionalIssues,
        r.missing,
        ''
      ]);
    }
  });
  var csv = toCsv(rows);
  var filename = 'security-headers-batch-' + Date.now() + '.csv';
  downloadFile(filename, csv, 'text/csv;charset=utf-8');
}

/* ================= Compare ================= */

/**
 * Toggle the inline compare URL input from the main view.
 */
function toggleCompareInline() {
  if (!currentResults) return;
  compareInline.style.display = compareInline.style.display === 'none' ? 'flex' : 'none';
  if (compareInline.style.display === 'flex') compareInput.focus();
}

/**
 * Kick off a compare using the URL from the inline input.
 */
async function runCompareFromInline() {
  var other = normalizeUrl(compareInput.value);
  if (!other) {
    compareInput.focus();
    return;
  }
  await runCompare(currentUrl, currentResults, currentGradeInfo, other);
}

/**
 * Fetch headers for `otherUrl`, then render a side-by-side compare view.
 */
async function runCompare(siteAUrl, siteAResults, siteAGrade, otherUrl) {
  switchView('compare');
  compareGrid.innerHTML = '<div class="compare-loading">Fetching ' + escapeHtml(otherUrl) + '...</div>';
  compareDiffs.innerHTML = '';

  var resp;
  try {
    resp = await chrome.runtime.sendMessage({ action: 'fetchHeaders', url: otherUrl });
  } catch (err) {
    compareGrid.innerHTML = '<div class="compare-error">Failed: ' + escapeHtml(err.message || 'request failed') + '</div>';
    return;
  }
  if (!resp || resp.error) {
    compareGrid.innerHTML = '<div class="compare-error">Could not fetch ' + escapeHtml(otherUrl) + ': ' + escapeHtml((resp && resp.error) || 'unknown') + '</div>';
    return;
  }

  var siteBResults = analyzeHeaders(resp.headers);
  var siteBGrade = calculateGrade(siteBResults);
  var siteBUrl = resp.url || otherUrl;

  renderCompareView(siteAUrl, siteAGrade, siteAResults, siteBUrl, siteBGrade, siteBResults);
}

/**
 * Render side-by-side compare grade cards + diffs.
 */
function renderCompareView(aUrl, aGrade, aResults, bUrl, bGrade, bResults) {
  var html = '';
  html += '<div class="compare-side">';
  html += '  <div class="compare-host">' + escapeHtml(getHostname(aUrl)) + '</div>';
  html += '  <div class="compare-badge" style="background:' + escapeHtml(gradeColor(aGrade.grade)) + ';">' + escapeHtml(aGrade.grade) + '</div>';
  html += '  <div class="compare-score">' + escapeHtml(aGrade.percentage + '%') + '</div>';
  html += '  <div class="compare-issues">' + escapeHtml(String(aGrade.criticalIssues)) + ' critical</div>';
  html += '</div>';
  html += '<div class="compare-vs">vs</div>';
  html += '<div class="compare-side">';
  html += '  <div class="compare-host">' + escapeHtml(getHostname(bUrl)) + '</div>';
  html += '  <div class="compare-badge" style="background:' + escapeHtml(gradeColor(bGrade.grade)) + ';">' + escapeHtml(bGrade.grade) + '</div>';
  html += '  <div class="compare-score">' + escapeHtml(bGrade.percentage + '%') + '</div>';
  html += '  <div class="compare-issues">' + escapeHtml(String(bGrade.criticalIssues)) + ' critical</div>';
  html += '</div>';
  compareGrid.innerHTML = html;

  // Build per-header diff table
  var diffHtml = '<table class="diff-table"><thead><tr><th>Header</th><th>' + escapeHtml(getHostname(aUrl)) + '</th><th>' + escapeHtml(getHostname(bUrl)) + '</th></tr></thead><tbody>';
  for (var i = 0; i < aResults.length; i++) {
    var a = aResults[i];
    var b = bResults[i];
    var differ = a.status !== b.status || (a.value || '') !== (b.value || '');
    diffHtml += '<tr class="' + (differ ? 'diff-row' : '') + '">';
    diffHtml += '  <td class="diff-name">' + escapeHtml(a.name) + '</td>';
    diffHtml += '  <td>' + renderDiffCell(a) + '</td>';
    diffHtml += '  <td>' + renderDiffCell(b) + '</td>';
    diffHtml += '</tr>';
  }
  diffHtml += '</tbody></table>';
  compareDiffs.innerHTML = diffHtml;
}

/**
 * Render a single compare cell (status dot + short value).
 */
function renderDiffCell(r) {
  var label = r.status === 'good' ? 'Pass' : (r.status === 'weak' ? 'Weak' : 'Missing');
  return '<span class="status-dot ' + escapeHtml(r.status) + '"></span>' +
    '<span class="diff-label diff-' + escapeHtml(r.status) + '">' + escapeHtml(label) + '</span>';
}

/* ================= Share image ================= */

/**
 * Open the share view and render the current grade card as a PNG canvas.
 */
function openShareView() {
  if (!currentResults || !currentGradeInfo) return;
  switchView('share');
  renderShareCanvas();
}

/**
 * Paint the share canvas: dark gradient bg + grade badge + hostname +
 * critical/important/optional counts + missing headers list.
 */
function renderShareCanvas() {
  var ctx = shareCanvas.getContext('2d');
  var W = shareCanvas.width;
  var H = shareCanvas.height;

  // Background gradient
  var bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1e1e2e');
  bg.addColorStop(1, '#11111b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Title strip
  ctx.fillStyle = '#a6e3a1';
  ctx.font = '600 18px -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText('Security Headers', 40, 34);

  ctx.fillStyle = '#6c7086';
  ctx.font = '500 13px -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.fillText('Security Grade Report', 40, 58);

  // Grade badge (big rounded square on the left)
  var badgeX = 40;
  var badgeY = 100;
  var badgeSize = 160;
  roundRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 20);
  ctx.fillStyle = gradeColor(currentGradeInfo.grade);
  ctx.fill();
  ctx.fillStyle = '#1e1e2e';
  ctx.font = '800 80px -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(currentGradeInfo.grade, badgeX + badgeSize / 2, badgeY + badgeSize / 2 + 4);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Hostname + score
  var infoX = badgeX + badgeSize + 30;
  ctx.fillStyle = '#cdd6f4';
  ctx.font = '700 26px -apple-system, Segoe UI, Roboto, sans-serif';
  var host = getHostname(currentUrl) || currentUrl;
  ctx.fillText(truncate(host, 28), infoX, 110);

  ctx.fillStyle = '#bac2de';
  ctx.font = '600 16px -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.fillText(currentGradeInfo.percentage + '% - ' + currentGradeInfo.score + '/' + currentGradeInfo.maxScore + ' pts', infoX, 148);

  // Severity pills
  var pillY = 180;
  drawPill(ctx, infoX, pillY, 'Critical ' + currentGradeInfo.criticalIssues, '#f38ba8');
  drawPill(ctx, infoX + 140, pillY, 'Important ' + currentGradeInfo.importantIssues, '#f9e2af');
  drawPill(ctx, infoX + 300, pillY, 'Optional ' + currentGradeInfo.optionalIssues, '#94e2d5');

  // Missing/weak list
  ctx.fillStyle = '#6c7086';
  ctx.font = '600 12px -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.fillText('ISSUES FOUND', 40, 290);

  var listY = 312;
  var listed = 0;
  currentResults.forEach(function (r) {
    if (r.deprecated) return;
    if (r.status === 'good') return;
    if (listed >= 5) return;
    var color = r.status === 'missing' ? '#f38ba8' : '#f9e2af';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(48, listY + 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cdd6f4';
    ctx.font = '500 13px -apple-system, Segoe UI, Roboto, sans-serif';
    var label = r.name + '  -  ' + (r.status === 'missing' ? 'Missing' : 'Weak');
    ctx.fillText(label, 62, listY);
    listY += 22;
    listed++;
  });

  if (listed === 0) {
    ctx.fillStyle = '#a6e3a1';
    ctx.font = '500 13px -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('No issues detected.', 48, listY);
  }

  // Footer
  ctx.fillStyle = '#45475a';
  ctx.font = '500 11px -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.fillText('Scanned with the Security Headers Chrome extension', 40, H - 28);

  shareHint.textContent = '';
}

/** Draw a rounded pill with a label. */
function drawPill(ctx, x, y, text, color) {
  ctx.font = '700 12px -apple-system, Segoe UI, Roboto, sans-serif';
  var padX = 10;
  var w = ctx.measureText(text).width + padX * 2;
  var h = 24;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = hexWithAlpha(color, 0.18);
  ctx.fill();
  ctx.strokeStyle = hexWithAlpha(color, 0.4);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + h / 2 + 1);
  ctx.textBaseline = 'top';
}

/** Create an RGBA color string from a #rrggbb color and alpha. */
function hexWithAlpha(hex, alpha) {
  var h = hex.replace('#', '');
  var r = parseInt(h.substring(0, 2), 16);
  var g = parseInt(h.substring(2, 4), 16);
  var b = parseInt(h.substring(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

/** Rounded-rectangle path helper. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Truncate text with ellipsis. */
function truncate(text, max) {
  return text.length > max ? text.substring(0, max - 1) + '...' : text;
}

/**
 * Copy the share canvas image to clipboard (PNG).
 */
function copyShareImage() {
  shareCanvas.toBlob(function (blob) {
    if (!blob) {
      shareHint.textContent = 'Could not generate image.';
      return;
    }
    try {
      // ClipboardItem is available in modern Chrome
      var item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]).then(function () {
        shareHint.textContent = 'Image copied to clipboard.';
      }).catch(function (err) {
        shareHint.textContent = 'Copy failed: ' + err.message;
      });
    } catch (err) {
      shareHint.textContent = 'Copy not supported in this browser. Use Download instead.';
    }
  }, 'image/png');
}

/**
 * Download the share canvas image as PNG.
 */
function downloadShareImage() {
  var dataUrl = shareCanvas.toDataURL('image/png');
  var a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'security-headers-' + (getHostname(currentUrl) || 'report') + '.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  shareHint.textContent = 'Downloaded.';
}
