// content.js -- DotEnv Preview content script
// Detects env files on GitHub/GitLab/Bitbucket and renders formatted overlay
// Uses Shadow DOM for complete style isolation from host page

(() => {
  'use strict';

  // ---- Constants ----
  const HOST_TAG = 'dotenv-preview-host';   // Custom element for Shadow DOM host
  const DEBOUNCE_MS = 500;                   // Debounce for MutationObserver
  const SCAN_DELAY_MS = 1500;                // Initial scan delay

  // ---- State ----
  let settings = {
    autoFormat: true,
    maskSensitive: true,
    groupByPrefix: true,
    showLineNumbers: true,
    theme: 'auto'
  };
  let debounceTimer = null;
  let isFormatted = false;            // Whether we're showing formatted view
  let currentHost = null;             // Current Shadow DOM host element
  let originalContent = null;         // Saved original page content element
  let rawEnvText = '';                // Raw env file text

  // ---- Initialize ----
  loadSettings();
  setupObserver();
  setupMessageListener();

  // ============================================================
  // Settings
  // ============================================================

  /**
   * Load user settings from chrome.storage.local
   */
  function loadSettings() {
    chrome.storage.local.get(
      ['autoFormat', 'maskSensitive', 'groupByPrefix', 'showLineNumbers', 'theme'],
      (result) => {
        settings.autoFormat = result.autoFormat !== false;
        settings.maskSensitive = result.maskSensitive !== false;
        settings.groupByPrefix = result.groupByPrefix !== false;
        settings.showLineNumbers = result.showLineNumbers !== false;
        settings.theme = result.theme || 'auto';
      }
    );
  }

  /**
   * Listen for settings change messages from the popup
   */
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'SETTINGS_UPDATED') {
        loadSettings();
        // Re-render if we're currently showing a formatted view
        if (isFormatted && rawEnvText) {
          setTimeout(() => {
            removeOverlay();
            renderFormattedView(rawEnvText);
          }, 100);
        }
        sendResponse({ ok: true });
      }
      return true;
    });
  }

  // ============================================================
  // Page detection and observation
  // ============================================================

  /**
   * Set up MutationObserver for SPA navigation (GitHub uses client-side routing)
   */
  function setupObserver() {
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(scanPage, DEBOUNCE_MS);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial scan after page loads
    setTimeout(scanPage, SCAN_DELAY_MS);
  }

  /**
   * Main scan function -- detect env files and inject formatted view
   */
  function scanPage() {
    try {
      // Don't scan if auto-format is off
      if (!settings.autoFormat) return;

      // Already formatted and host is still in the DOM? Skip.
      if (isFormatted && currentHost && document.body.contains(currentHost)) return;

      // Reset state if host was removed (SPA navigation)
      if (isFormatted && currentHost && !document.body.contains(currentHost)) {
        isFormatted = false;
        currentHost = null;
        originalContent = null;
        rawEnvText = '';
      }

      // Check if URL looks like an env file
      var url = window.location.href;
      if (!DotEnvPreview.detectEnvFileFromUrl(url)) return;

      // Try to extract the raw file content from the page
      var content = extractFileContent();
      if (!content) return;

      // Double-check: does the content look like an env file?
      if (!DotEnvPreview.detectEnvFileFromContent(content)) return;

      rawEnvText = content;
      renderFormattedView(content);
    } catch (err) {
      console.error('DotEnv Preview: scan error', err);
    }
  }

  /**
   * Extract the raw file content from the current page.
   * Handles GitHub, GitLab, Bitbucket, and raw URLs.
   *
   * @returns {string|null} The raw env file text, or null
   */
  function extractFileContent() {
    var url = window.location.href;

    // Raw text pages (raw.githubusercontent.com)
    if (url.indexOf('raw.githubusercontent.com') !== -1) {
      return document.body.innerText;
    }

    // GitHub blob pages
    if (url.indexOf('github.com') !== -1) {
      // New GitHub UI (react-based): look for the code content area
      var codeTable = document.querySelector('[data-hpc] table');
      if (codeTable) {
        return extractFromGithubTable(codeTable);
      }

      // Try the raw text content area
      var rawContent = document.querySelector('.react-blob-print-hide + div .react-code-text');
      if (rawContent) {
        var allLines = document.querySelectorAll('.react-code-text');
        return Array.from(allLines).map(function(el) { return el.textContent; }).join('\n');
      }

      // Old GitHub UI: look for .blob-code elements
      var blobLines = document.querySelectorAll('.blob-code-inner');
      if (blobLines.length > 0) {
        return Array.from(blobLines).map(function(el) { return el.textContent; }).join('\n');
      }

      // Fallback: try the text-mono code block
      var codeBlock = document.querySelector('.Box-body .text-mono');
      if (codeBlock) {
        return codeBlock.textContent;
      }

      // Try react-based file viewer code lines
      var reactLines = document.querySelectorAll('[data-key] .react-file-line');
      if (reactLines.length > 0) {
        return Array.from(reactLines).map(function(el) { return el.textContent; }).join('\n');
      }

      return null;
    }

    // GitLab blob pages
    if (url.indexOf('gitlab.com') !== -1) {
      var glLines = document.querySelectorAll('.blob-content .line');
      if (glLines.length > 0) {
        return Array.from(glLines).map(function(el) { return el.textContent; }).join('\n');
      }
      return null;
    }

    // Bitbucket blob pages
    if (url.indexOf('bitbucket.org') !== -1) {
      var bbLines = document.querySelectorAll('.code-container .line-content');
      if (bbLines.length > 0) {
        return Array.from(bbLines).map(function(el) { return el.textContent; }).join('\n');
      }
      return null;
    }

    return null;
  }

  /**
   * Extract text from a GitHub code table.
   *
   * @param {Element} table - The GitHub code table element
   * @returns {string} Combined text content
   */
  function extractFromGithubTable(table) {
    var rows = table.querySelectorAll('tr');
    var lines = [];
    rows.forEach(function(row) {
      // Get the last cell (the code cell, not line number)
      var cells = row.querySelectorAll('td');
      if (cells.length > 0) {
        var codeCell = cells[cells.length - 1];
        lines.push(codeCell.textContent);
      }
    });
    return lines.join('\n');
  }

  // ============================================================
  // Rendering
  // ============================================================

  /**
   * Render the formatted env file overlay using Shadow DOM.
   *
   * @param {string} envText - Raw env file text
   */
  function renderFormattedView(envText) {
    // Parse the env content
    var parsed = DotEnvPreview.parseEnvContent(envText);
    if (!parsed || parsed.length === 0) return;

    // Find the code content container to overlay
    var codeContainer = findCodeContainer();
    if (!codeContainer) return;

    // Save reference to original content
    originalContent = codeContainer;

    // Create shadow host element
    var host = document.createElement(HOST_TAG);
    host.style.display = 'block';

    // Insert host before the code container
    codeContainer.parentNode.insertBefore(host, codeContainer);

    // Hide original content
    codeContainer.style.display = 'none';

    // Attach shadow DOM
    var shadow = host.attachShadow({ mode: 'closed' });

    // Detect theme
    var isDark = detectDarkTheme();

    // Add styles
    var style = document.createElement('style');
    style.textContent = getFormattedViewCSS(isDark);
    shadow.appendChild(style);

    // Build the formatted view
    var wrapper = document.createElement('div');
    wrapper.className = 'dep-container';

    // Toolbar
    wrapper.appendChild(buildToolbar(envText, parsed, shadow, codeContainer, host));

    // Search box
    wrapper.appendChild(buildSearchBox(shadow));

    // Content area
    var contentArea = document.createElement('div');
    contentArea.className = 'dep-content';

    if (settings.groupByPrefix) {
      // Grouped view
      var variables = parsed.filter(function(item) { return item.type === 'variable'; });
      var groups = DotEnvPreview.groupByPrefix(variables);
      var groupNames = Object.keys(groups).sort(function(a, b) {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return a.localeCompare(b);
      });

      // Also show comments and blank lines at the top
      var nonVariables = parsed.filter(function(item) { return item.type !== 'variable'; });
      if (nonVariables.length > 0) {
        var commentSection = document.createElement('div');
        commentSection.className = 'dep-group';
        nonVariables.forEach(function(item) {
          commentSection.appendChild(buildLineElement(item));
        });
        contentArea.appendChild(commentSection);
      }

      groupNames.forEach(function(groupName) {
        var group = groups[groupName];
        var section = buildGroupSection(groupName, group);
        contentArea.appendChild(section);
      });
    } else {
      // Flat view -- show all lines in order
      parsed.forEach(function(item) {
        contentArea.appendChild(buildLineElement(item));
      });
    }

    wrapper.appendChild(contentArea);
    shadow.appendChild(wrapper);

    currentHost = host;
    isFormatted = true;
  }

  /**
   * Find the code content container on the current page.
   *
   * @returns {Element|null}
   */
  function findCodeContainer() {
    var url = window.location.href;

    if (url.indexOf('github.com') !== -1) {
      // New GitHub UI
      var container = document.querySelector('[data-hpc]');
      if (container) return container;

      // Old GitHub UI
      return document.querySelector('.Box-body') ||
             document.querySelector('.blob-wrapper') ||
             document.querySelector('.js-file-content');
    }

    if (url.indexOf('gitlab.com') !== -1) {
      return document.querySelector('.blob-content') ||
             document.querySelector('.file-content');
    }

    if (url.indexOf('bitbucket.org') !== -1) {
      return document.querySelector('.code-container') ||
             document.querySelector('.file-source');
    }

    if (url.indexOf('raw.githubusercontent.com') !== -1) {
      return document.querySelector('pre') || document.body;
    }

    return null;
  }

  /**
   * Detect if the current page uses a dark theme.
   *
   * @returns {boolean}
   */
  function detectDarkTheme() {
    if (settings.theme === 'light') return false;
    if (settings.theme === 'dark') return true;

    // Auto-detect from page
    var htmlEl = document.documentElement;
    var dataTheme = htmlEl.getAttribute('data-color-mode') ||
                    htmlEl.getAttribute('data-theme') || '';
    if (dataTheme.indexOf('dark') !== -1) return true;

    // Check computed background color
    var bg = window.getComputedStyle(document.body).backgroundColor;
    if (bg) {
      var match = bg.match(/\d+/g);
      if (match && match.length >= 3) {
        var r = parseInt(match[0], 10);
        var g = parseInt(match[1], 10);
        var b = parseInt(match[2], 10);
        var luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        return luminance < 128;
      }
    }

    return false;
  }

  // ============================================================
  // UI Building
  // ============================================================

  /**
   * Build the toolbar with toggle and copy buttons.
   */
  function buildToolbar(envText, parsed, shadow, codeContainer, host) {
    var toolbar = document.createElement('div');
    toolbar.className = 'dep-toolbar';

    // Title
    var title = document.createElement('span');
    title.className = 'dep-title';
    title.textContent = 'DotEnv Preview';
    toolbar.appendChild(title);

    // Variable count badge
    var varCount = parsed.filter(function(item) { return item.type === 'variable'; }).length;
    var badge = document.createElement('span');
    badge.className = 'dep-badge';
    badge.textContent = varCount + ' variable' + (varCount !== 1 ? 's' : '');
    toolbar.appendChild(badge);

    // Spacer
    var spacer = document.createElement('span');
    spacer.className = 'dep-spacer';
    toolbar.appendChild(spacer);

    // Copy all button
    var copyAllBtn = document.createElement('button');
    copyAllBtn.className = 'dep-btn';
    copyAllBtn.textContent = 'Copy .env';
    copyAllBtn.title = 'Copy all variables as .env format';
    copyAllBtn.addEventListener('click', function() {
      copyToClipboard(envText, copyAllBtn);
    });
    toolbar.appendChild(copyAllBtn);

    // Toggle raw/formatted button
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'dep-btn dep-btn-toggle';
    toggleBtn.textContent = 'Raw';
    toggleBtn.title = 'Switch to raw view';
    toggleBtn.addEventListener('click', function() {
      if (isFormatted) {
        // Switch to raw: show original, hide overlay
        codeContainer.style.display = '';
        host.style.display = 'none';
        isFormatted = false;
        toggleBtn.textContent = 'Formatted';
        toggleBtn.title = 'Switch to formatted view';
      } else {
        // Switch to formatted: hide original, show overlay
        codeContainer.style.display = 'none';
        host.style.display = 'block';
        isFormatted = true;
        toggleBtn.textContent = 'Raw';
        toggleBtn.title = 'Switch to raw view';
      }
    });
    toolbar.appendChild(toggleBtn);

    return toolbar;
  }

  /**
   * Build the search/filter box.
   */
  function buildSearchBox(shadow) {
    var searchContainer = document.createElement('div');
    searchContainer.className = 'dep-search-container';

    var searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'dep-search-input';
    searchInput.placeholder = 'Filter variables...';

    var filterTimer = null;
    searchInput.addEventListener('input', function() {
      clearTimeout(filterTimer);
      filterTimer = setTimeout(function() {
        filterVariables(shadow, searchInput.value);
      }, 200);
    });

    searchContainer.appendChild(searchInput);
    return searchContainer;
  }

  /**
   * Filter displayed variables based on search text.
   */
  function filterVariables(shadow, query) {
    var lowerQuery = query.toLowerCase();
    var lines = shadow.querySelectorAll('.dep-line');
    lines.forEach(function(line) {
      if (!query) {
        line.style.display = '';
        return;
      }
      var text = line.textContent.toLowerCase();
      line.style.display = text.indexOf(lowerQuery) !== -1 ? '' : 'none';
    });

    // Show/hide group headers based on whether they have visible children
    var groups = shadow.querySelectorAll('.dep-group');
    groups.forEach(function(group) {
      var visibleLines = group.querySelectorAll('.dep-line:not([style*="display: none"])');
      var header = group.querySelector('.dep-group-header');
      if (header) {
        header.style.display = visibleLines.length > 0 || !query ? '' : 'none';
      }
    });
  }

  /**
   * Build a collapsible group section.
   */
  function buildGroupSection(groupName, variables) {
    var section = document.createElement('div');
    section.className = 'dep-group';

    // Group header
    var header = document.createElement('div');
    header.className = 'dep-group-header';
    var isCollapsed = false;

    var arrow = document.createElement('span');
    arrow.className = 'dep-group-arrow';
    arrow.textContent = '\u25BC'; // down arrow

    var label = document.createElement('span');
    label.className = 'dep-group-label';
    label.textContent = groupName;

    var count = document.createElement('span');
    count.className = 'dep-group-count';
    count.textContent = '(' + variables.length + ')';

    header.appendChild(arrow);
    header.appendChild(label);
    header.appendChild(count);

    // Group body
    var body = document.createElement('div');
    body.className = 'dep-group-body';

    variables.forEach(function(v) {
      body.appendChild(buildLineElement(v));
    });

    header.addEventListener('click', function() {
      isCollapsed = !isCollapsed;
      body.style.display = isCollapsed ? 'none' : '';
      arrow.textContent = isCollapsed ? '\u25B6' : '\u25BC'; // right / down arrow
    });

    section.appendChild(header);
    section.appendChild(body);
    return section;
  }

  /**
   * Build a single line element for display.
   */
  function buildLineElement(item) {
    var line = document.createElement('div');
    line.className = 'dep-line dep-line-' + item.type;

    // Line number
    if (settings.showLineNumbers) {
      var lineNum = document.createElement('span');
      lineNum.className = 'dep-line-num';
      lineNum.textContent = item.lineNumber;
      line.appendChild(lineNum);
    }

    if (item.type === 'comment') {
      var commentSpan = document.createElement('span');
      commentSpan.className = 'dep-comment';
      commentSpan.textContent = item.rawLine;
      line.appendChild(commentSpan);
      return line;
    }

    if (item.type === 'blank') {
      var blankSpan = document.createElement('span');
      blankSpan.className = 'dep-blank';
      blankSpan.textContent = '\u00A0';
      line.appendChild(blankSpan);
      return line;
    }

    // Variable line
    var classification = DotEnvPreview.classifyValue(item.key, item.value);
    var valueType = DotEnvPreview.detectValueType(item.value);
    line.setAttribute('data-classification', classification);

    // Key
    var keySpan = document.createElement('span');
    keySpan.className = 'dep-key';
    keySpan.textContent = item.key;
    line.appendChild(keySpan);

    // Equals sign
    var eqSpan = document.createElement('span');
    eqSpan.className = 'dep-equals';
    eqSpan.textContent = '=';
    line.appendChild(eqSpan);

    // Value
    var valueContainer = document.createElement('span');
    valueContainer.className = 'dep-value dep-value-' + valueType;

    if (classification === 'sensitive') {
      valueContainer.classList.add('dep-sensitive');

      // Warning icon
      var warnIcon = document.createElement('span');
      warnIcon.className = 'dep-icon-warn';
      warnIcon.textContent = '\u26A0\uFE0F';
      warnIcon.title = 'This value looks like a real secret/token';
      line.insertBefore(warnIcon, keySpan);

      // Value text (masked by default)
      var valueText = document.createElement('span');
      valueText.className = 'dep-value-text';
      if (settings.maskSensitive) {
        valueText.classList.add('dep-masked');
        valueText.textContent = item.value;
        valueText.title = 'Click to reveal';
        valueText.addEventListener('click', function() {
          valueText.classList.toggle('dep-masked');
        });
      } else {
        valueText.textContent = item.value;
      }
      valueContainer.appendChild(valueText);

    } else if (classification === 'placeholder') {
      valueContainer.classList.add('dep-placeholder');

      // Hint icon
      var hintIcon = document.createElement('span');
      hintIcon.className = 'dep-icon-hint';
      hintIcon.textContent = '\uD83D\uDCA1';
      hintIcon.title = 'Placeholder -- needs to be filled in';
      line.insertBefore(hintIcon, keySpan);

      var valueText2 = document.createElement('span');
      valueText2.className = 'dep-value-text';
      valueText2.textContent = item.value || '(empty)';
      valueContainer.appendChild(valueText2);

    } else {
      var valueText3 = document.createElement('span');
      valueText3.className = 'dep-value-text';
      valueText3.textContent = item.value;
      valueContainer.appendChild(valueText3);
    }

    line.appendChild(valueContainer);

    // Copy button
    var copyBtn = document.createElement('button');
    copyBtn.className = 'dep-copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.title = 'Copy value to clipboard';
    copyBtn.addEventListener('click', function() {
      copyToClipboard(item.value, copyBtn);
    });
    line.appendChild(copyBtn);

    return line;
  }

  // ============================================================
  // Utilities
  // ============================================================

  /**
   * Copy text to clipboard and show feedback on the button.
   */
  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(function() {
      var original = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('dep-copied');
      setTimeout(function() {
        btn.textContent = original;
        btn.classList.remove('dep-copied');
      }, 1500);
    }).catch(function(err) {
      console.error('DotEnv Preview: copy failed', err);
    });
  }

  /**
   * Remove the formatted overlay and restore original content.
   */
  function removeOverlay() {
    if (currentHost && currentHost.parentNode) {
      if (originalContent) {
        originalContent.style.display = '';
      }
      currentHost.parentNode.removeChild(currentHost);
    }
    currentHost = null;
    isFormatted = false;
    originalContent = null;
  }

  // ============================================================
  // CSS for the formatted view (inside Shadow DOM)
  // ============================================================

  /**
   * Generate CSS for the formatted view.
   *
   * @param {boolean} isDark - Whether to use dark theme colors
   * @returns {string} CSS text
   */
  function getFormattedViewCSS(isDark) {
    // Theme colors
    var bg = isDark ? '#0d1117' : '#ffffff';
    var bgAlt = isDark ? '#161b22' : '#f6f8fa';
    var border = isDark ? '#30363d' : '#d0d7de';
    var text = isDark ? '#e6edf3' : '#1f2328';
    var textMuted = isDark ? '#8b949e' : '#656d76';
    var keyColor = isDark ? '#79c0ff' : '#1565c0';
    var valueStringColor = isDark ? '#a5d6a7' : '#2e7d32';
    var valueNumColor = isDark ? '#ffb74d' : '#e65100';
    var valueBoolColor = isDark ? '#ce93d8' : '#7b1fa2';
    var commentColor = isDark ? '#8b949e' : '#9e9e9e';
    var accentColor = '#f57c00';
    var accentLight = isDark ? '#3d2800' : '#fff3e0';
    var sensitiveRed = isDark ? '#3d1418' : '#ffebee';
    var sensitiveBorder = isDark ? '#6e2d2d' : '#ef9a9a';
    var placeholderYellow = isDark ? '#3d3000' : '#fffde7';
    var placeholderBorder = isDark ? '#6e5c00' : '#fff59d';
    var hoverBg = isDark ? '#1c2128' : '#f0f0f0';
    var copyBtnBg = isDark ? '#21262d' : '#f0f0f0';
    var copyBtnHover = isDark ? '#30363d' : '#e0e0e0';
    var toolbarBg = isDark ? '#161b22' : '#f6f8fa';
    var inputBg = isDark ? '#0d1117' : '#ffffff';
    var inputBorder = isDark ? '#30363d' : '#d0d7de';
    var badgeBg = isDark ? '#3d2800' : '#fff3e0';
    var badgeColor = isDark ? '#ffb74d' : '#e65100';

    return [
      // Reset and container
      ':host { display: block; }',
      '* { margin: 0; padding: 0; box-sizing: border-box; }',
      '.dep-container {',
      '  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;',
      '  font-size: 13px;',
      '  line-height: 1.6;',
      '  background: ' + bg + ';',
      '  color: ' + text + ';',
      '  border: 1px solid ' + border + ';',
      '  border-radius: 6px;',
      '  overflow: hidden;',
      '}',

      // Toolbar
      '.dep-toolbar {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '  padding: 8px 12px;',
      '  background: ' + toolbarBg + ';',
      '  border-bottom: 1px solid ' + border + ';',
      '}',
      '.dep-title {',
      '  font-weight: 600;',
      '  font-size: 13px;',
      '  color: ' + accentColor + ';',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}',
      '.dep-badge {',
      '  font-size: 11px;',
      '  padding: 2px 8px;',
      '  border-radius: 12px;',
      '  background: ' + badgeBg + ';',
      '  color: ' + badgeColor + ';',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}',
      '.dep-spacer { flex: 1; }',
      '.dep-btn {',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  font-size: 12px;',
      '  padding: 4px 12px;',
      '  border: 1px solid ' + border + ';',
      '  border-radius: 6px;',
      '  background: ' + copyBtnBg + ';',
      '  color: ' + text + ';',
      '  cursor: pointer;',
      '  transition: background 0.15s;',
      '}',
      '.dep-btn:hover { background: ' + copyBtnHover + '; }',
      '.dep-btn-toggle {',
      '  background: ' + accentColor + ';',
      '  color: #fff;',
      '  border-color: ' + accentColor + ';',
      '}',
      '.dep-btn-toggle:hover { background: #e65100; }',

      // Search
      '.dep-search-container {',
      '  padding: 8px 12px;',
      '  border-bottom: 1px solid ' + border + ';',
      '}',
      '.dep-search-input {',
      '  width: 100%;',
      '  padding: 6px 10px;',
      '  font-size: 13px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  border: 1px solid ' + inputBorder + ';',
      '  border-radius: 6px;',
      '  background: ' + inputBg + ';',
      '  color: ' + text + ';',
      '  outline: none;',
      '}',
      '.dep-search-input:focus {',
      '  border-color: ' + accentColor + ';',
      '  box-shadow: 0 0 0 2px rgba(245, 124, 0, 0.2);',
      '}',
      '.dep-search-input::placeholder { color: ' + textMuted + '; }',

      // Content
      '.dep-content { padding: 4px 0; }',

      // Groups
      '.dep-group { margin: 0; }',
      '.dep-group-header {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 6px;',
      '  padding: 6px 12px;',
      '  background: ' + bgAlt + ';',
      '  border-top: 1px solid ' + border + ';',
      '  border-bottom: 1px solid ' + border + ';',
      '  cursor: pointer;',
      '  user-select: none;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  font-size: 12px;',
      '  font-weight: 600;',
      '  color: ' + textMuted + ';',
      '  text-transform: uppercase;',
      '  letter-spacing: 0.5px;',
      '}',
      '.dep-group-header:hover { background: ' + hoverBg + '; }',
      '.dep-group-arrow {',
      '  font-size: 10px;',
      '  width: 12px;',
      '  text-align: center;',
      '  transition: transform 0.15s;',
      '}',
      '.dep-group-label { flex: 1; }',
      '.dep-group-count {',
      '  font-weight: 400;',
      '  font-size: 11px;',
      '  color: ' + textMuted + ';',
      '}',

      // Lines
      '.dep-line {',
      '  display: flex;',
      '  align-items: baseline;',
      '  gap: 4px;',
      '  padding: 2px 12px;',
      '  min-height: 24px;',
      '  transition: background 0.1s;',
      '}',
      '.dep-line:hover { background: ' + hoverBg + '; }',
      '.dep-line-num {',
      '  display: inline-block;',
      '  width: 40px;',
      '  flex-shrink: 0;',
      '  text-align: right;',
      '  color: ' + textMuted + ';',
      '  font-size: 12px;',
      '  padding-right: 12px;',
      '  user-select: none;',
      '}',

      // Comment lines
      '.dep-comment {',
      '  color: ' + commentColor + ';',
      '  font-style: italic;',
      '}',

      // Variable lines
      '.dep-key {',
      '  color: ' + keyColor + ';',
      '  font-weight: 700;',
      '}',
      '.dep-equals {',
      '  color: ' + textMuted + ';',
      '  margin: 0 2px;',
      '}',
      '.dep-value { flex: 1; word-break: break-all; }',
      '.dep-value-string { color: ' + valueStringColor + '; }',
      '.dep-value-number { color: ' + valueNumColor + '; }',
      '.dep-value-boolean { color: ' + valueBoolColor + '; }',
      '.dep-value-url { color: ' + valueStringColor + '; }',
      '.dep-value-empty { color: ' + textMuted + '; font-style: italic; }',

      // Sensitive values
      '.dep-sensitive {',
      '  background: ' + sensitiveRed + ';',
      '  border-radius: 3px;',
      '  padding: 0 4px;',
      '  border: 1px solid ' + sensitiveBorder + ';',
      '}',
      '.dep-masked {',
      '  filter: blur(5px);',
      '  cursor: pointer;',
      '  transition: filter 0.2s;',
      '  user-select: none;',
      '}',
      '.dep-masked:hover { filter: blur(3px); }',

      // Placeholder values
      '.dep-placeholder {',
      '  background: ' + placeholderYellow + ';',
      '  border-radius: 3px;',
      '  padding: 0 4px;',
      '  border: 1px dashed ' + placeholderBorder + ';',
      '}',

      // Icons
      '.dep-icon-warn, .dep-icon-hint {',
      '  flex-shrink: 0;',
      '  font-size: 14px;',
      '  margin-right: 4px;',
      '}',

      // Copy button
      '.dep-copy-btn {',
      '  flex-shrink: 0;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '  font-size: 11px;',
      '  padding: 1px 8px;',
      '  border: 1px solid ' + border + ';',
      '  border-radius: 4px;',
      '  background: ' + copyBtnBg + ';',
      '  color: ' + textMuted + ';',
      '  cursor: pointer;',
      '  opacity: 0;',
      '  transition: opacity 0.15s, background 0.15s;',
      '}',
      '.dep-line:hover .dep-copy-btn { opacity: 1; }',
      '.dep-copy-btn:hover { background: ' + copyBtnHover + '; color: ' + text + '; }',
      '.dep-copied { color: ' + accentColor + ' !important; border-color: ' + accentColor + ' !important; }'
    ].join('\n');
  }

})();
