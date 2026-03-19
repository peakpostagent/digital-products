/**
 * devtools.js
 * Creates the "API Echo" panel inside Chrome DevTools.
 * This script runs once when DevTools opens for a tab.
 */

chrome.devtools.panels.create(
  'API Echo',            // Panel title
  'icons/icon16.png',   // Icon path (relative to extension root)
  'panel/panel.html',   // HTML page for the panel
  function (panel) {
    // Panel created successfully
    console.log('API Echo panel created');
  }
);
