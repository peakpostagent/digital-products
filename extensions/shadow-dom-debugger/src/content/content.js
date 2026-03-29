/**
 * Shadow DOM Debugger — Content Script
 *
 * Detects all shadow DOM roots on the page, highlights them with
 * colored outlines, and provides an overlay sidebar to inspect their
 * internal structure. The extension's own UI lives inside a shadow
 * root to avoid breaking host page styles.
 */

/* ── State ──────────────────────────────────────────────────────── */

/** All discovered shadow host elements */
var shadowHosts = [];

/** Whether highlighting outlines are visible */
var highlightEnabled = false;

/** Whether the sidebar overlay is open */
var sidebarOpen = false;

/** The currently selected shadow host (for detail view) */
var selectedHost = null;

/** Reference to our own UI container (shadow root host) */
var uiHost = null;

/** Reference to the shadow root containing our UI */
var uiShadow = null;

/* ── Utilities ──────────────────────────────────────────────────── */

/**
 * Escape HTML entities to prevent XSS when using innerHTML.
 * CRITICAL: Every dynamic string must go through this.
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Generate a short tag description for an element.
 * e.g. "<my-component .class-name #id>"
 */
function describeElement(el) {
  var tag = el.tagName ? el.tagName.toLowerCase() : 'unknown';
  var id = el.id ? '#' + el.id : '';
  var cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).join('.')
    : '';
  return '<' + tag + id + cls + '>';
}

/**
 * Get the outer HTML of a shadow root's content, truncated.
 */
function getShadowHTML(shadowRoot, maxLen) {
  maxLen = maxLen || 5000;
  var html = '';
  var children = shadowRoot.childNodes;
  for (var i = 0; i < children.length; i++) {
    if (children[i].nodeType === Node.ELEMENT_NODE) {
      html += children[i].outerHTML;
    } else if (children[i].nodeType === Node.TEXT_NODE) {
      html += children[i].textContent;
    }
  }
  if (html.length > maxLen) {
    html = html.substring(0, maxLen) + '\n... (truncated)';
  }
  return html;
}

/* ── Shadow DOM Scanning ────────────────────────────────────────── */

/**
 * Walk the entire DOM tree (including inside shadow roots)
 * to find all elements that host a shadow root.
 */
function findAllShadowHosts(root) {
  var hosts = [];

  function walk(node) {
    /* Skip our own UI */
    if (node === uiHost) return;

    /* Check if this element has a shadow root */
    if (node.shadowRoot) {
      hosts.push(node);
      /* Also scan inside the shadow root for nested shadows */
      walk(node.shadowRoot);
    }

    /* Walk child elements */
    var children = node.children || node.childNodes;
    for (var i = 0; i < children.length; i++) {
      if (children[i].nodeType === Node.ELEMENT_NODE) {
        walk(children[i]);
      }
    }
  }

  walk(root);
  return hosts;
}

/**
 * Scan the page for shadow roots and update the count.
 */
function scanPage() {
  shadowHosts = findAllShadowHosts(document.documentElement);

  /* Notify background of the count for badge */
  try {
    chrome.runtime.sendMessage({
      type: 'shadow_count',
      count: shadowHosts.length
    });
  } catch (_e) { /* extension context invalidated */ }

  return shadowHosts;
}

/* ── Highlight Outlines ─────────────────────────────────────────── */

/** CSS class added to highlighted shadow hosts */
var HIGHLIGHT_CLASS = '__sdd_highlight__';

/** Style element we inject for highlights */
var highlightStyleEl = null;

/**
 * Inject or remove the highlight CSS into the page.
 */
function setHighlightsVisible(visible) {
  highlightEnabled = visible;

  if (visible) {
    /* Inject highlight style if not already present */
    if (!highlightStyleEl) {
      highlightStyleEl = document.createElement('style');
      highlightStyleEl.textContent =
        '.' + HIGHLIGHT_CLASS + ' {' +
        '  outline: 2px dashed #a855f7 !important;' +
        '  outline-offset: 2px !important;' +
        '  position: relative !important;' +
        '}' +
        '.' + HIGHLIGHT_CLASS + '::after {' +
        '  content: attr(data-sdd-label);' +
        '  position: absolute !important;' +
        '  top: -18px !important;' +
        '  left: 0 !important;' +
        '  background: #a855f7 !important;' +
        '  color: #fff !important;' +
        '  font-size: 10px !important;' +
        '  padding: 1px 6px !important;' +
        '  border-radius: 3px !important;' +
        '  z-index: 999999 !important;' +
        '  font-family: monospace !important;' +
        '  pointer-events: none !important;' +
        '  white-space: nowrap !important;' +
        '}';
      document.head.appendChild(highlightStyleEl);
    }

    /* Add class to all shadow hosts */
    shadowHosts.forEach(function (host) {
      host.classList.add(HIGHLIGHT_CLASS);
      host.setAttribute('data-sdd-label', describeElement(host));
    });
  } else {
    /* Remove class from all elements */
    var highlighted = document.querySelectorAll('.' + HIGHLIGHT_CLASS);
    highlighted.forEach(function (el) {
      el.classList.remove(HIGHLIGHT_CLASS);
      el.removeAttribute('data-sdd-label');
    });
  }
}

/* ── Shadow DOM Tree Rendering ──────────────────────────────────── */

/**
 * Build an HTML string representing the shadow DOM tree structure.
 * Shows host elements and their shadow children recursively.
 */
function buildTreeHTML(shadowRoot, depth) {
  depth = depth || 0;
  var indent = '  '.repeat(depth);
  var html = '';

  var children = shadowRoot.children;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    var tag = child.tagName.toLowerCase();
    var id = child.id ? ' id="' + escapeHtml(child.id) + '"' : '';
    var cls = child.className && typeof child.className === 'string' && child.className.trim()
      ? ' class="' + escapeHtml(child.className.trim()) + '"'
      : '';

    var hasChildren = child.children.length > 0 || child.shadowRoot;

    html += '<div class="sdd-tree-node" style="padding-left:' + (depth * 16) + 'px">';
    html += '<span class="sdd-tag">&lt;' + escapeHtml(tag) + escapeHtml(id) + escapeHtml(cls) + '&gt;</span>';

    if (child.shadowRoot) {
      html += ' <span class="sdd-shadow-badge">shadow-root</span>';
      html += buildTreeHTML(child.shadowRoot, depth + 1);
    } else if (hasChildren) {
      html += buildTreeHTML({ children: child.children }, depth + 1);
    }

    html += '</div>';
  }

  return html;
}

/* ── Overlay UI (inside its own Shadow DOM) ─────────────────────── */

/**
 * Create the extension's overlay UI inside a shadow root
 * so it does not interfere with the host page's styles.
 */
function createUI() {
  if (uiHost) return; /* already created */

  /* Create the host element */
  uiHost = document.createElement('div');
  uiHost.id = '__shadow_dom_debugger_ui__';
  uiHost.style.cssText = 'all:initial; position:fixed; top:0; right:0; z-index:2147483647; pointer-events:none;';
  document.body.appendChild(uiHost);

  /* Attach a closed shadow root for style isolation */
  uiShadow = uiHost.attachShadow({ mode: 'closed' });

  /* Inject styles into the shadow root */
  var style = document.createElement('style');
  style.textContent = getSidebarCSS();
  uiShadow.appendChild(style);

  /* Create sidebar container (hidden by default) */
  var sidebar = document.createElement('div');
  sidebar.id = 'sdd-sidebar';
  sidebar.className = 'sdd-sidebar sdd-hidden';
  uiShadow.appendChild(sidebar);
}

/**
 * Return the CSS for the sidebar overlay.
 */
function getSidebarCSS() {
  return [
    '* { margin:0; padding:0; box-sizing:border-box; }',
    '.sdd-sidebar {',
    '  position:fixed; top:0; right:0; width:380px; height:100vh;',
    '  background:#1e1e2e; color:#cdd6f4; font-family:"Segoe UI",sans-serif;',
    '  font-size:13px; border-left:1px solid #313244;',
    '  box-shadow:-4px 0 20px rgba(0,0,0,0.4);',
    '  display:flex; flex-direction:column; pointer-events:auto;',
    '  overflow:hidden; z-index:2147483647;',
    '  transition:transform 0.2s ease;',
    '}',
    '.sdd-hidden { transform:translateX(100%); pointer-events:none; }',
    '.sdd-header {',
    '  padding:12px 14px; background:#181825;',
    '  border-bottom:1px solid #313244; flex-shrink:0;',
    '  display:flex; align-items:center; justify-content:space-between;',
    '}',
    '.sdd-title { font-size:14px; font-weight:700; color:#c084fc; }',
    '.sdd-close-btn {',
    '  background:#313244; border:1px solid #45475a; color:#cdd6f4;',
    '  border-radius:6px; padding:4px 10px; cursor:pointer; font-size:13px;',
    '}',
    '.sdd-close-btn:hover { background:#45475a; }',
    '.sdd-tabs {',
    '  display:flex; border-bottom:1px solid #313244; flex-shrink:0;',
    '}',
    '.sdd-tab {',
    '  flex:1; padding:8px 12px; text-align:center; cursor:pointer;',
    '  color:#6c7086; font-size:12px; font-weight:600;',
    '  border-bottom:2px solid transparent; background:transparent; border-top:none; border-left:none; border-right:none;',
    '}',
    '.sdd-tab:hover { color:#a6adc8; }',
    '.sdd-tab.active { color:#c084fc; border-bottom-color:#c084fc; }',
    '.sdd-content {',
    '  flex:1; overflow-y:auto; padding:8px 0;',
    '}',
    '.sdd-content::-webkit-scrollbar { width:6px; }',
    '.sdd-content::-webkit-scrollbar-track { background:transparent; }',
    '.sdd-content::-webkit-scrollbar-thumb { background:#45475a; border-radius:3px; }',
    /* List view */
    '.sdd-host-item {',
    '  padding:8px 14px; border-bottom:1px solid #313244;',
    '  cursor:pointer; display:flex; align-items:center; gap:8px;',
    '}',
    '.sdd-host-item:hover { background:#313244; }',
    '.sdd-host-item.selected { background:rgba(192,132,252,0.1); border-left:3px solid #c084fc; }',
    '.sdd-host-tag {',
    '  font-family:"Cascadia Code","Fira Code",Consolas,monospace;',
    '  font-size:12px; color:#c084fc;',
    '}',
    '.sdd-host-mode {',
    '  font-size:10px; padding:1px 5px; border-radius:3px;',
    '  background:rgba(166,227,161,0.15); color:#a6e3a1;',
    '}',
    '.sdd-host-children {',
    '  font-size:10px; color:#585b70; margin-left:auto;',
    '}',
    /* Detail / tree view */
    '.sdd-detail { padding:12px 14px; }',
    '.sdd-detail-header {',
    '  display:flex; align-items:center; gap:8px; margin-bottom:12px;',
    '}',
    '.sdd-back-btn {',
    '  background:#313244; border:1px solid #45475a; color:#cdd6f4;',
    '  border-radius:6px; padding:4px 10px; cursor:pointer; font-size:12px;',
    '}',
    '.sdd-back-btn:hover { background:#45475a; }',
    '.sdd-detail-title {',
    '  font-family:monospace; font-size:13px; color:#c084fc; font-weight:600;',
    '}',
    '.sdd-section-label {',
    '  font-size:10px; font-weight:700; text-transform:uppercase;',
    '  color:#585b70; margin:12px 0 6px; letter-spacing:0.5px;',
    '}',
    '.sdd-tree-node { line-height:1.6; }',
    '.sdd-tag { color:#89b4fa; font-family:monospace; font-size:12px; }',
    '.sdd-shadow-badge {',
    '  font-size:9px; padding:1px 5px; border-radius:3px;',
    '  background:rgba(192,132,252,0.2); color:#c084fc; font-weight:600;',
    '}',
    '.sdd-html-block {',
    '  background:#11111b; border-radius:6px; padding:8px 10px;',
    '  font-family:monospace; font-size:11px; color:#a6adc8;',
    '  white-space:pre-wrap; word-break:break-all;',
    '  max-height:300px; overflow-y:auto; line-height:1.4;',
    '}',
    '.sdd-copy-btn {',
    '  background:#313244; border:1px solid #45475a; color:#cdd6f4;',
    '  border-radius:6px; padding:4px 12px; cursor:pointer;',
    '  font-size:11px; margin-top:8px;',
    '}',
    '.sdd-copy-btn:hover { background:#45475a; }',
    '.sdd-empty {',
    '  text-align:center; padding:40px 20px; color:#585b70;',
    '}',
    '.sdd-count-badge {',
    '  font-size:11px; padding:2px 8px; border-radius:10px;',
    '  background:rgba(192,132,252,0.2); color:#c084fc; font-weight:600;',
    '}',
    '.sdd-toast {',
    '  position:fixed; bottom:16px; left:50%; transform:translateX(-50%);',
    '  background:#a6e3a1; color:#1e1e2e; padding:6px 16px;',
    '  border-radius:6px; font-size:12px; font-weight:600;',
    '  opacity:0; transition:opacity 0.2s; pointer-events:none;',
    '}',
    '.sdd-toast.show { opacity:1; }'
  ].join('\n');
}

/**
 * Render the sidebar content: list of shadow hosts or detail view.
 */
function renderSidebar() {
  if (!uiShadow) return;
  var sidebar = uiShadow.getElementById('sdd-sidebar');
  if (!sidebar) return;

  var html = '';

  /* Header */
  html += '<div class="sdd-header">';
  html += '  <span class="sdd-title">Shadow DOM Debugger</span>';
  html += '  <div style="display:flex;gap:6px;align-items:center;">';
  html += '    <span class="sdd-count-badge">' + escapeHtml(String(shadowHosts.length)) + ' roots</span>';
  html += '    <button class="sdd-close-btn" id="sdd-close">&#10005;</button>';
  html += '  </div>';
  html += '</div>';

  if (selectedHost) {
    /* Detail view for a specific shadow host */
    html += renderDetailView(selectedHost);
  } else {
    /* Tab bar */
    html += '<div class="sdd-tabs">';
    html += '  <button class="sdd-tab active" id="sdd-tab-list">List</button>';
    html += '  <button class="sdd-tab" id="sdd-tab-tree">Full Tree</button>';
    html += '</div>';

    /* List view (default) */
    html += '<div class="sdd-content" id="sdd-list-view">';
    if (shadowHosts.length === 0) {
      html += '<div class="sdd-empty">No Shadow DOM roots found on this page.</div>';
    } else {
      shadowHosts.forEach(function (host, index) {
        var mode = host.shadowRoot.mode || 'open';
        var childCount = host.shadowRoot.children.length;
        html += '<div class="sdd-host-item" data-index="' + index + '">';
        html += '  <span class="sdd-host-tag">' + escapeHtml(describeElement(host)) + '</span>';
        html += '  <span class="sdd-host-mode">' + escapeHtml(mode) + '</span>';
        html += '  <span class="sdd-host-children">' + escapeHtml(String(childCount)) + ' children</span>';
        html += '</div>';
      });
    }
    html += '</div>';

    /* Tree view (hidden initially) */
    html += '<div class="sdd-content sdd-hidden" id="sdd-tree-view">';
    if (shadowHosts.length === 0) {
      html += '<div class="sdd-empty">No Shadow DOM roots found.</div>';
    } else {
      html += '<div style="padding:8px 14px;">';
      shadowHosts.forEach(function (host) {
        html += '<div class="sdd-tree-node">';
        html += '<span class="sdd-tag">' + escapeHtml(describeElement(host)) + '</span>';
        html += ' <span class="sdd-shadow-badge">shadow-root (' + escapeHtml(host.shadowRoot.mode || 'open') + ')</span>';
        html += buildTreeHTML(host.shadowRoot, 1);
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
  }

  /* Toast */
  html += '<div class="sdd-toast" id="sdd-toast"></div>';

  sidebar.innerHTML = html;

  /* Attach event listeners */
  attachSidebarEvents(sidebar);
}

/**
 * Render the detail view for a selected shadow host.
 */
function renderDetailView(host) {
  var html = '';
  var shadowRoot = host.shadowRoot;

  html += '<div class="sdd-content">';
  html += '<div class="sdd-detail">';

  /* Back button + title */
  html += '<div class="sdd-detail-header">';
  html += '  <button class="sdd-back-btn" id="sdd-back">&#8592; Back</button>';
  html += '  <span class="sdd-detail-title">' + escapeHtml(describeElement(host)) + '</span>';
  html += '</div>';

  /* Mode info */
  html += '<div class="sdd-section-label">Shadow Root Mode</div>';
  html += '<div><span class="sdd-host-mode">' + escapeHtml(shadowRoot.mode || 'open') + '</span></div>';

  /* Tree structure */
  html += '<div class="sdd-section-label">Tree Structure</div>';
  html += '<div style="padding:4px 0;">';
  html += buildTreeHTML(shadowRoot, 0);
  html += '</div>';

  /* Raw HTML */
  html += '<div class="sdd-section-label">Shadow DOM HTML</div>';
  html += '<div class="sdd-html-block" id="sdd-html-block">' + escapeHtml(getShadowHTML(shadowRoot)) + '</div>';
  html += '<button class="sdd-copy-btn" id="sdd-copy-html">Copy HTML to Clipboard</button>';

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Attach event listeners to sidebar elements.
 */
function attachSidebarEvents(sidebar) {
  /* Close button */
  var closeBtn = sidebar.querySelector('#sdd-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      toggleSidebar(false);
    });
  }

  /* Back button (detail view) */
  var backBtn = sidebar.querySelector('#sdd-back');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      selectedHost = null;
      renderSidebar();
    });
  }

  /* Copy HTML button */
  var copyBtn = sidebar.querySelector('#sdd-copy-html');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var htmlBlock = sidebar.querySelector('#sdd-html-block');
      if (htmlBlock) {
        navigator.clipboard.writeText(htmlBlock.textContent).then(function () {
          showSidebarToast('Copied to clipboard');
        });
      }
    });
  }

  /* Host item clicks (select a shadow host) */
  var hostItems = sidebar.querySelectorAll('.sdd-host-item');
  hostItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var index = parseInt(item.getAttribute('data-index'), 10);
      if (shadowHosts[index]) {
        selectedHost = shadowHosts[index];
        renderSidebar();

        /* Scroll the host element into view */
        selectedHost.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  /* Tab switching (List / Full Tree) */
  var tabList = sidebar.querySelector('#sdd-tab-list');
  var tabTree = sidebar.querySelector('#sdd-tab-tree');
  var listView = sidebar.querySelector('#sdd-list-view');
  var treeView = sidebar.querySelector('#sdd-tree-view');

  if (tabList && tabTree) {
    tabList.addEventListener('click', function () {
      tabList.classList.add('active');
      tabTree.classList.remove('active');
      if (listView) listView.classList.remove('sdd-hidden');
      if (treeView) treeView.classList.add('sdd-hidden');
    });
    tabTree.addEventListener('click', function () {
      tabTree.classList.add('active');
      tabList.classList.remove('active');
      if (treeView) treeView.classList.remove('sdd-hidden');
      if (listView) listView.classList.add('sdd-hidden');
    });
  }
}

/**
 * Show a brief toast inside the sidebar.
 */
function showSidebarToast(message) {
  if (!uiShadow) return;
  var toast = uiShadow.getElementById('sdd-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(function () {
    toast.classList.remove('show');
  }, 1500);
}

/**
 * Show or hide the sidebar overlay.
 */
function toggleSidebar(show) {
  if (!uiShadow) createUI();
  var sidebar = uiShadow.getElementById('sdd-sidebar');
  if (!sidebar) return;

  sidebarOpen = show;

  if (show) {
    scanPage();
    renderSidebar();
    sidebar.classList.remove('sdd-hidden');
  } else {
    sidebar.classList.add('sdd-hidden');
    selectedHost = null;
  }
}

/* ── Message Handling (from popup and background) ───────────────── */

chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {

  /* Toggle highlighting on/off */
  if (msg.type === 'toggle_highlight') {
    scanPage();
    setHighlightsVisible(msg.enabled);
    sendResponse({ ok: true, count: shadowHosts.length });
    return;
  }

  /* Toggle sidebar visibility */
  if (msg.type === 'toggle_sidebar') {
    createUI();
    toggleSidebar(msg.open);
    sendResponse({ ok: true });
    return;
  }

  /* Re-scan the page for shadow roots */
  if (msg.type === 'scan_page') {
    scanPage();
    sendResponse({ count: shadowHosts.length });
    return;
  }

  /* Get the current state */
  if (msg.type === 'get_state') {
    sendResponse({
      count: shadowHosts.length,
      highlightEnabled: highlightEnabled,
      sidebarOpen: sidebarOpen
    });
    return;
  }

  /* Copy all shadow DOM HTML to clipboard */
  if (msg.type === 'copy_all_html') {
    var allHtml = shadowHosts.map(function (host, i) {
      return '/* Shadow Root #' + (i + 1) + ': ' + describeElement(host) + ' */\n' +
        getShadowHTML(host.shadowRoot);
    }).join('\n\n');

    navigator.clipboard.writeText(allHtml).then(function () {
      sendResponse({ ok: true });
    });
    return true; /* async */
  }

  /* Toggle shadow DOM visibility (hide/show shadow content) */
  if (msg.type === 'toggle_shadow_visibility') {
    toggleShadowVisibility(msg.hidden);
    sendResponse({ ok: true });
    return;
  }
});

/* ── Shadow Visibility Toggle ───────────────────────────────────── */

/** Style element for hiding shadow content */
var visibilityStyleEl = null;

/**
 * Toggle the visibility of shadow DOM content.
 * When hidden, shadow host elements show a placeholder instead.
 */
function toggleShadowVisibility(hidden) {
  if (hidden) {
    if (!visibilityStyleEl) {
      visibilityStyleEl = document.createElement('style');
      /* We can't style inside shadow roots from outside, but we can
         collapse the host elements themselves */
      var selectors = shadowHosts.map(function (host) {
        var tag = host.tagName.toLowerCase();
        var id = host.id ? '#' + host.id : '';
        return tag + id;
      });
      if (selectors.length > 0) {
        visibilityStyleEl.textContent =
          selectors.join(',\n') + ' {\n' +
          '  opacity: 0.15 !important;\n' +
          '  outline: 2px dashed #ef4444 !important;\n' +
          '  outline-offset: 2px !important;\n' +
          '}';
      }
      document.head.appendChild(visibilityStyleEl);
    }
  } else {
    if (visibilityStyleEl) {
      visibilityStyleEl.remove();
      visibilityStyleEl = null;
    }
  }
}

/* ── Auto-scan on load ──────────────────────────────────────────── */

/**
 * Run initial scan when the page loads and report count to background.
 */
function init() {
  scanPage();

  /* Load saved highlight state */
  try {
    chrome.storage.local.get('sdd_highlight', function (data) {
      if (data.sdd_highlight) {
        setHighlightsVisible(true);
      }
    });
  } catch (_e) { /* ignore */ }
}

/* Run init */
init();

/* Watch for new elements being added (e.g. lazy-loaded components) */
var observer = new MutationObserver(function () {
  var prevCount = shadowHosts.length;
  scanPage();
  /* If count changed while highlights are on, refresh them */
  if (highlightEnabled && shadowHosts.length !== prevCount) {
    setHighlightsVisible(false);
    setHighlightsVisible(true);
  }
  /* Update sidebar if open */
  if (sidebarOpen && !selectedHost) {
    renderSidebar();
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
