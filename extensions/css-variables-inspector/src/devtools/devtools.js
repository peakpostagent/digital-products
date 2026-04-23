/**
 * devtools.js
 * Creates a sidebar pane in the Elements panel for inspecting CSS variables.
 * This script runs once when DevTools opens for a tab.
 */

/* Create a sidebar pane in the Elements panel */
chrome.devtools.panels.elements.createSidebarPane(
  'CSS Variables',
  function (sidebar) {
    /* Load the panel page into the sidebar */
    sidebar.setPage('panel/panel.html');
    /* Sidebar registered — panel owns the rest from here. */
  }
);
