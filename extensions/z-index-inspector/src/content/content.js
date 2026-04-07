/**
 * Z-Index Inspector — Content Script
 *
 * Scans the page for elements with explicit z-index values,
 * identifies stacking contexts, and renders an interactive
 * sidebar + overlay badges. Injected on demand via scripting API.
 *
 * No ES module import/export — uses script loading order.
 */

/* ── Guard against double-injection ────────────────────────────── */

if (window.__zIndexInspectorLoaded__) {
  /* Already injected — just toggle the sidebar */
  (function () {
    try {
      chrome.runtime.sendMessage({ type: 'already_injected' });
    } catch (_e) { /* ignore */ }
  })();
} else {
  window.__zIndexInspectorLoaded__ = true;

/* ── State ──────────────────────────────────────────────────────── */

/** All discovered elements with explicit z-index */
var zIndexElements = [];

/** Map from stacking context element to context info */
var stackingContexts = [];

/** Whether overlay badges are visible */
var overlayVisible = false;

/** Whether the sidebar is open */
var sidebarOpen = false;

/** Reference to our UI container (shadow root host) */
var uiHost = null;

/** Reference to the shadow root containing our UI */
var uiShadow = null;

/** Array of badge overlay elements we created */
var badgeElements = [];

/** Style element for highlight effect */
var highlightStyleEl = null;

/** Currently highlighted element */
var highlightedEl = null;

/** Color palette for stacking contexts */
var CONTEXT_COLORS = [
  { bg: 'rgba(59,130,246,0.85)',  border: '#3b82f6', light: 'rgba(59,130,246,0.12)'  },
  { bg: 'rgba(168,85,247,0.85)',  border: '#a855f7', light: 'rgba(168,85,247,0.12)'  },
  { bg: 'rgba(236,72,153,0.85)',  border: '#ec4899', light: 'rgba(236,72,153,0.12)'  },
  { bg: 'rgba(34,197,94,0.85)',   border: '#22c55e', light: 'rgba(34,197,94,0.12)'   },
  { bg: 'rgba(245,158,11,0.85)',  border: '#f59e0b', light: 'rgba(245,158,11,0.12)'  },
  { bg: 'rgba(239,68,68,0.85)',   border: '#ef4444', light: 'rgba(239,68,68,0.12)'   },
  { bg: 'rgba(6,182,212,0.85)',   border: '#06b6d4', light: 'rgba(6,182,212,0.12)'   },
  { bg: 'rgba(132,204,22,0.85)',  border: '#84cc16', light: 'rgba(132,204,22,0.12)'  }
];

/* ── Utilities ──────────────────────────────────────────────────── */

/**
 * Escape HTML entities to prevent XSS when using innerHTML.
 * CRITICAL: Every dynamic string must go through this.
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

/**
 * Generate a CSS selector for an element.
 * Produces a reasonably unique selector like "div#main > ul.nav > li:nth-child(3)".
 */
function getSelector(el) {
  if (el.id) {
    return el.tagName.toLowerCase() + '#' + el.id;
  }
  var parts = [];
  var current = el;
  var depth = 0;
  while (current && current !== document.documentElement && depth < 5) {
    var tag = current.tagName.toLowerCase();
    if (current.id) {
      parts.unshift(tag + '#' + current.id);
      break;
    }
    var cls = current.className && typeof current.className === 'string'
      ? '.' + current.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    /* nth-child for disambiguation */
    var parent = current.parentElement;
    var nth = '';
    if (parent) {
      var siblings = Array.prototype.filter.call(parent.children, function (c) {
        return c.tagName === current.tagName;
      });
      if (siblings.length > 1) {
        nth = ':nth-child(' + (Array.prototype.indexOf.call(parent.children, current) + 1) + ')';
      }
    }
    parts.unshift(tag + cls + nth);
    current = parent;
    depth++;
  }
  return parts.join(' > ');
}

/**
 * Generate a short tag description for an element.
 */
function describeElement(el) {
  var tag = el.tagName ? el.tagName.toLowerCase() : 'unknown';
  var id = el.id ? '#' + el.id : '';
  var cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : '';
  return tag + id + cls;
}

/* ── Stacking Context Detection ────────────────────────────────── */

/**
 * Properties and values that create a new stacking context.
 * Returns the reason string if the element creates a context, null otherwise.
 */
function getStackingContextReason(el) {
  var style = window.getComputedStyle(el);
  var reasons = [];

  /* Root element always creates a stacking context */
  if (el === document.documentElement) {
    reasons.push('root element');
    return reasons;
  }

  /* position: absolute/relative with z-index != auto */
  var position = style.position;
  var zIndex = style.zIndex;
  if ((position === 'absolute' || position === 'relative' || position === 'sticky') && zIndex !== 'auto') {
    reasons.push('position: ' + position + ' + z-index: ' + zIndex);
  }

  /* position: fixed or sticky always creates a context */
  if (position === 'fixed') {
    reasons.push('position: fixed');
  }
  if (position === 'sticky') {
    reasons.push('position: sticky');
  }

  /* Flex/grid child with z-index != auto */
  var parentStyle = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
  if (parentStyle) {
    var parentDisplay = parentStyle.display;
    if ((parentDisplay === 'flex' || parentDisplay === 'inline-flex' ||
         parentDisplay === 'grid' || parentDisplay === 'inline-grid') && zIndex !== 'auto') {
      reasons.push('flex/grid child + z-index: ' + zIndex);
    }
  }

  /* opacity < 1 */
  if (parseFloat(style.opacity) < 1) {
    reasons.push('opacity: ' + style.opacity);
  }

  /* transform */
  if (style.transform && style.transform !== 'none') {
    reasons.push('transform');
  }

  /* filter */
  if (style.filter && style.filter !== 'none') {
    reasons.push('filter');
  }

  /* perspective */
  if (style.perspective && style.perspective !== 'none') {
    reasons.push('perspective');
  }

  /* clip-path */
  if (style.clipPath && style.clipPath !== 'none') {
    reasons.push('clip-path');
  }

  /* mask */
  if (style.mask && style.mask !== 'none') {
    reasons.push('mask');
  }

  /* isolation: isolate */
  if (style.isolation === 'isolate') {
    reasons.push('isolation: isolate');
  }

  /* mix-blend-mode */
  if (style.mixBlendMode && style.mixBlendMode !== 'normal') {
    reasons.push('mix-blend-mode: ' + style.mixBlendMode);
  }

  /* will-change with stacking properties */
  if (style.willChange) {
    var willChangeProps = ['opacity', 'transform', 'filter', 'backdrop-filter'];
    for (var i = 0; i < willChangeProps.length; i++) {
      if (style.willChange.indexOf(willChangeProps[i]) !== -1) {
        reasons.push('will-change: ' + style.willChange);
        break;
      }
    }
  }

  /* contain: layout/paint/strict/content */
  if (style.contain) {
    var containVals = ['layout', 'paint', 'strict', 'content'];
    for (var j = 0; j < containVals.length; j++) {
      if (style.contain.indexOf(containVals[j]) !== -1) {
        reasons.push('contain: ' + style.contain);
        break;
      }
    }
  }

  /* backdrop-filter */
  var backdropFilter = style.backdropFilter || style.webkitBackdropFilter;
  if (backdropFilter && backdropFilter !== 'none') {
    reasons.push('backdrop-filter');
  }

  return reasons.length > 0 ? reasons : null;
}

/**
 * Find the nearest ancestor that creates a stacking context.
 */
function findStackingContext(el) {
  var current = el.parentElement;
  while (current) {
    if (getStackingContextReason(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return document.documentElement;
}

/* ── Page Scanning ─────────────────────────────────────────────── */

/**
 * Scan the entire page for elements with explicit z-index values.
 * Also builds the stacking context tree.
 */
function scanPage() {
  zIndexElements = [];
  stackingContexts = [];

  var contextMap = new Map();
  var contextIndex = 0;

  /* Walk all elements */
  var allElements = document.querySelectorAll('*');
  for (var i = 0; i < allElements.length; i++) {
    var el = allElements[i];

    /* Skip our own UI */
    if (uiHost && (el === uiHost || uiHost.contains(el))) continue;

    var style = window.getComputedStyle(el);
    var zIndex = style.zIndex;

    /* Check if this element creates a stacking context */
    var reasons = getStackingContextReason(el);
    if (reasons && el !== document.documentElement) {
      if (!contextMap.has(el)) {
        contextMap.set(el, {
          element: el,
          selector: getSelector(el),
          description: describeElement(el),
          reasons: reasons,
          colorIndex: contextIndex % CONTEXT_COLORS.length,
          children: []
        });
        contextIndex++;
      }
    }

    /* Only track elements with explicit (non-auto) z-index */
    if (zIndex !== 'auto' && zIndex !== '') {
      var ctx = findStackingContext(el);
      var ctxInfo = contextMap.get(ctx);
      if (!ctxInfo) {
        ctxInfo = {
          element: ctx,
          selector: getSelector(ctx),
          description: describeElement(ctx),
          reasons: getStackingContextReason(ctx) || ['root element'],
          colorIndex: contextIndex % CONTEXT_COLORS.length,
          children: []
        };
        contextMap.set(ctx, ctxInfo);
        contextIndex++;
      }

      var entry = {
        element: el,
        zIndex: parseInt(zIndex, 10),
        zIndexRaw: zIndex,
        selector: getSelector(el),
        description: describeElement(el),
        position: style.position,
        context: ctxInfo,
        contextColorIndex: ctxInfo.colorIndex
      };

      zIndexElements.push(entry);
      ctxInfo.children.push(entry);
    }
  }

  /* Sort by z-index descending */
  zIndexElements.sort(function (a, b) {
    return b.zIndex - a.zIndex;
  });

  /* Build contexts array */
  contextMap.forEach(function (value) {
    if (value.children.length > 0) {
      value.children.sort(function (a, b) { return b.zIndex - a.zIndex; });
      stackingContexts.push(value);
    }
  });

  /* Notify background of the count for badge */
  try {
    chrome.runtime.sendMessage({
      type: 'zindex_count',
      count: zIndexElements.length
    });
  } catch (_e) { /* extension context invalidated */ }

  return zIndexElements;
}

/* ── Conflict Detection ────────────────────────────────────────── */

/**
 * Find z-index conflicts: multiple elements with same z-index
 * within the same stacking context.
 */
function findConflicts() {
  var conflicts = [];
  for (var i = 0; i < stackingContexts.length; i++) {
    var ctx = stackingContexts[i];
    var zMap = {};
    for (var j = 0; j < ctx.children.length; j++) {
      var child = ctx.children[j];
      var z = child.zIndex;
      if (!zMap[z]) {
        zMap[z] = [];
      }
      zMap[z].push(child);
    }
    for (var z in zMap) {
      if (zMap[z].length > 1) {
        conflicts.push({
          zIndex: parseInt(z, 10),
          context: ctx,
          elements: zMap[z]
        });
      }
    }
  }
  return conflicts;
}

/* ── Overlay Badges ────────────────────────────────────────────── */

/**
 * Create or remove z-index badges overlaid on page elements.
 */
function toggleOverlay(show) {
  overlayVisible = show;

  if (!show) {
    /* Remove all badges */
    for (var i = 0; i < badgeElements.length; i++) {
      if (badgeElements[i].parentNode) {
        badgeElements[i].parentNode.removeChild(badgeElements[i]);
      }
    }
    badgeElements = [];
    return;
  }

  /* Remove existing first */
  toggleOverlay(false);
  overlayVisible = true;

  /* Create badges for each element */
  for (var j = 0; j < zIndexElements.length; j++) {
    var entry = zIndexElements[j];
    var el = entry.element;
    var rect = el.getBoundingClientRect();

    /* Skip off-screen or zero-size elements */
    if (rect.width === 0 || rect.height === 0) continue;

    var color = CONTEXT_COLORS[entry.contextColorIndex];
    var badge = document.createElement('div');
    badge.className = '__zii_badge__';
    badge.style.cssText = [
      'position:fixed',
      'top:' + rect.top + 'px',
      'left:' + rect.left + 'px',
      'background:' + color.bg,
      'color:#fff',
      'font-family:monospace',
      'font-size:11px',
      'font-weight:700',
      'padding:2px 6px',
      'border-radius:4px',
      'z-index:2147483646',
      'pointer-events:none',
      'line-height:1.3',
      'box-shadow:0 1px 4px rgba(0,0,0,0.3)',
      'white-space:nowrap'
    ].join(';');
    badge.textContent = 'z:' + entry.zIndex;
    document.body.appendChild(badge);
    badgeElements.push(badge);
  }

  /* Save preference */
  try {
    chrome.storage.local.set({ zii_overlay: true });
  } catch (_e) { /* ignore */ }
}

/**
 * Reposition badges when the page scrolls or resizes.
 */
function repositionBadges() {
  if (!overlayVisible) return;
  var visibleCount = 0;
  for (var i = 0; i < zIndexElements.length; i++) {
    if (i >= badgeElements.length) break;
    var el = zIndexElements[i].element;
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      badgeElements[i].style.display = 'none';
      continue;
    }
    badgeElements[i].style.display = '';
    badgeElements[i].style.top = rect.top + 'px';
    badgeElements[i].style.left = rect.left + 'px';
    visibleCount++;
  }
}

/* Listen for scroll and resize to update badge positions */
window.addEventListener('scroll', repositionBadges, true);
window.addEventListener('resize', repositionBadges);

/* ── Element Highlighting ──────────────────────────────────────── */

/**
 * Highlight a specific element on the page.
 */
function highlightElement(el) {
  clearHighlight();
  highlightedEl = el;

  if (!highlightStyleEl) {
    highlightStyleEl = document.createElement('style');
    document.head.appendChild(highlightStyleEl);
  }

  highlightStyleEl.textContent =
    '.__zii_highlighted__ {' +
    '  outline: 3px solid #3b82f6 !important;' +
    '  outline-offset: 2px !important;' +
    '  box-shadow: 0 0 0 4px rgba(59,130,246,0.25) !important;' +
    '}';

  el.classList.add('__zii_highlighted__');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Remove highlight from the current element.
 */
function clearHighlight() {
  if (highlightedEl) {
    highlightedEl.classList.remove('__zii_highlighted__');
    highlightedEl = null;
  }
}

/* ── Sidebar UI (inside Shadow DOM) ────────────────────────────── */

/**
 * Create the extension's sidebar UI inside a shadow root
 * so it does not interfere with the host page's styles.
 */
function createUI() {
  if (uiHost) return;

  uiHost = document.createElement('div');
  uiHost.id = '__z_index_inspector_ui__';
  uiHost.style.cssText = 'all:initial; position:fixed; top:0; right:0; z-index:2147483647; pointer-events:none;';
  document.body.appendChild(uiHost);

  uiShadow = uiHost.attachShadow({ mode: 'closed' });

  var style = document.createElement('style');
  style.textContent = getSidebarCSS();
  uiShadow.appendChild(style);

  var sidebar = document.createElement('div');
  sidebar.id = 'zii-sidebar';
  sidebar.className = 'zii-sidebar zii-hidden';
  uiShadow.appendChild(sidebar);
}

/**
 * Return the CSS for the sidebar overlay.
 * Dark Catppuccin Mocha theme.
 */
function getSidebarCSS() {
  return [
    '* { margin:0; padding:0; box-sizing:border-box; }',
    '.zii-sidebar {',
    '  position:fixed; top:0; right:0; width:320px; height:100vh;',
    '  background:#1e1e2e; color:#cdd6f4; font-family:"Segoe UI",system-ui,sans-serif;',
    '  font-size:13px; border-left:1px solid #313244;',
    '  box-shadow:-4px 0 20px rgba(0,0,0,0.4);',
    '  display:flex; flex-direction:column; pointer-events:auto;',
    '  overflow:hidden; z-index:2147483647;',
    '  transition:transform 0.2s ease;',
    '}',
    '.zii-hidden { transform:translateX(100%); pointer-events:none; }',
    /* Header */
    '.zii-header {',
    '  padding:12px 14px; background:#181825;',
    '  border-bottom:1px solid #313244; flex-shrink:0;',
    '  display:flex; align-items:center; justify-content:space-between;',
    '}',
    '.zii-title { font-size:14px; font-weight:700; color:#89b4fa; }',
    '.zii-close-btn {',
    '  background:#313244; border:1px solid #45475a; color:#cdd6f4;',
    '  border-radius:6px; padding:4px 10px; cursor:pointer; font-size:13px;',
    '}',
    '.zii-close-btn:hover { background:#45475a; }',
    '.zii-header-right { display:flex; gap:6px; align-items:center; }',
    '.zii-count-badge {',
    '  font-size:11px; padding:2px 8px; border-radius:10px;',
    '  background:rgba(137,180,250,0.2); color:#89b4fa; font-weight:600;',
    '}',
    /* Tabs */
    '.zii-tabs {',
    '  display:flex; border-bottom:1px solid #313244; flex-shrink:0;',
    '}',
    '.zii-tab {',
    '  flex:1; padding:8px 6px; text-align:center; cursor:pointer;',
    '  color:#6c7086; font-size:11px; font-weight:600;',
    '  border-bottom:2px solid transparent; background:transparent;',
    '  border-top:none; border-left:none; border-right:none;',
    '}',
    '.zii-tab:hover { color:#a6adc8; }',
    '.zii-tab.active { color:#89b4fa; border-bottom-color:#89b4fa; }',
    /* Content */
    '.zii-content {',
    '  flex:1; overflow-y:auto; padding:0;',
    '}',
    '.zii-content::-webkit-scrollbar { width:6px; }',
    '.zii-content::-webkit-scrollbar-track { background:transparent; }',
    '.zii-content::-webkit-scrollbar-thumb { background:#45475a; border-radius:3px; }',
    /* List items */
    '.zii-item {',
    '  padding:8px 12px; border-bottom:1px solid #313244;',
    '  cursor:pointer; display:flex; align-items:center; gap:8px;',
    '}',
    '.zii-item:hover { background:#313244; }',
    '.zii-item.selected { background:rgba(137,180,250,0.1); border-left:3px solid #89b4fa; }',
    '.zii-z-badge {',
    '  font-family:"Cascadia Code","Fira Code",Consolas,monospace;',
    '  font-size:12px; font-weight:700; padding:2px 6px;',
    '  border-radius:4px; color:#fff; min-width:44px; text-align:center;',
    '}',
    '.zii-selector {',
    '  font-family:"Cascadia Code","Fira Code",Consolas,monospace;',
    '  font-size:11px; color:#a6adc8; overflow:hidden;',
    '  text-overflow:ellipsis; white-space:nowrap; flex:1;',
    '}',
    '.zii-copy-icon {',
    '  color:#585b70; cursor:pointer; font-size:12px;',
    '  padding:2px 4px; border-radius:3px; flex-shrink:0;',
    '  background:transparent; border:none;',
    '}',
    '.zii-copy-icon:hover { color:#89b4fa; background:#313244; }',
    /* Context tree */
    '.zii-ctx-group {',
    '  border-bottom:1px solid #313244; padding:8px 0;',
    '}',
    '.zii-ctx-header {',
    '  padding:6px 12px; display:flex; align-items:center; gap:8px;',
    '  font-size:12px; font-weight:600; color:#a6adc8;',
    '}',
    '.zii-ctx-dot {',
    '  width:10px; height:10px; border-radius:50%; flex-shrink:0;',
    '}',
    '.zii-ctx-reason {',
    '  font-size:10px; color:#585b70; padding:2px 12px 4px 30px;',
    '  font-style:italic;',
    '}',
    '.zii-ctx-child {',
    '  padding:4px 12px 4px 30px; display:flex; align-items:center;',
    '  gap:6px; cursor:pointer; font-size:12px;',
    '}',
    '.zii-ctx-child:hover { background:#313244; }',
    /* Conflict items */
    '.zii-conflict {',
    '  border-bottom:1px solid #313244; padding:8px 12px;',
    '}',
    '.zii-conflict-header {',
    '  display:flex; align-items:center; gap:8px;',
    '  font-size:12px; font-weight:600; margin-bottom:6px;',
    '}',
    '.zii-conflict-warn {',
    '  color:#f9e2af; font-size:13px;',
    '}',
    '.zii-conflict-z {',
    '  font-family:monospace; font-weight:700; color:#f9e2af;',
    '}',
    '.zii-conflict-el {',
    '  padding:3px 8px 3px 20px; font-family:monospace;',
    '  font-size:11px; color:#a6adc8; cursor:pointer;',
    '}',
    '.zii-conflict-el:hover { color:#89b4fa; }',
    /* Empty state */
    '.zii-empty {',
    '  text-align:center; padding:40px 20px; color:#585b70;',
    '}',
    /* Toast */
    '.zii-toast {',
    '  position:fixed; bottom:16px; left:50%; transform:translateX(-50%);',
    '  background:#a6e3a1; color:#1e1e2e; padding:6px 16px;',
    '  border-radius:6px; font-size:12px; font-weight:600;',
    '  opacity:0; transition:opacity 0.2s; pointer-events:none;',
    '}',
    '.zii-toast.show { opacity:1; }'
  ].join('\n');
}

/* ── Sidebar Rendering ─────────────────────────────────────────── */

/** Current active tab in sidebar */
var activeTab = 'list';

/**
 * Render the sidebar content based on the active tab.
 */
function renderSidebar() {
  if (!uiShadow) return;
  var sidebar = uiShadow.getElementById('zii-sidebar');
  if (!sidebar) return;

  var conflicts = findConflicts();
  var html = '';

  /* Header */
  html += '<div class="zii-header">';
  html += '  <span class="zii-title">Z-Index Inspector</span>';
  html += '  <div class="zii-header-right">';
  html += '    <span class="zii-count-badge">' + escapeHtml(String(zIndexElements.length)) + ' elements</span>';
  if (conflicts.length > 0) {
    html += '    <span class="zii-count-badge" style="background:rgba(249,226,175,0.2);color:#f9e2af;">' + escapeHtml(String(conflicts.length)) + ' conflicts</span>';
  }
  html += '    <button class="zii-close-btn" id="zii-close">&#10005;</button>';
  html += '  </div>';
  html += '</div>';

  /* Tabs */
  html += '<div class="zii-tabs">';
  html += '  <button class="zii-tab' + (activeTab === 'list' ? ' active' : '') + '" data-tab="list">All Z-Index</button>';
  html += '  <button class="zii-tab' + (activeTab === 'contexts' ? ' active' : '') + '" data-tab="contexts">Contexts</button>';
  html += '  <button class="zii-tab' + (activeTab === 'conflicts' ? ' active' : '') + '" data-tab="conflicts">Conflicts</button>';
  html += '</div>';

  /* Content area */
  html += '<div class="zii-content" id="zii-content">';

  if (activeTab === 'list') {
    html += renderListView();
  } else if (activeTab === 'contexts') {
    html += renderContextsView();
  } else if (activeTab === 'conflicts') {
    html += renderConflictsView(conflicts);
  }

  html += '</div>';

  /* Toast */
  html += '<div class="zii-toast" id="zii-toast"></div>';

  sidebar.innerHTML = html;
  attachSidebarEvents(sidebar);
}

/**
 * Render the sorted list of all z-indexed elements.
 */
function renderListView() {
  if (zIndexElements.length === 0) {
    return '<div class="zii-empty">No elements with explicit z-index found on this page.</div>';
  }

  var html = '';
  for (var i = 0; i < zIndexElements.length; i++) {
    var entry = zIndexElements[i];
    var color = CONTEXT_COLORS[entry.contextColorIndex];
    html += '<div class="zii-item" data-index="' + i + '">';
    html += '  <span class="zii-z-badge" style="background:' + escapeHtml(color.bg) + '">z:' + escapeHtml(String(entry.zIndex)) + '</span>';
    html += '  <span class="zii-selector" title="' + escapeHtml(entry.selector) + '">' + escapeHtml(entry.description) + '</span>';
    html += '  <button class="zii-copy-icon" data-selector="' + escapeHtml(entry.selector) + '" title="Copy selector">&#128203;</button>';
    html += '</div>';
  }
  return html;
}

/**
 * Render the stacking context tree view.
 */
function renderContextsView() {
  if (stackingContexts.length === 0) {
    return '<div class="zii-empty">No stacking contexts with z-indexed children found.</div>';
  }

  var html = '';
  for (var i = 0; i < stackingContexts.length; i++) {
    var ctx = stackingContexts[i];
    var color = CONTEXT_COLORS[ctx.colorIndex];

    html += '<div class="zii-ctx-group">';
    html += '  <div class="zii-ctx-header">';
    html += '    <span class="zii-ctx-dot" style="background:' + escapeHtml(color.border) + '"></span>';
    html += '    <span>' + escapeHtml(ctx.description) + '</span>';
    html += '    <span style="color:#585b70;font-size:10px;margin-left:auto;">' + escapeHtml(String(ctx.children.length)) + ' children</span>';
    html += '  </div>';
    html += '  <div class="zii-ctx-reason">' + escapeHtml(ctx.reasons.join(', ')) + '</div>';

    for (var j = 0; j < ctx.children.length; j++) {
      var child = ctx.children[j];
      html += '  <div class="zii-ctx-child" data-ctx-index="' + i + '" data-child-index="' + j + '">';
      html += '    <span class="zii-z-badge" style="background:' + escapeHtml(color.bg) + ';font-size:10px;padding:1px 4px;">z:' + escapeHtml(String(child.zIndex)) + '</span>';
      html += '    <span style="font-family:monospace;font-size:11px;color:#a6adc8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(child.description) + '</span>';
      html += '  </div>';
    }

    html += '</div>';
  }
  return html;
}

/**
 * Render the conflicts view.
 */
function renderConflictsView(conflicts) {
  if (conflicts.length === 0) {
    return '<div class="zii-empty">No z-index conflicts detected. Each z-index value is unique within its stacking context.</div>';
  }

  var html = '';
  for (var i = 0; i < conflicts.length; i++) {
    var conflict = conflicts[i];
    html += '<div class="zii-conflict">';
    html += '  <div class="zii-conflict-header">';
    html += '    <span class="zii-conflict-warn">&#9888;</span>';
    html += '    <span class="zii-conflict-z">z-index: ' + escapeHtml(String(conflict.zIndex)) + '</span>';
    html += '    <span style="color:#585b70;font-size:10px;">in ' + escapeHtml(conflict.context.description) + '</span>';
    html += '  </div>';

    for (var j = 0; j < conflict.elements.length; j++) {
      var el = conflict.elements[j];
      html += '  <div class="zii-conflict-el" data-conflict="' + i + '" data-el="' + j + '">' + escapeHtml(el.description) + '</div>';
    }

    html += '</div>';
  }
  return html;
}

/* ── Sidebar Event Handlers ────────────────────────────────────── */

/**
 * Attach event listeners to sidebar elements.
 */
function attachSidebarEvents(sidebar) {
  /* Close button */
  var closeBtn = sidebar.querySelector('#zii-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      toggleSidebar(false);
    });
  }

  /* Tab switching */
  var tabs = sidebar.querySelectorAll('.zii-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activeTab = tab.getAttribute('data-tab');
      renderSidebar();
    });
  });

  /* List item clicks (highlight + scroll to element) */
  var items = sidebar.querySelectorAll('.zii-item');
  items.forEach(function (item) {
    item.addEventListener('click', function (e) {
      /* Don't trigger when clicking copy button */
      if (e.target.classList.contains('zii-copy-icon')) return;
      var index = parseInt(item.getAttribute('data-index'), 10);
      if (zIndexElements[index]) {
        highlightElement(zIndexElements[index].element);
      }
    });
  });

  /* Copy selector buttons */
  var copyBtns = sidebar.querySelectorAll('.zii-copy-icon');
  copyBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var selector = btn.getAttribute('data-selector');
      navigator.clipboard.writeText(selector).then(function () {
        showToast('Selector copied');
      });
    });
  });

  /* Context tree child clicks */
  var ctxChildren = sidebar.querySelectorAll('.zii-ctx-child');
  ctxChildren.forEach(function (child) {
    child.addEventListener('click', function () {
      var ctxIdx = parseInt(child.getAttribute('data-ctx-index'), 10);
      var childIdx = parseInt(child.getAttribute('data-child-index'), 10);
      if (stackingContexts[ctxIdx] && stackingContexts[ctxIdx].children[childIdx]) {
        highlightElement(stackingContexts[ctxIdx].children[childIdx].element);
      }
    });
  });

  /* Conflict element clicks */
  var conflictEls = sidebar.querySelectorAll('.zii-conflict-el');
  var conflicts = findConflicts();
  conflictEls.forEach(function (el) {
    el.addEventListener('click', function () {
      var cIdx = parseInt(el.getAttribute('data-conflict'), 10);
      var eIdx = parseInt(el.getAttribute('data-el'), 10);
      if (conflicts[cIdx] && conflicts[cIdx].elements[eIdx]) {
        highlightElement(conflicts[cIdx].elements[eIdx].element);
      }
    });
  });
}

/**
 * Show a brief toast inside the sidebar.
 */
function showToast(message) {
  if (!uiShadow) return;
  var toast = uiShadow.getElementById('zii-toast');
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
  var sidebar = uiShadow.getElementById('zii-sidebar');
  if (!sidebar) return;

  sidebarOpen = show;

  if (show) {
    scanPage();
    renderSidebar();
    sidebar.classList.remove('zii-hidden');
  } else {
    sidebar.classList.add('zii-hidden');
    clearHighlight();
  }
}

/* ── Message Handling ──────────────────────────────────────────── */

chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {

  /* Activate: scan + show overlay + open sidebar */
  if (msg.type === 'activate') {
    createUI();
    scanPage();
    toggleOverlay(true);
    toggleSidebar(true);
    sendResponse({ ok: true, count: zIndexElements.length });
    return;
  }

  /* Toggle overlay badges on/off */
  if (msg.type === 'toggle_overlay') {
    toggleOverlay(msg.enabled);
    sendResponse({ ok: true });
    return;
  }

  /* Toggle sidebar */
  if (msg.type === 'toggle_sidebar') {
    createUI();
    toggleSidebar(msg.open);
    sendResponse({ ok: true });
    return;
  }

  /* Re-scan */
  if (msg.type === 'scan_page') {
    scanPage();
    if (overlayVisible) {
      toggleOverlay(false);
      toggleOverlay(true);
    }
    if (sidebarOpen) {
      renderSidebar();
    }
    sendResponse({ count: zIndexElements.length });
    return;
  }

  /* Get state */
  if (msg.type === 'get_state') {
    sendResponse({
      count: zIndexElements.length,
      overlayVisible: overlayVisible,
      sidebarOpen: sidebarOpen
    });
    return;
  }
});

/* ── Init ──────────────────────────────────────────────────────── */

scanPage();

} /* end of double-injection guard */
