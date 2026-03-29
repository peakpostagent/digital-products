/**
 * API Rate Limiter — Background Service Worker
 *
 * Stores rate-limit rules and request logs. Communicates with
 * the content script (which does the actual interception) and
 * the popup (which manages rules and displays stats).
 */

/* ── Constants ──────────────────────────────────────────────────── */

/** Storage key for the rules array */
const RULES_KEY = 'rate_limiter_rules';

/** Storage key for the request log */
const LOG_KEY = 'rate_limiter_log';

/** Storage key for per-rule request counts (keyed by rule id) */
const COUNTS_KEY = 'rate_limiter_counts';

/** Max log entries kept */
const MAX_LOG_ENTRIES = 500;

/* ── Badge styling ──────────────────────────────────────────────── */

chrome.action.setBadgeBackgroundColor({ color: '#E53935' });

/* ── Message handler ────────────────────────────────────────────── */

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {

  /* --- Content script asks for current rules --- */
  if (msg.type === 'get_rules') {
    getRules().then(function (rules) {
      sendResponse({ rules: rules });
    });
    return true;
  }

  /* --- Content script reports a request event --- */
  if (msg.type === 'request_event') {
    handleRequestEvent(msg, sender.tab ? sender.tab.id : null);
    sendResponse({ ok: true });
    return;
  }

  /* --- Popup: save rules --- */
  if (msg.type === 'save_rules') {
    saveRules(msg.rules).then(function () {
      /* Notify all content scripts about the rule change */
      broadcastRules(msg.rules);
      sendResponse({ ok: true });
    });
    return true;
  }

  /* --- Popup: get rules --- */
  if (msg.type === 'popup_get_rules') {
    getRules().then(function (rules) {
      sendResponse({ rules: rules });
    });
    return true;
  }

  /* --- Popup: get request log --- */
  if (msg.type === 'get_log') {
    getLog().then(function (log) {
      sendResponse({ log: log });
    });
    return true;
  }

  /* --- Popup: get counts --- */
  if (msg.type === 'get_counts') {
    getCounts().then(function (counts) {
      sendResponse({ counts: counts });
    });
    return true;
  }

  /* --- Popup: reset counters --- */
  if (msg.type === 'reset_counts') {
    resetCounts().then(function () {
      /* Notify content scripts to reset their local counts */
      broadcastResetCounts();
      sendResponse({ ok: true });
    });
    return true;
  }

  /* --- Popup: clear log --- */
  if (msg.type === 'clear_log') {
    clearLog().then(function () {
      sendResponse({ ok: true });
    });
    return true;
  }

  /* --- Popup: import rules --- */
  if (msg.type === 'import_rules') {
    saveRules(msg.rules).then(function () {
      broadcastRules(msg.rules);
      sendResponse({ ok: true });
    });
    return true;
  }
});

/* ── Core functions ─────────────────────────────────────────────── */

/**
 * Get all saved rules.
 */
async function getRules() {
  var data = await chrome.storage.local.get(RULES_KEY);
  return data[RULES_KEY] || [];
}

/**
 * Save rules to storage.
 */
async function saveRules(rules) {
  await chrome.storage.local.set({ [RULES_KEY]: rules });
}

/**
 * Get the request log.
 */
async function getLog() {
  var data = await chrome.storage.local.get(LOG_KEY);
  return data[LOG_KEY] || [];
}

/**
 * Clear the request log.
 */
async function clearLog() {
  await chrome.storage.local.remove(LOG_KEY);
}

/**
 * Get request counts per rule.
 */
async function getCounts() {
  var data = await chrome.storage.local.get(COUNTS_KEY);
  return data[COUNTS_KEY] || {};
}

/**
 * Reset all request counts.
 */
async function resetCounts() {
  await chrome.storage.local.remove(COUNTS_KEY);
}

/**
 * Handle an incoming request event from a content script.
 * Updates counts and appends to the log.
 */
async function handleRequestEvent(msg, tabId) {
  /* Update counts */
  var countsData = await chrome.storage.local.get(COUNTS_KEY);
  var counts = countsData[COUNTS_KEY] || {};

  if (msg.ruleId) {
    if (!counts[msg.ruleId]) {
      counts[msg.ruleId] = { total: 0, throttled: 0 };
    }
    counts[msg.ruleId].total++;
    if (msg.throttled) {
      counts[msg.ruleId].throttled++;
    }
    await chrome.storage.local.set({ [COUNTS_KEY]: counts });
  }

  /* Append to log */
  var logData = await chrome.storage.local.get(LOG_KEY);
  var log = logData[LOG_KEY] || [];

  log.push({
    url: msg.url,
    method: msg.method || 'GET',
    ruleId: msg.ruleId,
    rulePattern: msg.rulePattern || '',
    throttled: msg.throttled,
    statusCode: msg.statusCode || 200,
    timestamp: msg.timestamp || Date.now(),
    tabId: tabId
  });

  /* Prune if over the limit */
  if (log.length > MAX_LOG_ENTRIES) {
    log.splice(0, log.length - MAX_LOG_ENTRIES);
  }

  await chrome.storage.local.set({ [LOG_KEY]: log });

  /* Update badge with throttled count */
  if (tabId) {
    var throttledCount = log.filter(function (entry) {
      return entry.throttled && entry.tabId === tabId;
    }).length;
    updateBadge(tabId, throttledCount);
  }
}

/**
 * Update the extension badge for a specific tab.
 */
function updateBadge(tabId, count) {
  if (count > 0) {
    chrome.action.setBadgeText({
      text: String(count > 99 ? '99+' : count),
      tabId: tabId
    });
  } else {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
}

/**
 * Broadcast updated rules to all tabs' content scripts.
 */
async function broadcastRules(rules) {
  try {
    var tabs = await chrome.tabs.query({});
    tabs.forEach(function (tab) {
      try {
        chrome.tabs.sendMessage(tab.id, {
          type: 'rules_updated',
          rules: rules
        });
      } catch (_e) { /* tab may not have content script */ }
    });
  } catch (_e) { /* silent */ }
}

/**
 * Broadcast a reset-counts message to all tabs.
 */
async function broadcastResetCounts() {
  try {
    var tabs = await chrome.tabs.query({});
    tabs.forEach(function (tab) {
      try {
        chrome.tabs.sendMessage(tab.id, { type: 'reset_counts' });
      } catch (_e) { /* silent */ }
    });
  } catch (_e) { /* silent */ }
}

/* ── Tab cleanup ────────────────────────────────────────────────── */

/**
 * When a tab is closed, remove its log entries.
 */
chrome.tabs.onRemoved.addListener(async function (tabId) {
  var logData = await chrome.storage.local.get(LOG_KEY);
  var log = logData[LOG_KEY] || [];
  var filtered = log.filter(function (entry) {
    return entry.tabId !== tabId;
  });
  await chrome.storage.local.set({ [LOG_KEY]: filtered });
});
