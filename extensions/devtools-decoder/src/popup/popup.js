/**
 * DevTools Decoder — popup.js
 * Multi-format encoder/decoder popup for developers.
 * Uses vanilla JS, no frameworks. All user-facing strings are at the top.
 */

/* ===== User-facing strings ===== */
var STRINGS = {
  copied: 'Copied!',
  invalidBase64: 'Invalid Base64 string',
  invalidJwt: 'Invalid JWT format (expected 3 dot-separated parts)',
  invalidJwtHeader: 'Could not decode JWT header',
  invalidJwtPayload: 'Could not decode JWT payload',
  jwtExpired: 'Token EXPIRED',
  jwtValid: 'Token is valid',
  jwtNoExpiry: 'No expiry (exp) claim found',
  invalidJson: 'Invalid JSON',
  invalidTimestamp: 'Invalid Unix timestamp',
  emptyInput: 'Please enter some text',
  autoDetectBase64: 'Detected Base64-encoded text',
  autoDetectJwt: 'Detected JWT token',
  autoDetectJson: 'Detected JSON',
  autoDetectUrl: 'Detected URL-encoded text',
  autoDetectTimestamp: 'Detected Unix timestamp'
};

/* ===== Utility: Escape HTML to prevent XSS ===== */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ===== Utility: Show a toast message ===== */
function showToast(message) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('toast--visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function () {
    toast.classList.remove('toast--visible');
    setTimeout(function () { toast.hidden = true; }, 200);
  }, 1500);
}

/* ===== Utility: Copy text to clipboard ===== */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function () {
    showToast(STRINGS.copied);
  });
}

/* ===== Utility: Syntax-highlight JSON string ===== */
function highlightJson(jsonStr) {
  /* Escape HTML first, then apply highlighting */
  var escaped = escapeHtml(jsonStr);
  return escaped.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")\s*:/g,
    '<span class="json-key">$1</span>:'
  ).replace(
    /:\s*("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*")/g,
    function (match, p1) {
      return ': <span class="json-string">' + p1 + '</span>';
    }
  ).replace(
    /:\s*(-?\d+\.?\d*([eE][+-]?\d+)?)/g,
    ': <span class="json-number">$1</span>'
  ).replace(
    /:\s*(true|false)/g,
    ': <span class="json-boolean">$1</span>'
  ).replace(
    /:\s*(null)/g,
    ': <span class="json-null">$1</span>'
  );
}

/* ===== Tab Switching ===== */
function initTabs() {
  var tabBar = document.getElementById('tab-bar');
  var tabs = tabBar.querySelectorAll('.tab-bar__tab');
  var panels = document.querySelectorAll('.panel');

  tabBar.addEventListener('click', function (e) {
    var btn = e.target.closest('.tab-bar__tab');
    if (!btn) return;

    var tabName = btn.getAttribute('data-tab');

    /* Update tab button styles */
    tabs.forEach(function (t) { t.classList.remove('tab-bar__tab--active'); });
    btn.classList.add('tab-bar__tab--active');

    /* Show the matching panel */
    panels.forEach(function (p) { p.classList.remove('panel--active'); });
    var target = document.getElementById('panel-' + tabName);
    if (target) target.classList.add('panel--active');

    /* Save last active tab */
    saveLastTab(tabName);
  });
}

/* ===== Persist last active tab ===== */
function saveLastTab(tabName) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ devtoolsDecoderLastTab: tabName });
  }
}

/* ===== Restore last active tab ===== */
function restoreLastTab() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get('devtoolsDecoderLastTab', function (data) {
      if (data.devtoolsDecoderLastTab) {
        var tab = document.querySelector('[data-tab="' + data.devtoolsDecoderLastTab + '"]');
        if (tab) tab.click();
      }
    });
  }
}

/* ===== Base64 encode/decode ===== */
function initBase64() {
  var input = document.getElementById('base64-input');
  var output = document.getElementById('base64-output');
  var copyBtn = document.getElementById('base64-copy');
  var lastResult = '';

  document.getElementById('base64-encode').addEventListener('click', function () {
    var text = input.value.trim();
    if (!text) return;
    try {
      lastResult = btoa(unescape(encodeURIComponent(text)));
      output.textContent = lastResult;
      output.classList.remove('panel__output--error');
      copyBtn.hidden = false;
    } catch (err) {
      output.textContent = STRINGS.invalidBase64;
      output.classList.add('panel__output--error');
      copyBtn.hidden = true;
    }
  });

  document.getElementById('base64-decode').addEventListener('click', function () {
    var text = input.value.trim();
    if (!text) return;
    try {
      lastResult = decodeURIComponent(escape(atob(text)));
      output.textContent = lastResult;
      output.classList.remove('panel__output--error');
      copyBtn.hidden = false;
    } catch (err) {
      output.textContent = STRINGS.invalidBase64;
      output.classList.add('panel__output--error');
      copyBtn.hidden = true;
    }
  });

  copyBtn.addEventListener('click', function () {
    copyToClipboard(lastResult);
  });
}

/* ===== JWT Decoder ===== */

/** Decode a base64url string (JWT segments use this encoding) */
function base64urlDecode(str) {
  /* Replace base64url chars with standard base64 */
  var base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  /* Pad to multiple of 4 */
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

function initJwt() {
  var input = document.getElementById('jwt-input');
  var headerSection = document.getElementById('jwt-header-section');
  var payloadSection = document.getElementById('jwt-payload-section');
  var expirySection = document.getElementById('jwt-expiry-section');
  var headerEl = document.getElementById('jwt-header');
  var payloadEl = document.getElementById('jwt-payload');
  var expiryEl = document.getElementById('jwt-expiry');
  var copyBtn = document.getElementById('jwt-copy');
  var lastPayload = '';

  document.getElementById('jwt-decode').addEventListener('click', function () {
    var text = input.value.trim();
    if (!text) return;

    var parts = text.split('.');
    if (parts.length !== 3) {
      headerSection.hidden = true;
      payloadSection.hidden = true;
      expirySection.hidden = true;
      copyBtn.hidden = true;
      headerEl.textContent = STRINGS.invalidJwt;
      headerEl.classList.add('panel__output--error');
      headerSection.hidden = false;
      return;
    }

    /* Decode header */
    var headerJson;
    try {
      headerJson = JSON.parse(base64urlDecode(parts[0]));
      var headerStr = JSON.stringify(headerJson, null, 2);
      headerEl.innerHTML = highlightJson(headerStr);
      headerEl.classList.remove('panel__output--error');
      headerSection.hidden = false;
    } catch (err) {
      headerEl.textContent = STRINGS.invalidJwtHeader;
      headerEl.classList.add('panel__output--error');
      headerSection.hidden = false;
      payloadSection.hidden = true;
      expirySection.hidden = true;
      copyBtn.hidden = true;
      return;
    }

    /* Decode payload */
    var payloadJson;
    try {
      payloadJson = JSON.parse(base64urlDecode(parts[1]));
      lastPayload = JSON.stringify(payloadJson, null, 2);
      payloadEl.innerHTML = highlightJson(lastPayload);
      payloadEl.classList.remove('panel__output--error');
      payloadSection.hidden = false;
      copyBtn.hidden = false;
    } catch (err) {
      payloadEl.textContent = STRINGS.invalidJwtPayload;
      payloadEl.classList.add('panel__output--error');
      payloadSection.hidden = false;
      expirySection.hidden = true;
      copyBtn.hidden = true;
      return;
    }

    /* Check expiry */
    if (payloadJson.exp) {
      var expDate = new Date(payloadJson.exp * 1000);
      var now = new Date();
      if (expDate < now) {
        expiryEl.className = 'jwt-expiry jwt-expiry--expired';
        expiryEl.textContent = STRINGS.jwtExpired + ' on ' + expDate.toLocaleString();
      } else {
        expiryEl.className = 'jwt-expiry jwt-expiry--valid';
        expiryEl.textContent = STRINGS.jwtValid + ' until ' + expDate.toLocaleString();
      }
    } else {
      expiryEl.className = 'jwt-expiry jwt-expiry--unknown';
      expiryEl.textContent = STRINGS.jwtNoExpiry;
    }
    expirySection.hidden = false;
  });

  copyBtn.addEventListener('click', function () {
    copyToClipboard(lastPayload);
  });
}

/* ===== URL Encode/Decode ===== */
function initUrl() {
  var input = document.getElementById('url-input');
  var output = document.getElementById('url-output');
  var copyBtn = document.getElementById('url-copy');
  var lastResult = '';

  document.getElementById('url-encode').addEventListener('click', function () {
    var text = input.value;
    if (!text) return;
    lastResult = encodeURIComponent(text);
    output.textContent = lastResult;
    output.classList.remove('panel__output--error');
    copyBtn.hidden = false;
  });

  document.getElementById('url-decode').addEventListener('click', function () {
    var text = input.value;
    if (!text) return;
    try {
      lastResult = decodeURIComponent(text);
      output.textContent = lastResult;
      output.classList.remove('panel__output--error');
      copyBtn.hidden = false;
    } catch (err) {
      output.textContent = 'Invalid URL-encoded string';
      output.classList.add('panel__output--error');
      copyBtn.hidden = true;
    }
  });

  copyBtn.addEventListener('click', function () {
    copyToClipboard(lastResult);
  });
}

/* ===== Unix Timestamp ===== */
function initTimestamp() {
  var unixInput = document.getElementById('ts-unix-input');
  var dateInput = document.getElementById('ts-date-input');
  var output = document.getElementById('ts-output');
  var copyBtn = document.getElementById('ts-copy');
  var lastResult = '';

  document.getElementById('ts-to-date').addEventListener('click', function () {
    var val = unixInput.value.trim();
    if (!val) return;

    var num = Number(val);
    if (isNaN(num)) {
      output.textContent = STRINGS.invalidTimestamp;
      output.classList.add('panel__output--error');
      copyBtn.hidden = true;
      return;
    }

    /* Auto-detect seconds vs milliseconds */
    var ms = num > 1e12 ? num : num * 1000;
    var date = new Date(ms);
    lastResult =
      'UTC:   ' + date.toUTCString() + '\n' +
      'Local: ' + date.toLocaleString() + '\n' +
      'ISO:   ' + date.toISOString();
    output.textContent = lastResult;
    output.classList.remove('panel__output--error');
    copyBtn.hidden = false;
  });

  document.getElementById('ts-to-unix').addEventListener('click', function () {
    var val = dateInput.value;
    if (!val) return;
    var date = new Date(val);
    var sec = Math.floor(date.getTime() / 1000);
    var ms = date.getTime();
    lastResult = 'Seconds:      ' + sec + '\nMilliseconds: ' + ms;
    output.textContent = lastResult;
    output.classList.remove('panel__output--error');
    copyBtn.hidden = false;
  });

  document.getElementById('ts-now').addEventListener('click', function () {
    var now = new Date();
    var sec = Math.floor(now.getTime() / 1000);
    unixInput.value = sec;
    dateInput.value = formatDatetimeLocal(now);
    lastResult =
      'Unix (s):  ' + sec + '\n' +
      'Unix (ms): ' + now.getTime() + '\n' +
      'UTC:       ' + now.toUTCString() + '\n' +
      'ISO:       ' + now.toISOString();
    output.textContent = lastResult;
    output.classList.remove('panel__output--error');
    copyBtn.hidden = false;
  });

  copyBtn.addEventListener('click', function () {
    copyToClipboard(lastResult);
  });
}

/** Format a Date for datetime-local input (YYYY-MM-DDTHH:MM) */
function formatDatetimeLocal(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  var h = String(date.getHours()).padStart(2, '0');
  var min = String(date.getMinutes()).padStart(2, '0');
  return y + '-' + m + '-' + d + 'T' + h + ':' + min;
}

/* ===== Hash Generator ===== */
function initHash() {
  var input = document.getElementById('hash-input');
  var results = document.getElementById('hash-results');

  document.getElementById('hash-generate').addEventListener('click', async function () {
    var text = input.value;
    if (!text) return;

    var encoder = new TextEncoder();
    var data = encoder.encode(text);

    /* Web Crypto API supports SHA-1, SHA-256, SHA-384, SHA-512 (not MD5) */
    var algos = ['SHA-256', 'SHA-1', 'SHA-384', 'SHA-512'];
    var ids = ['hash-sha256', 'hash-sha1', 'hash-sha384', 'hash-sha512'];

    for (var i = 0; i < algos.length; i++) {
      var hashBuffer = await crypto.subtle.digest(algos[i], data);
      var hashArray = Array.from(new Uint8Array(hashBuffer));
      var hashHex = hashArray.map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
      document.getElementById(ids[i]).textContent = hashHex;
    }

    results.hidden = false;
  });

  /* Copy buttons for individual hash rows */
  document.querySelectorAll('[data-copy-target]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-copy-target');
      var text = document.getElementById(targetId).textContent;
      copyToClipboard(text);
    });
  });
}

/* ===== JSON Formatter ===== */
function initJson() {
  var input = document.getElementById('json-input');
  var output = document.getElementById('json-output');
  var copyBtn = document.getElementById('json-copy');
  var lastResult = '';

  document.getElementById('json-format').addEventListener('click', function () {
    var text = input.value.trim();
    if (!text) return;
    try {
      var parsed = JSON.parse(text);
      lastResult = JSON.stringify(parsed, null, 2);
      output.innerHTML = highlightJson(lastResult);
      output.classList.remove('panel__output--error');
      copyBtn.hidden = false;
    } catch (err) {
      output.textContent = STRINGS.invalidJson + ': ' + err.message;
      output.classList.add('panel__output--error');
      copyBtn.hidden = true;
    }
  });

  document.getElementById('json-minify').addEventListener('click', function () {
    var text = input.value.trim();
    if (!text) return;
    try {
      var parsed = JSON.parse(text);
      lastResult = JSON.stringify(parsed);
      output.textContent = lastResult;
      output.classList.remove('panel__output--error');
      copyBtn.hidden = false;
    } catch (err) {
      output.textContent = STRINGS.invalidJson + ': ' + err.message;
      output.classList.add('panel__output--error');
      copyBtn.hidden = true;
    }
  });

  copyBtn.addEventListener('click', function () {
    copyToClipboard(lastResult);
  });
}

/* ===== Auto-detect Format ===== */
function initAutoDetect() {
  var allInputs = document.querySelectorAll('.panel__input');
  var banner = document.getElementById('auto-detect-banner');
  var bannerText = document.getElementById('auto-detect-text');
  var dismissBtn = document.getElementById('auto-detect-dismiss');

  dismissBtn.addEventListener('click', function () {
    banner.hidden = true;
  });

  /* Listen for paste on any visible input */
  allInputs.forEach(function (input) {
    input.addEventListener('paste', function (e) {
      /* Wait for paste to complete */
      setTimeout(function () {
        var text = input.value.trim();
        if (!text) return;
        detectAndSwitch(text);
      }, 50);
    });
  });
}

/** Try to auto-detect format and switch tabs */
function detectAndSwitch(text) {
  var banner = document.getElementById('auto-detect-banner');
  var bannerText = document.getElementById('auto-detect-text');

  /* JWT: starts with eyJ and has 3 dot-separated parts */
  if (/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(text)) {
    switchToTab('jwt');
    document.getElementById('jwt-input').value = text;
    bannerText.textContent = STRINGS.autoDetectJwt;
    banner.hidden = false;
    return;
  }

  /* JSON: starts with { or [ */
  if (/^[\[{]/.test(text)) {
    try {
      JSON.parse(text);
      switchToTab('json');
      document.getElementById('json-input').value = text;
      bannerText.textContent = STRINGS.autoDetectJson;
      banner.hidden = false;
      return;
    } catch (e) { /* not valid JSON, continue */ }
  }

  /* Unix timestamp: 10 or 13 digit number */
  if (/^\d{10,13}$/.test(text)) {
    switchToTab('timestamp');
    document.getElementById('ts-unix-input').value = text;
    bannerText.textContent = STRINGS.autoDetectTimestamp;
    banner.hidden = false;
    return;
  }

  /* URL-encoded: contains %XX patterns */
  if (/%[0-9A-Fa-f]{2}/.test(text)) {
    switchToTab('url');
    document.getElementById('url-input').value = text;
    bannerText.textContent = STRINGS.autoDetectUrl;
    banner.hidden = false;
    return;
  }

  /* Base64: only contains valid Base64 chars and is reasonably long */
  if (/^[A-Za-z0-9+/]+=*$/.test(text) && text.length >= 4) {
    try {
      atob(text);
      switchToTab('base64');
      document.getElementById('base64-input').value = text;
      bannerText.textContent = STRINGS.autoDetectBase64;
      banner.hidden = false;
      return;
    } catch (e) { /* not valid base64 */ }
  }
}

/** Programmatically switch to a tab */
function switchToTab(tabName) {
  var tab = document.querySelector('[data-tab="' + tabName + '"]');
  if (tab) tab.click();
}

/* ===== Initialize everything on DOM load ===== */
document.addEventListener('DOMContentLoaded', function () {
  initTabs();
  initBase64();
  initJwt();
  initUrl();
  initTimestamp();
  initHash();
  initJson();
  initAutoDetect();
  restoreLastTab();
});
