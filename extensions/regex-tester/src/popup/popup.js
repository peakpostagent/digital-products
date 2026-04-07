/**
 * Regex Tester - Popup Logic
 * Real-time regex testing with match highlighting, replace mode,
 * quick reference patterns, and saved pattern management.
 * All data stored in chrome.storage.local.
 */

/* ===== DOM References ===== */
const regexInput      = document.getElementById('regex-input');
const flagToggles     = document.getElementById('flag-toggles');
const regexError      = document.getElementById('regex-error');
const matchCount      = document.getElementById('match-count');
const testString      = document.getElementById('test-string');
const highlightLayer  = document.getElementById('highlight-layer');
const resultsPanel    = document.getElementById('results-panel');
const btnCopyMatches  = document.getElementById('btn-copy-matches');
const btnCopyRegex    = document.getElementById('btn-copy-regex');
const btnSavePattern  = document.getElementById('btn-save-pattern');
const replaceTestStr  = document.getElementById('replace-test-string');
const replaceInput    = document.getElementById('replace-input');
const replaceResult   = document.getElementById('replace-result');
const btnCopyReplaced = document.getElementById('btn-copy-replaced');
const referenceList   = document.getElementById('reference-list');
const savedList       = document.getElementById('saved-list');
const savedEmpty      = document.getElementById('saved-empty');
const saveForm        = document.getElementById('save-form');
const saveLabel       = document.getElementById('save-label');
const btnConfirmSave  = document.getElementById('btn-confirm-save');
const btnCancelSave   = document.getElementById('btn-cancel-save');
const toast           = document.getElementById('toast');

/* ===== State ===== */
let activeFlags = new Set(['g']);
let savedPatterns = [];
let currentMatches = [];

/* ===== Quick Reference Patterns ===== */
const REFERENCE_PATTERNS = [
  { label: 'Email address',     pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { label: 'URL (http/https)',  pattern: 'https?://[\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=%]+' },
  { label: 'Phone (US)',        pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}' },
  { label: 'IPv4 address',      pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { label: 'IPv6 address',      pattern: '(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}' },
  { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])' },
  { label: 'Date (MM/DD/YYYY)', pattern: '(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\\d|3[01])/\\d{4}' },
  { label: 'Time (HH:MM:SS)',   pattern: '(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d' },
  { label: 'Hex color',         pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b' },
  { label: 'HTML tag',          pattern: '</?[a-zA-Z][a-zA-Z0-9]*(?:\\s[^>]*)?' + '>' },
  { label: 'Integer',           pattern: '-?\\d+' },
  { label: 'Decimal number',    pattern: '-?\\d+\\.\\d+' },
  { label: 'Username (3-16)',   pattern: '[a-zA-Z0-9_-]{3,16}' },
  { label: 'ZIP code (US)',     pattern: '\\b\\d{5}(?:-\\d{4})?\\b' },
  { label: 'Credit card',       pattern: '\\b(?:\\d[ -]*?){13,19}\\b' },
  { label: 'SSN (US)',          pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b' },
  { label: 'MAC address',       pattern: '(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}' },
  { label: 'Domain name',       pattern: '(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}' },
  { label: 'File extension',    pattern: '\\.[a-zA-Z0-9]{1,10}$' },
  { label: 'Whitespace',        pattern: '\\s+' },
];

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSavedPatterns();
  await loadLastSession();
  renderReference();
  renderSaved();
  bindEvents();
  runTest();
}

/* ===== Storage Helpers ===== */

/** Load saved patterns from chrome.storage.local */
async function loadSavedPatterns() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ savedPatterns: [] }, (result) => {
      savedPatterns = result.savedPatterns;
      resolve();
    });
  });
}

/** Save patterns to chrome.storage.local and update badge */
async function savePatternsToStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ savedPatterns }, () => {
      updateBadge();
      resolve();
    });
  });
}

/** Load last session state (pattern, flags, test string) */
async function loadLastSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get({
      lastRegex: '',
      lastFlags: 'g',
      lastTestString: '',
      lastReplacement: ''
    }, (result) => {
      regexInput.value = result.lastRegex;
      replaceInput.value = result.lastReplacement;
      testString.value = result.lastTestString;
      replaceTestStr.value = result.lastTestString;

      // Restore flags
      activeFlags = new Set(result.lastFlags.split(''));
      updateFlagButtons();
      resolve();
    });
  });
}

/** Persist current session state for next popup open */
function saveSession() {
  const flags = Array.from(activeFlags).join('');
  chrome.storage.local.set({
    lastRegex: regexInput.value,
    lastFlags: flags,
    lastTestString: testString.value,
    lastReplacement: replaceInput.value
  });
}

/** Tell the background service worker to update the badge count */
function updateBadge() {
  chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', count: savedPatterns.length });
}

/* ===== Event Bindings ===== */

function bindEvents() {
  // Real-time testing on input
  regexInput.addEventListener('input', onInputChange);
  testString.addEventListener('input', onInputChange);
  testString.addEventListener('scroll', syncHighlightScroll);

  // Replace mode inputs
  replaceTestStr.addEventListener('input', onReplaceChange);
  replaceInput.addEventListener('input', onReplaceChange);

  // Flag toggle buttons
  flagToggles.addEventListener('click', (e) => {
    const btn = e.target.closest('.flag-btn');
    if (!btn) return;
    const flag = btn.dataset.flag;
    if (activeFlags.has(flag)) {
      activeFlags.delete(flag);
    } else {
      activeFlags.add(flag);
    }
    updateFlagButtons();
    onInputChange();
  });

  // Mode tabs
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  // Copy buttons
  btnCopyRegex.addEventListener('click', copyRegex);
  btnCopyMatches.addEventListener('click', copyMatches);
  btnCopyReplaced.addEventListener('click', copyReplaced);

  // Save pattern
  btnSavePattern.addEventListener('click', openSaveForm);
  btnConfirmSave.addEventListener('click', confirmSave);
  btnCancelSave.addEventListener('click', closeSaveForm);
}

/* ===== Mode Switching ===== */

/** Switch between Match, Replace, Reference, and Saved tabs */
function switchMode(mode) {
  // Update tab active states
  document.querySelectorAll('.mode-tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.mode === mode);
  });

  // Show/hide panels
  document.getElementById('panel-match').hidden    = mode !== 'match';
  document.getElementById('panel-replace').hidden   = mode !== 'replace';
  document.getElementById('panel-reference').hidden = mode !== 'reference';
  document.getElementById('panel-saved').hidden     = mode !== 'saved';

  // Sync test string between match and replace
  if (mode === 'replace') {
    replaceTestStr.value = testString.value;
    onReplaceChange();
  } else if (mode === 'match') {
    testString.value = replaceTestStr.value || testString.value;
    runTest();
  }
}

/* ===== Core Regex Testing ===== */

/** Called on every input change — rebuild regex and re-run test */
function onInputChange() {
  saveSession();
  runTest();
}

/** Build a RegExp from user input and run it against the test string */
function runTest() {
  const pattern = regexInput.value;
  const text = testString.value;
  const flags = getFlags();

  // Clear previous state
  currentMatches = [];
  regexError.hidden = true;
  highlightLayer.innerHTML = '';

  // Empty pattern — show default state
  if (!pattern) {
    matchCount.textContent = '0 matches';
    resultsPanel.innerHTML = '<p class="results-empty">No matches yet.</p>';
    highlightLayer.innerHTML = escapeHtml(text);
    return;
  }

  // Try building the regex
  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (err) {
    regexError.textContent = friendlyError(err.message);
    regexError.hidden = false;
    matchCount.textContent = 'Error';
    resultsPanel.innerHTML = '<p class="results-empty">Fix the regex error above.</p>';
    highlightLayer.innerHTML = escapeHtml(text);
    return;
  }

  // Guard against zero-length match infinite loops
  if (!text) {
    matchCount.textContent = '0 matches';
    resultsPanel.innerHTML = '<p class="results-empty">Enter a test string.</p>';
    return;
  }

  // Find all matches
  const matches = findAllMatches(regex, text);
  currentMatches = matches;

  // Update match count badge
  matchCount.textContent = matches.length + ' match' + (matches.length !== 1 ? 'es' : '');

  // Render highlighted text
  highlightLayer.innerHTML = buildHighlightHtml(text, matches);

  // Render match results
  renderMatches(matches);
}

/** Find all matches with group captures. Returns array of match objects. */
function findAllMatches(regex, text) {
  const matches = [];
  const isGlobal = regex.global;
  const maxMatches = 500; // safety limit

  // Reset lastIndex for global regex
  regex.lastIndex = 0;

  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      value: match[0],
      index: match.index,
      length: match[0].length,
      groups: match.slice(1),
      namedGroups: match.groups || null
    });

    // Prevent infinite loop on zero-length matches
    if (match[0].length === 0) {
      regex.lastIndex++;
    }

    // Stop after first match if not global
    if (!isGlobal) break;

    // Safety cap
    if (matches.length >= maxMatches) break;
  }

  return matches;
}

/** Build HTML with highlighted match spans */
function buildHighlightHtml(text, matches) {
  if (matches.length === 0) return escapeHtml(text);

  let result = '';
  let lastEnd = 0;

  for (const m of matches) {
    // Text before match
    if (m.index > lastEnd) {
      result += escapeHtml(text.slice(lastEnd, m.index));
    }
    // The match itself
    result += '<span class="match">' + escapeHtml(text.slice(m.index, m.index + m.length)) + '</span>';
    lastEnd = m.index + m.length;
  }

  // Remaining text after last match
  if (lastEnd < text.length) {
    result += escapeHtml(text.slice(lastEnd));
  }

  return result;
}

/** Render match results in the results panel */
function renderMatches(matches) {
  if (matches.length === 0) {
    resultsPanel.innerHTML = '<p class="results-empty">No matches found.</p>';
    return;
  }

  let html = '';
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    html += '<div class="match-item">';
    html += '<span class="match-index">Match ' + (i + 1) + ' at index ' + m.index + '</span>';
    html += '<span class="match-value">' + escapeHtml(m.value) + '</span>';

    // Show captured groups
    if (m.groups.length > 0) {
      for (let g = 0; g < m.groups.length; g++) {
        const gVal = m.groups[g];
        html += '<span class="match-group">';
        html += '<span class="match-group-label">Group ' + (g + 1) + ':</span> ';
        html += gVal !== undefined ? escapeHtml(gVal) : '<em style="color:#585b70">undefined</em>';
        html += '</span>';
      }
    }

    // Named groups
    if (m.namedGroups) {
      const entries = Object.entries(m.namedGroups);
      for (const [name, val] of entries) {
        html += '<span class="match-group">';
        html += '<span class="match-group-label">' + escapeHtml(name) + ':</span> ';
        html += val !== undefined ? escapeHtml(val) : '<em style="color:#585b70">undefined</em>';
        html += '</span>';
      }
    }

    html += '</div>';
  }

  resultsPanel.innerHTML = html;
}

/* ===== Replace Mode ===== */

/** Called on replace input changes */
function onReplaceChange() {
  const pattern = regexInput.value;
  const text = replaceTestStr.value;
  const replacement = replaceInput.value;
  const flags = getFlags();

  if (!pattern || !text) {
    replaceResult.textContent = text || 'Enter a pattern and test string above.';
    return;
  }

  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (err) {
    replaceResult.textContent = 'Invalid regex: ' + friendlyError(err.message);
    return;
  }

  try {
    const result = text.replace(regex, replacement);
    replaceResult.textContent = result;
  } catch (err) {
    replaceResult.textContent = 'Replace error: ' + err.message;
  }

  // Also save session
  saveSession();
}

/* ===== Quick Reference ===== */

/** Render the list of common regex patterns */
function renderReference() {
  let html = '';
  for (const ref of REFERENCE_PATTERNS) {
    html += '<div class="ref-item" data-pattern="' + escapeHtml(ref.pattern) + '">';
    html += '<span class="ref-label">' + escapeHtml(ref.label) + '</span>';
    html += '<span class="ref-pattern">' + escapeHtml(truncate(ref.pattern, 30)) + '</span>';
    html += '</div>';
  }
  referenceList.innerHTML = html;

  // Bind click handlers to load pattern
  referenceList.querySelectorAll('.ref-item').forEach((item) => {
    item.addEventListener('click', () => {
      regexInput.value = item.dataset.pattern;
      switchMode('match');
      onInputChange();
      showToast('Pattern loaded');
    });
  });
}

/* ===== Saved Patterns ===== */

/** Render the saved patterns list */
function renderSaved() {
  if (savedPatterns.length === 0) {
    savedList.innerHTML = '';
    savedEmpty.hidden = false;
    return;
  }

  savedEmpty.hidden = true;
  let html = '';

  for (const sp of savedPatterns) {
    html += '<div class="saved-item">';
    html += '<div class="saved-item__info" data-id="' + escapeHtml(sp.id) + '">';
    html += '<div class="saved-item__label">' + escapeHtml(sp.label) + '</div>';
    html += '<div class="saved-item__pattern">/' + escapeHtml(sp.pattern) + '/' +
            '<span class="saved-item__flags">' + escapeHtml(sp.flags) + '</span></div>';
    html += '</div>';
    html += '<button class="saved-item__delete" data-delete="' + escapeHtml(sp.id) +
            '" title="Delete">&times;</button>';
    html += '</div>';
  }

  savedList.innerHTML = html;

  // Bind click to load
  savedList.querySelectorAll('.saved-item__info').forEach((info) => {
    info.addEventListener('click', () => {
      const id = info.dataset.id;
      loadSavedPattern(id);
    });
  });

  // Bind delete
  savedList.querySelectorAll('.saved-item__delete').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delete;
      deleteSavedPattern(id);
    });
  });
}

/** Load a saved pattern into the regex input */
function loadSavedPattern(id) {
  const sp = savedPatterns.find((p) => p.id === id);
  if (!sp) return;

  regexInput.value = sp.pattern;
  activeFlags = new Set(sp.flags.split(''));
  updateFlagButtons();
  switchMode('match');
  onInputChange();
  showToast('Pattern loaded');
}

/** Delete a saved pattern */
async function deleteSavedPattern(id) {
  savedPatterns = savedPatterns.filter((p) => p.id !== id);
  await savePatternsToStorage();
  renderSaved();
  showToast('Pattern deleted');
}

/** Show the save form */
function openSaveForm() {
  if (!regexInput.value.trim()) {
    showToast('Enter a regex pattern first');
    return;
  }
  saveLabel.value = '';
  saveForm.hidden = false;
  saveLabel.focus();
}

/** Hide the save form */
function closeSaveForm() {
  saveForm.hidden = true;
}

/** Save the current pattern */
async function confirmSave() {
  const label = saveLabel.value.trim();
  if (!label) {
    showToast('Enter a label');
    saveLabel.focus();
    return;
  }

  const newPattern = {
    id: generateId(),
    label: label,
    pattern: regexInput.value,
    flags: getFlags(),
    createdAt: Date.now()
  };

  savedPatterns.unshift(newPattern);
  await savePatternsToStorage();
  renderSaved();
  closeSaveForm();
  showToast('Pattern saved');
}

/* ===== Copy Actions ===== */

/** Copy the current regex (with delimiters and flags) */
async function copyRegex() {
  const pattern = regexInput.value;
  if (!pattern) {
    showToast('No pattern to copy');
    return;
  }
  const full = '/' + pattern + '/' + getFlags();
  await copyToClipboard(full, 'Regex copied');
}

/** Copy all match values */
async function copyMatches() {
  if (currentMatches.length === 0) {
    showToast('No matches to copy');
    return;
  }
  const text = currentMatches.map((m) => m.value).join('\n');
  await copyToClipboard(text, 'Matches copied');
}

/** Copy the replace result */
async function copyReplaced() {
  const text = replaceResult.textContent;
  if (!text) {
    showToast('No result to copy');
    return;
  }
  await copyToClipboard(text, 'Result copied');
}

/** Generic clipboard copy with toast feedback */
async function copyToClipboard(text, successMsg) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg);
  } catch (err) {
    showToast('Copy failed');
  }
}

/* ===== Flag Helpers ===== */

/** Get current flags as a string */
function getFlags() {
  return Array.from(activeFlags).sort().join('');
}

/** Update flag button visual states */
function updateFlagButtons() {
  flagToggles.querySelectorAll('.flag-btn').forEach((btn) => {
    btn.classList.toggle('active', activeFlags.has(btn.dataset.flag));
  });
}

/* ===== Highlight Scroll Sync ===== */

/** Keep the highlight layer scrolled in sync with the textarea */
function syncHighlightScroll() {
  highlightLayer.scrollTop = testString.scrollTop;
  highlightLayer.scrollLeft = testString.scrollLeft;
}

/* ===== Utilities ===== */

/** Generate a unique ID */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/** Escape HTML special characters to prevent XSS */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Make regex error messages more user-friendly */
function friendlyError(msg) {
  return msg
    .replace('Invalid regular expression: ', '')
    .replace(/\/$/, '');
}

/** Truncate a string with ellipsis */
function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 1) + '\u2026';
}

/** Show a brief toast notification */
function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.hidden = true;
  }, 2000);
}
