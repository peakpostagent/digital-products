/**
 * Security Headers — shared utility functions.
 */

/**
 * Escape HTML special characters to prevent XSS when inserting
 * dynamic content into the DOM via innerHTML.
 * @param {string} str - raw string
 * @returns {string} escaped string safe for innerHTML
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Get the hostname from a URL string.
 * @param {string} url
 * @returns {string} hostname or empty string
 */
function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Get a short date string (YYYY-MM-DD) from a timestamp.
 * @param {number} ts - Unix timestamp in milliseconds
 * @returns {string} formatted date
 */
function formatDate(ts) {
  var d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Get a short time string from a timestamp.
 * @param {number} ts - Unix timestamp in milliseconds
 * @returns {string} formatted time
 */
function formatTime(ts) {
  var d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Normalize a user-entered URL. Adds https:// if no protocol is present
 * and returns null if the URL is unusable.
 * @param {string} input - raw user-provided URL
 * @returns {string|null}
 */
function normalizeUrl(input) {
  if (!input) return null;
  var trimmed = String(input).trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  try {
    var u = new URL(trimmed);
    if (!u.hostname) return null;
    return u.toString();
  } catch (e) {
    return null;
  }
}

/**
 * Escape a single CSV cell value. Wraps in quotes if it contains a
 * special character and doubles any embedded quotes.
 * @param {*} value
 * @returns {string}
 */
function csvCell(value) {
  var s = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Convert a 2D array of rows into a CSV string.
 * @param {Array<Array>} rows
 * @returns {string}
 */
function toCsv(rows) {
  return rows.map(function (row) {
    return row.map(csvCell).join(',');
  }).join('\r\n');
}

/**
 * Trigger a file download from a string payload using a temporary <a> element.
 * Works in the extension popup context.
 * @param {string} filename
 * @param {string} content
 * @param {string} [mime='text/plain']
 */
function downloadFile(filename, content, mime) {
  var blob = new Blob([content], { type: mime || 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}
