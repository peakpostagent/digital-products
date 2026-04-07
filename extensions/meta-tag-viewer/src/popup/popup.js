/**
 * Meta Tag Viewer — Popup script
 * Reads meta tags from the active tab via chrome.scripting and displays them.
 */

/* ===== Utility: Escape HTML to prevent XSS ===== */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===== Toast notification ===== */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(function () {
    toast.classList.add('hidden');
  }, 2000);
}

/* ===== Collapsible sections ===== */
function initCollapsibles() {
  var headers = document.querySelectorAll('.section-header');
  headers.forEach(function (header) {
    header.addEventListener('click', function () {
      var expanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', String(!expanded));
      var body = header.nextElementSibling;
      body.classList.toggle('collapsed', expanded);
    });
  });
}

/* ===== Build a single tag row ===== */
function buildTagRow(label, value, options) {
  options = options || {};
  var row = document.createElement('div');
  row.className = 'tag-row';

  var labelEl = document.createElement('div');
  labelEl.className = 'tag-label';
  labelEl.textContent = label;
  row.appendChild(labelEl);

  var valueEl = document.createElement('div');
  valueEl.className = 'tag-value';

  if (!value && value !== 0) {
    valueEl.classList.add('missing');
    valueEl.textContent = 'Missing';
  } else {
    valueEl.innerHTML = escapeHtml(value);

    /* Character count display */
    if (options.maxChars) {
      var count = value.length;
      var countEl = document.createElement('div');
      countEl.className = 'char-count';
      countEl.textContent = count + ' / ' + options.maxChars + ' chars';
      if (count > options.maxChars) {
        countEl.classList.add('warn');
      } else {
        countEl.classList.add('good');
      }
      valueEl.appendChild(countEl);
    }

    /* Canonical URL mismatch warning */
    if (options.canonicalWarn) {
      var warn = document.createElement('div');
      warn.className = 'canonical-warn';
      warn.textContent = 'Differs from current URL';
      valueEl.appendChild(warn);
    }

    /* Favicon preview */
    if (options.faviconUrl) {
      var img = document.createElement('img');
      img.className = 'favicon-preview';
      img.src = options.faviconUrl;
      img.alt = 'Favicon';
      img.onerror = function () { img.style.display = 'none'; };
      valueEl.insertBefore(img, valueEl.firstChild);
    }

    /* OG image preview */
    if (options.imagePreview) {
      var ogImg = document.createElement('img');
      ogImg.className = 'og-image-preview';
      ogImg.src = options.imagePreview;
      ogImg.alt = 'OG Image';
      ogImg.onerror = function () { ogImg.style.display = 'none'; };
      valueEl.appendChild(ogImg);
    }
  }

  row.appendChild(valueEl);
  return row;
}

/* ===== Calculate SEO score ===== */
function calculateScore(data) {
  var checks = [
    { name: 'title', present: !!data.title },
    { name: 'description', present: !!data.description },
    { name: 'viewport', present: !!data.viewport },
    { name: 'charset', present: !!data.charset },
    { name: 'canonical', present: !!data.canonical },
    { name: 'og:title', present: !!data.ogTitle },
    { name: 'og:description', present: !!data.ogDescription },
    { name: 'og:image', present: !!data.ogImage },
    { name: 'twitter:card', present: !!data.twitterCard },
    { name: 'favicon', present: !!data.favicon }
  ];

  var passed = checks.filter(function (c) { return c.present; }).length;
  return Math.round((passed / checks.length) * 100);
}

/* ===== Update score bar ===== */
function updateScoreBar(score) {
  var fill = document.getElementById('score-fill');
  var text = document.getElementById('score-text');

  fill.style.width = score + '%';
  text.textContent = 'SEO Score: ' + score + '%';

  if (score >= 80) {
    fill.style.background = 'var(--ctp-green)';
  } else if (score >= 50) {
    fill.style.background = 'var(--ctp-yellow)';
  } else {
    fill.style.background = 'var(--ctp-red)';
  }
}

/* ===== Count section issues for badges ===== */
function updateSectionBadges(sectionEl, missing, warnings) {
  var badgesEl = sectionEl.querySelector('.section-badges');
  badgesEl.innerHTML = '';

  if (missing > 0) {
    var badge = document.createElement('span');
    badge.className = 'badge badge-red';
    badge.textContent = missing + ' missing';
    badgesEl.appendChild(badge);
  }
  if (warnings > 0) {
    var badge = document.createElement('span');
    badge.className = 'badge badge-yellow';
    badge.textContent = warnings + ' warn';
    badgesEl.appendChild(badge);
  }
  if (missing === 0 && warnings === 0) {
    var badge = document.createElement('span');
    badge.className = 'badge badge-green';
    badge.textContent = 'OK';
    badgesEl.appendChild(badge);
  }
}

/* ===== Render all meta tag data ===== */
function renderData(data) {
  /* ----- Basic SEO ----- */
  var basicEl = document.getElementById('section-basic');
  basicEl.innerHTML = '';
  var basicMissing = 0;
  var basicWarnings = 0;

  /* Title */
  basicEl.appendChild(buildTagRow('Title', data.title, { maxChars: 60 }));
  if (!data.title) basicMissing++;
  else if (data.title.length > 60) basicWarnings++;

  /* Description */
  basicEl.appendChild(buildTagRow('Description', data.description, { maxChars: 160 }));
  if (!data.description) basicMissing++;
  else if (data.description.length > 160) basicWarnings++;

  /* Canonical */
  var canonicalDiffers = data.canonical && data.currentUrl &&
    data.canonical !== data.currentUrl;
  basicEl.appendChild(buildTagRow('Canonical', data.canonical, {
    canonicalWarn: canonicalDiffers
  }));
  if (canonicalDiffers) basicWarnings++;

  /* Robots */
  basicEl.appendChild(buildTagRow('Robots', data.robots || null));

  /* X-Robots-Tag (from meta, not HTTP header) */
  if (data.xRobotsTag) {
    basicEl.appendChild(buildTagRow('X-Robots-Tag', data.xRobotsTag));
  }

  var basicSection = document.querySelector('[data-section="basic"]');
  updateSectionBadges(basicSection, basicMissing, basicWarnings);

  /* ----- Open Graph ----- */
  var ogEl = document.getElementById('section-og');
  ogEl.innerHTML = '';
  var ogMissing = 0;

  var ogTags = [
    { label: 'og:title', value: data.ogTitle },
    { label: 'og:description', value: data.ogDescription },
    { label: 'og:image', value: data.ogImage, imagePreview: data.ogImage },
    { label: 'og:url', value: data.ogUrl },
    { label: 'og:type', value: data.ogType },
    { label: 'og:site_name', value: data.ogSiteName }
  ];

  ogTags.forEach(function (tag) {
    var opts = {};
    if (tag.imagePreview) opts.imagePreview = tag.imagePreview;
    ogEl.appendChild(buildTagRow(tag.label, tag.value, opts));
    if (!tag.value) ogMissing++;
  });

  var ogSection = document.querySelector('[data-section="og"]');
  updateSectionBadges(ogSection, ogMissing, 0);

  /* ----- Twitter Cards ----- */
  var twEl = document.getElementById('section-twitter');
  twEl.innerHTML = '';
  var twMissing = 0;

  var twTags = [
    { label: 'twitter:card', value: data.twitterCard },
    { label: 'twitter:title', value: data.twitterTitle },
    { label: 'twitter:description', value: data.twitterDescription },
    { label: 'twitter:image', value: data.twitterImage, imagePreview: data.twitterImage }
  ];

  twTags.forEach(function (tag) {
    var opts = {};
    if (tag.imagePreview) opts.imagePreview = tag.imagePreview;
    twEl.appendChild(buildTagRow(tag.label, tag.value, opts));
    if (!tag.value) twMissing++;
  });

  var twSection = document.querySelector('[data-section="twitter"]');
  updateSectionBadges(twSection, twMissing, 0);

  /* ----- Technical ----- */
  var techEl = document.getElementById('section-technical');
  techEl.innerHTML = '';
  var techMissing = 0;

  /* Viewport */
  techEl.appendChild(buildTagRow('Viewport', data.viewport));
  if (!data.viewport) techMissing++;

  /* Charset */
  techEl.appendChild(buildTagRow('Charset', data.charset));
  if (!data.charset) techMissing++;

  /* Favicon */
  techEl.appendChild(buildTagRow('Favicon', data.favicon, {
    faviconUrl: data.favicon
  }));
  if (!data.favicon) techMissing++;

  var techSection = document.querySelector('[data-section="technical"]');
  updateSectionBadges(techSection, techMissing, 0);

  /* ----- Score ----- */
  var score = calculateScore(data);
  updateScoreBar(score);
}

/* ===== Build clipboard summary ===== */
function buildClipboardText(data) {
  var lines = [];
  lines.push('=== Meta Tag Report ===');
  lines.push('URL: ' + (data.currentUrl || ''));
  lines.push('');
  lines.push('--- Basic SEO ---');
  lines.push('Title: ' + (data.title || '(missing)') +
    (data.title ? ' [' + data.title.length + ' chars]' : ''));
  lines.push('Description: ' + (data.description || '(missing)') +
    (data.description ? ' [' + data.description.length + ' chars]' : ''));
  lines.push('Canonical: ' + (data.canonical || '(missing)'));
  lines.push('Robots: ' + (data.robots || '(not set)'));
  if (data.xRobotsTag) lines.push('X-Robots-Tag: ' + data.xRobotsTag);
  lines.push('');
  lines.push('--- Open Graph ---');
  lines.push('og:title: ' + (data.ogTitle || '(missing)'));
  lines.push('og:description: ' + (data.ogDescription || '(missing)'));
  lines.push('og:image: ' + (data.ogImage || '(missing)'));
  lines.push('og:url: ' + (data.ogUrl || '(missing)'));
  lines.push('og:type: ' + (data.ogType || '(missing)'));
  lines.push('og:site_name: ' + (data.ogSiteName || '(missing)'));
  lines.push('');
  lines.push('--- Twitter Cards ---');
  lines.push('twitter:card: ' + (data.twitterCard || '(missing)'));
  lines.push('twitter:title: ' + (data.twitterTitle || '(missing)'));
  lines.push('twitter:description: ' + (data.twitterDescription || '(missing)'));
  lines.push('twitter:image: ' + (data.twitterImage || '(missing)'));
  lines.push('');
  lines.push('--- Technical ---');
  lines.push('Viewport: ' + (data.viewport || '(missing)'));
  lines.push('Charset: ' + (data.charset || '(missing)'));
  lines.push('Favicon: ' + (data.favicon || '(missing)'));
  lines.push('');
  lines.push('SEO Score: ' + calculateScore(data) + '%');
  return lines.join('\n');
}

/* ===== Extract meta tags from page (runs in page context) ===== */
function extractMetaTags() {
  /** Helper to get meta tag content by name or property */
  function getMeta(attr, value) {
    var el = document.querySelector(
      'meta[' + attr + '="' + value + '"]'
    );
    return el ? el.getAttribute('content') || '' : '';
  }

  /** Get the page title */
  var title = document.title || '';

  /** Meta description */
  var description = getMeta('name', 'description') ||
    getMeta('property', 'description');

  /** Open Graph */
  var ogTitle = getMeta('property', 'og:title');
  var ogDescription = getMeta('property', 'og:description');
  var ogImage = getMeta('property', 'og:image');
  var ogUrl = getMeta('property', 'og:url');
  var ogType = getMeta('property', 'og:type');
  var ogSiteName = getMeta('property', 'og:site_name');

  /** Twitter Cards */
  var twitterCard = getMeta('name', 'twitter:card') ||
    getMeta('property', 'twitter:card');
  var twitterTitle = getMeta('name', 'twitter:title') ||
    getMeta('property', 'twitter:title');
  var twitterDescription = getMeta('name', 'twitter:description') ||
    getMeta('property', 'twitter:description');
  var twitterImage = getMeta('name', 'twitter:image') ||
    getMeta('property', 'twitter:image');

  /** Canonical URL */
  var canonicalEl = document.querySelector('link[rel="canonical"]');
  var canonical = canonicalEl ? canonicalEl.getAttribute('href') || '' : '';

  /** Robots */
  var robots = getMeta('name', 'robots');

  /** X-Robots-Tag (meta version) */
  var xRobotsTag = getMeta('name', 'x-robots-tag') ||
    getMeta('http-equiv', 'x-robots-tag');

  /** Viewport */
  var viewport = getMeta('name', 'viewport');

  /** Charset */
  var charsetEl = document.querySelector('meta[charset]');
  var charset = charsetEl ? charsetEl.getAttribute('charset') : '';
  if (!charset) {
    var httpCharset = getMeta('http-equiv', 'content-type');
    if (httpCharset) {
      var match = httpCharset.match(/charset=([^\s;]+)/i);
      if (match) charset = match[1];
    }
  }

  /** Favicon */
  var faviconEl = document.querySelector(
    'link[rel="icon"], link[rel="shortcut icon"]'
  );
  var favicon = faviconEl ? faviconEl.getAttribute('href') || '' : '';
  /* Resolve relative favicon URLs */
  if (favicon && !favicon.startsWith('http') && !favicon.startsWith('data:')) {
    try {
      favicon = new URL(favicon, document.location.href).href;
    } catch (e) {
      /* keep as-is */
    }
  }

  return {
    title: title,
    description: description,
    ogTitle: ogTitle,
    ogDescription: ogDescription,
    ogImage: ogImage,
    ogUrl: ogUrl,
    ogType: ogType,
    ogSiteName: ogSiteName,
    twitterCard: twitterCard,
    twitterTitle: twitterTitle,
    twitterDescription: twitterDescription,
    twitterImage: twitterImage,
    canonical: canonical,
    robots: robots,
    xRobotsTag: xRobotsTag,
    viewport: viewport,
    charset: charset,
    favicon: favicon,
    currentUrl: document.location.href
  };
}

/* ===== Main: fetch and display meta tags ===== */
var currentData = null;

function fetchMetaTags() {
  /* Show loading state */
  var sections = ['section-basic', 'section-og', 'section-twitter', 'section-technical'];
  sections.forEach(function (id) {
    document.getElementById(id).innerHTML = '<div class="loading">Loading...</div>';
  });

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (!tabs || !tabs[0]) {
      showError('No active tab found.');
      return;
    }

    var tab = tabs[0];

    /* Prevent running on chrome:// or edge:// pages */
    if (!tab.url || tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
      showError('Cannot read meta tags from this page.');
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: extractMetaTags
      },
      function (results) {
        if (chrome.runtime.lastError) {
          showError('Error: ' + chrome.runtime.lastError.message);
          return;
        }

        if (!results || !results[0] || !results[0].result) {
          showError('Could not read meta tags.');
          return;
        }

        currentData = results[0].result;
        renderData(currentData);
      }
    );
  });
}

/* ===== Show error state ===== */
function showError(message) {
  var sections = ['section-basic', 'section-og', 'section-twitter', 'section-technical'];
  sections.forEach(function (id, i) {
    if (i === 0) {
      document.getElementById(id).innerHTML =
        '<div class="error-state">' + escapeHtml(message) + '</div>';
    } else {
      document.getElementById(id).innerHTML = '';
    }
  });
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', function () {
  initCollapsibles();
  fetchMetaTags();

  /* Refresh button */
  document.getElementById('btn-refresh').addEventListener('click', function () {
    fetchMetaTags();
  });

  /* Copy all button */
  document.getElementById('btn-copy').addEventListener('click', function () {
    if (!currentData) {
      showToast('No data to copy');
      return;
    }
    var text = buildClipboardText(currentData);
    navigator.clipboard.writeText(text).then(function () {
      showToast('Copied to clipboard');
    }).catch(function () {
      showToast('Copy failed');
    });
  });
});
