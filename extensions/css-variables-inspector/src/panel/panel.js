/**
 * panel.js
 * Main logic for the CSS Variables Inspector sidebar panel.
 * Reads CSS custom properties from the inspected element and displays
 * them with resolution chains, color swatches, and copy support.
 */

/* ===== DOM references ===== */
var searchInput = document.getElementById('search-input');
var groupSelect = document.getElementById('group-select');
var statusMessage = document.getElementById('status-message');
var container = document.getElementById('variables-container');
var copyToast = document.getElementById('copy-toast');

/* ===== State ===== */
var lastVariableData = null;
var copyToastTimeout = null;

/* ===== Initialize ===== */
loadPreferences();
updatePanel();

/* Listen for element selection changes */
if (chrome.devtools && chrome.devtools.panels) {
  chrome.devtools.panels.elements.onSelectionChanged.addListener(updatePanel);
}

/* Listen for search input */
searchInput.addEventListener('input', function () {
  renderVariables(lastVariableData);
  savePreferences();
});

/* Listen for group mode changes */
groupSelect.addEventListener('change', function () {
  renderVariables(lastVariableData);
  savePreferences();
});

/* ===== Main update function ===== */

/**
 * Fetch CSS variable data from the inspected element and render it.
 */
function updatePanel() {
  chrome.devtools.inspectedWindow.eval(
    '(' + gatherCSSVariables.toString() + ')()',
    function (result, error) {
      if (error || !result) {
        showStatus('Select an element to inspect its CSS variables.');
        lastVariableData = null;
        container.innerHTML = '';
        return;
      }

      lastVariableData = result;
      renderVariables(result);
    }
  );
}

/* ===== Data gathering function (runs in inspected page context) ===== */

/**
 * Gathers all CSS custom properties relevant to the selected element.
 * This function is serialized and executed in the inspected page via eval().
 * It cannot reference anything outside its own scope.
 */
function gatherCSSVariables() {
  var el = $0; /* $0 is the currently selected element in DevTools */
  if (!el) return null;

  var variables = [];
  var seen = {};

  /**
   * Check if a string looks like a CSS color value.
   */
  function isColorValue(val) {
    if (!val || typeof val !== 'string') return false;
    val = val.trim();
    /* Hex colors */
    if (/^#([0-9a-fA-F]{3,8})$/.test(val)) return true;
    /* rgb/rgba/hsl/hsla/hwb/lab/lch/oklch/oklab */
    if (/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklch|oklab)\s*\(/.test(val)) return true;
    /* Named colors (common subset) */
    var named = [
      'red','blue','green','black','white','gray','grey','orange','purple',
      'yellow','cyan','magenta','pink','brown','transparent','currentcolor',
      'navy','teal','olive','maroon','aqua','lime','silver','fuchsia'
    ];
    if (named.indexOf(val.toLowerCase()) !== -1) return true;
    return false;
  }

  /**
   * Resolve a CSS variable reference chain.
   * Returns an array of steps: [{name, value}, ...] ending with the final value.
   */
  function resolveChain(varName, computedStyle, visitedSet) {
    if (!visitedSet) visitedSet = {};
    if (visitedSet[varName]) return []; /* prevent cycles */
    visitedSet[varName] = true;

    var chain = [];
    var rawValue = getRawVariableValue(varName);

    if (!rawValue) return [];

    /* Check if the raw value itself references another variable */
    var refMatch = rawValue.match(/var\(\s*(--[a-zA-Z0-9_-]+)/);
    if (refMatch) {
      var nextVar = refMatch[1];
      chain.push({ name: varName, value: rawValue });
      var subChain = resolveChain(nextVar, computedStyle, visitedSet);
      chain = chain.concat(subChain);
    } else {
      chain.push({ name: varName, value: rawValue });
    }

    return chain;
  }

  /**
   * Get the raw (un-resolved) value of a CSS variable from stylesheets.
   */
  function getRawVariableValue(varName) {
    /* Check inline style first */
    if (el.style && el.style.getPropertyValue(varName)) {
      return el.style.getPropertyValue(varName).trim();
    }

    /* Walk through stylesheets */
    var sheets = document.styleSheets;
    var matchedValue = null;

    for (var s = 0; s < sheets.length; s++) {
      try {
        var rules = sheets[s].cssRules || sheets[s].rules;
        if (!rules) continue;

        for (var r = 0; r < rules.length; r++) {
          var rule = rules[r];
          if (!rule.style) continue;
          var val = rule.style.getPropertyValue(varName);
          if (val && val.trim()) {
            /* Check if the element matches this rule's selector */
            try {
              if (el.matches(rule.selectorText)) {
                matchedValue = val.trim();
              }
            } catch (e) {
              /* Some selectors may be invalid for matches() */
            }
          }
        }
      } catch (e) {
        /* Cross-origin stylesheets will throw */
      }
    }

    return matchedValue;
  }

  /**
   * Find which source (stylesheet or inline) defines a variable.
   */
  function findVariableSource(varName) {
    /* Check inline style */
    if (el.style && el.style.getPropertyValue(varName)) {
      return 'inline';
    }

    /* Check stylesheets */
    var sheets = document.styleSheets;
    for (var s = 0; s < sheets.length; s++) {
      try {
        var rules = sheets[s].cssRules || sheets[s].rules;
        if (!rules) continue;

        for (var r = 0; r < rules.length; r++) {
          var rule = rules[r];
          if (!rule.style) continue;
          var val = rule.style.getPropertyValue(varName);
          if (val && val.trim()) {
            /* Try to get a friendly sheet name */
            var href = sheets[s].href;
            if (href) {
              /* Extract filename from URL */
              var parts = href.split('/');
              return parts[parts.length - 1].split('?')[0];
            }
            if (sheets[s].ownerNode && sheets[s].ownerNode.tagName === 'STYLE') {
              return '<style> tag';
            }
            return 'stylesheet';
          }
        }
      } catch (e) {
        /* Cross-origin */
      }
    }

    return 'inherited';
  }

  /**
   * Walk up the DOM tree and collect all CSS variables in scope.
   */
  function collectVariablesInScope(element) {
    var allVars = {};
    var current = element;

    while (current && current.nodeType === 1) {
      var computed = window.getComputedStyle(current);

      /* Check inline styles for custom properties */
      if (current.style) {
        for (var i = 0; i < current.style.length; i++) {
          var prop = current.style[i];
          if (prop.startsWith('--') && !allVars[prop]) {
            allVars[prop] = {
              defined: true,
              element: current === element ? 'self' : current.tagName.toLowerCase()
            };
          }
        }
      }

      current = current.parentElement;
    }

    /* Also collect from :root and stylesheets */
    var sheets = document.styleSheets;
    for (var s = 0; s < sheets.length; s++) {
      try {
        var rules = sheets[s].cssRules || sheets[s].rules;
        if (!rules) continue;

        for (var r = 0; r < rules.length; r++) {
          var rule = rules[r];
          if (!rule.style) continue;

          /* Check if element matches this rule, or if it's :root/html/body */
          var isGlobal = false;
          try {
            isGlobal = /^(:root|html|body|\*)/.test(rule.selectorText || '');
          } catch (e) {}

          var matches = false;
          try {
            matches = element.matches(rule.selectorText);
          } catch (e) {}

          if (isGlobal || matches) {
            for (var p = 0; p < rule.style.length; p++) {
              var propName = rule.style[p];
              if (propName.startsWith('--') && !allVars[propName]) {
                allVars[propName] = { defined: true };
              }
            }
          }
        }
      } catch (e) {
        /* Cross-origin */
      }
    }

    return allVars;
  }

  /* Collect all variables in scope */
  var allVarsInScope = collectVariablesInScope(el);
  var computedStyle = window.getComputedStyle(el);

  /* Also scan the element's used properties for var() references */
  var usedVarNames = {};
  var sheets2 = document.styleSheets;
  for (var s2 = 0; s2 < sheets2.length; s2++) {
    try {
      var rules2 = sheets2[s2].cssRules || sheets2[s2].rules;
      if (!rules2) continue;
      for (var r2 = 0; r2 < rules2.length; r2++) {
        var rule2 = rules2[r2];
        if (!rule2.style || !rule2.cssText) continue;
        try {
          if (!el.matches(rule2.selectorText)) continue;
        } catch (e) { continue; }
        /* Find all var(--xxx) references in the rule text */
        var varRefs = rule2.cssText.match(/var\(\s*(--[a-zA-Z0-9_-]+)/g);
        if (varRefs) {
          for (var v = 0; v < varRefs.length; v++) {
            var refName = varRefs[v].replace(/var\(\s*/, '');
            usedVarNames[refName] = true;
          }
        }
      }
    } catch (e) {}
  }

  /* Also check inline style for var() references */
  if (el.getAttribute('style')) {
    var inlineRefs = el.getAttribute('style').match(/var\(\s*(--[a-zA-Z0-9_-]+)/g);
    if (inlineRefs) {
      for (var ir = 0; ir < inlineRefs.length; ir++) {
        var inlineRefName = inlineRefs[ir].replace(/var\(\s*/, '');
        usedVarNames[inlineRefName] = true;
      }
    }
  }

  /* Merge used vars into allVarsInScope */
  for (var usedName in usedVarNames) {
    if (!allVarsInScope[usedName]) {
      allVarsInScope[usedName] = { defined: false };
    }
  }

  /* Build the result array */
  for (var varName in allVarsInScope) {
    var resolvedValue = computedStyle.getPropertyValue(varName).trim();
    var isDefined = resolvedValue !== '';
    var source = isDefined ? findVariableSource(varName) : 'undefined';
    var chain = resolveChain(varName, computedStyle);
    var isColor = isColorValue(resolvedValue);

    /* Build a serializable chain array */
    var chainSteps = [];
    if (chain.length > 1) {
      for (var c = 0; c < chain.length; c++) {
        chainSteps.push({
          name: chain[c].name,
          value: chain[c].value
        });
      }
      /* Add the final resolved value */
      if (resolvedValue && chain[chain.length - 1].value !== resolvedValue) {
        chainSteps.push({ name: null, value: resolvedValue });
      }
    }

    variables.push({
      name: varName,
      value: resolvedValue || '',
      rawValue: getRawVariableValue(varName) || resolvedValue || '',
      source: source,
      isColor: isColor,
      isDefined: isDefined,
      chain: chainSteps
    });
  }

  /* Sort: defined first, then alphabetically */
  variables.sort(function (a, b) {
    if (a.isDefined !== b.isDefined) return a.isDefined ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    tagName: el.tagName.toLowerCase(),
    id: el.id || '',
    classList: Array.prototype.slice.call(el.classList).join(' '),
    variables: variables,
    totalCount: variables.length,
    undefinedCount: variables.filter(function (v) { return !v.isDefined; }).length
  };
}

/* ===== Rendering ===== */

/**
 * Show a status message and hide the variables container.
 */
function showStatus(msg) {
  statusMessage.textContent = msg;
  statusMessage.classList.remove('hidden');
  container.innerHTML = '';
}

/**
 * Hide the status message.
 */
function hideStatus() {
  statusMessage.classList.add('hidden');
}

/**
 * Render the collected variable data into the panel.
 */
function renderVariables(data) {
  if (!data || !data.variables || data.variables.length === 0) {
    container.innerHTML = '';
    showStatus(data ? 'No CSS variables found on this element.' : 'Select an element to inspect its CSS variables.');
    return;
  }

  hideStatus();
  container.innerHTML = '';

  var filter = searchInput.value.toLowerCase().trim();
  var groupMode = groupSelect.value;

  /* Filter variables by search term */
  var filtered = data.variables.filter(function (v) {
    if (!filter) return true;
    return v.name.toLowerCase().indexOf(filter) !== -1 ||
           v.value.toLowerCase().indexOf(filter) !== -1;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results">No variables match your filter.</div>';
    return;
  }

  /* Add summary bar */
  var summaryBar = document.createElement('div');
  summaryBar.className = 'summary-bar';

  var totalStat = createStat(filtered.length, 'variables');
  summaryBar.appendChild(totalStat);

  var undefinedCount = filtered.filter(function (v) { return !v.isDefined; }).length;
  if (undefinedCount > 0) {
    var undefinedStat = createStat(undefinedCount, 'undefined');
    undefinedStat.querySelector('.stat-num').style.color = '#dc2626';
    summaryBar.appendChild(undefinedStat);
  }

  var colorCount = filtered.filter(function (v) { return v.isColor; }).length;
  if (colorCount > 0) {
    summaryBar.appendChild(createStat(colorCount, 'colors'));
  }

  container.appendChild(summaryBar);

  /* Render based on group mode */
  if (groupMode === 'source') {
    renderGroupedBySource(filtered);
  } else {
    renderFlat(filtered);
  }
}

/**
 * Create a summary stat element.
 */
function createStat(num, label) {
  var stat = document.createElement('div');
  stat.className = 'stat';
  var numSpan = document.createElement('span');
  numSpan.className = 'stat-num';
  numSpan.textContent = num;
  var labelSpan = document.createElement('span');
  labelSpan.className = 'stat-label';
  labelSpan.textContent = label;
  stat.appendChild(numSpan);
  stat.appendChild(labelSpan);
  return stat;
}

/**
 * Render variables in a flat list (no grouping).
 */
function renderFlat(variables) {
  for (var i = 0; i < variables.length; i++) {
    appendVariableRow(container, variables[i]);
  }
}

/**
 * Render variables grouped by their source.
 */
function renderGroupedBySource(variables) {
  var groups = {};
  var groupOrder = [];

  for (var i = 0; i < variables.length; i++) {
    var source = variables[i].source || 'unknown';
    if (!groups[source]) {
      groups[source] = [];
      groupOrder.push(source);
    }
    groups[source].push(variables[i]);
  }

  for (var g = 0; g < groupOrder.length; g++) {
    var sourceName = groupOrder[g];
    var groupVars = groups[sourceName];

    var groupEl = document.createElement('div');
    groupEl.className = 'source-group';

    /* Group header */
    var header = document.createElement('div');
    header.className = 'source-header';

    var arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '\u25BC';

    var title = document.createElement('span');
    title.textContent = sourceName;

    var count = document.createElement('span');
    count.className = 'count';
    count.textContent = groupVars.length;

    header.appendChild(arrow);
    header.appendChild(title);
    header.appendChild(count);

    /* Items container */
    var items = document.createElement('div');
    items.className = 'source-group-items';

    /* Toggle collapse on header click */
    header.addEventListener('click', (function (arrowRef, itemsRef) {
      return function () {
        arrowRef.classList.toggle('collapsed');
        itemsRef.classList.toggle('collapsed');
      };
    })(arrow, items));

    /* Add variable rows */
    for (var v = 0; v < groupVars.length; v++) {
      appendVariableRow(items, groupVars[v]);
    }

    groupEl.appendChild(header);
    groupEl.appendChild(items);
    container.appendChild(groupEl);
  }
}

/**
 * Create and append a single variable row (and optional chain row).
 */
function appendVariableRow(parent, varData) {
  var row = document.createElement('div');
  row.className = 'var-row';
  if (!varData.isDefined) {
    row.classList.add('undefined-var');
  }

  /* Color swatch (if applicable) */
  if (varData.isColor && varData.value) {
    var swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = varData.value;
    row.appendChild(swatch);
  }

  /* Variable name */
  var nameEl = document.createElement('span');
  nameEl.className = 'var-name';
  nameEl.textContent = varData.name;
  row.appendChild(nameEl);

  /* Separator */
  var sep = document.createElement('span');
  sep.className = 'var-separator';
  sep.textContent = ':';
  row.appendChild(sep);

  /* Variable value */
  var valueEl = document.createElement('span');
  valueEl.className = 'var-value';
  valueEl.textContent = varData.isDefined ? varData.value : '';
  row.appendChild(valueEl);

  /* Undefined badge */
  if (!varData.isDefined) {
    var badge = document.createElement('span');
    badge.className = 'undefined-badge';
    badge.textContent = 'undefined';
    row.appendChild(badge);
  }

  /* Copy button */
  var copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = '\u2398';
  copyBtn.title = 'Copy ' + varData.name + ': ' + varData.value;
  copyBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    copyToClipboard(varData.name + ': ' + varData.value);
  });
  row.appendChild(copyBtn);

  parent.appendChild(row);

  /* Resolution chain (if variable references other variables) */
  if (varData.chain && varData.chain.length > 1) {
    var chainRow = document.createElement('div');
    chainRow.className = 'var-chain';

    for (var c = 0; c < varData.chain.length; c++) {
      if (c > 0) {
        var arrow = document.createElement('span');
        arrow.className = 'chain-arrow';
        arrow.textContent = '\u2192';
        chainRow.appendChild(arrow);
      }

      var step = document.createElement('span');
      step.className = 'chain-step';
      if (c === varData.chain.length - 1) {
        step.classList.add('final');
      }

      if (varData.chain[c].name) {
        step.textContent = 'var(' + varData.chain[c].name + ')';
      } else {
        step.textContent = varData.chain[c].value;
      }

      chainRow.appendChild(step);
    }

    parent.appendChild(chainRow);
  }
}

/* ===== Clipboard ===== */

/**
 * Copy text to clipboard and show a toast notification.
 */
function copyToClipboard(text) {
  /* Use the clipboard API via the devtools page context */
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);

  /* Show toast */
  showCopyToast();
}

/**
 * Show a brief "Copied!" toast notification.
 */
function showCopyToast() {
  copyToast.classList.add('visible');
  clearTimeout(copyToastTimeout);
  copyToastTimeout = setTimeout(function () {
    copyToast.classList.remove('visible');
  }, 1200);
}

/* ===== Preferences ===== */

/**
 * Save user preferences to chrome.storage.local.
 */
function savePreferences() {
  chrome.storage.local.set({
    cssVarInspector: {
      groupMode: groupSelect.value,
      lastFilter: searchInput.value
    }
  });
}

/**
 * Load user preferences from chrome.storage.local.
 */
function loadPreferences() {
  chrome.storage.local.get('cssVarInspector', function (data) {
    if (data && data.cssVarInspector) {
      if (data.cssVarInspector.groupMode) {
        groupSelect.value = data.cssVarInspector.groupMode;
      }
      /* Don't restore filter — start fresh each session */
    }
  });
}
