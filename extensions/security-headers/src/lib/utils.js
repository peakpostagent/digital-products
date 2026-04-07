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
