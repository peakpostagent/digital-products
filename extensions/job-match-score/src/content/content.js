// content.js — Injected into LinkedIn job listing pages
// Depends on matcher.js being loaded first (via manifest.json script order)

(function () {
  let scoreOverlay = null;
  let lastAnalyzedUrl = null; // Cache: avoid re-analyzing same listing

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Extract job description text from LinkedIn's DOM
   */
  function extractJobDescription() {
    const selectors = [
      '.jobs-description__content',
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '[class*="jobs-description"]',
      '#job-details'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim().length > 50) {
        return el.textContent.trim();
      }
    }

    return null;
  }

  /**
   * Create or update the floating score badge
   */
  function showScoreBadge(score, matched, missing) {
    if (scoreOverlay) {
      scoreOverlay.remove();
    }

    const host = document.createElement('div');
    host.id = 'jms-score-host';
    // Position above LinkedIn's messaging bar
    host.style.cssText = 'position:fixed; bottom:80px; right:20px; z-index:999999;';

    const shadow = host.attachShadow({ mode: 'closed' });

    let color, label;
    if (score >= 70) {
      color = '#16a34a'; label = 'Great match!';
    } else if (score >= 40) {
      color = '#ca8a04'; label = 'Partial match';
    } else {
      color = '#dc2626'; label = 'Low match';
    }

    shadow.innerHTML = `
      <style>
        .jms-badge {
          background: white;
          border: 2px solid ${color};
          border-radius: 16px;
          padding: 12px 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          max-width: 280px;
        }
        .jms-badge:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
          transform: translateY(-2px);
        }
        .jms-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .jms-score {
          font-size: 28px;
          font-weight: 700;
          color: ${color};
          line-height: 1;
        }
        .jms-score-suffix {
          font-size: 14px;
          color: ${color};
        }
        .jms-info { flex: 1; }
        .jms-label {
          font-size: 13px;
          font-weight: 600;
          color: ${color};
        }
        .jms-sublabel {
          font-size: 11px;
          color: #64748b;
        }
        .jms-details {
          display: none;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          max-height: 200px;
          overflow-y: auto;
        }
        .jms-badge.expanded .jms-details { display: block; }
        .jms-detail-title {
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }
        .jms-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          margin-bottom: 8px;
        }
        .jms-chip {
          padding: 1px 6px;
          border-radius: 8px;
          font-size: 10px;
        }
        .jms-chip-match { background: #dcfce7; color: #166534; }
        .jms-chip-miss { background: #fee2e2; color: #991b1b; }
        .jms-close {
          position: absolute;
          top: 4px;
          right: 8px;
          background: none;
          border: none;
          font-size: 16px;
          color: #94a3b8;
          cursor: pointer;
          display: none;
        }
        .jms-badge.expanded .jms-close { display: block; }
        .jms-brand {
          font-size: 9px;
          color: #94a3b8;
          text-align: center;
          margin-top: 6px;
        }
      </style>
      <div class="jms-badge" id="badge">
        <button class="jms-close" id="close-btn">&times;</button>
        <div class="jms-header">
          <div>
            <span class="jms-score">${score}</span><span class="jms-score-suffix">%</span>
          </div>
          <div class="jms-info">
            <div class="jms-label">${label}</div>
            <div class="jms-sublabel">${matched.length} of ${matched.length + missing.length} keywords matched</div>
          </div>
        </div>
        <div class="jms-details">
          ${matched.length > 0 ? `
            <div class="jms-detail-title">Matched (${matched.length})</div>
            <div class="jms-chips">
              ${matched.slice(0, 15).map(k => `<span class="jms-chip jms-chip-match">${escapeHtml(k)}</span>`).join('')}
            </div>
          ` : ''}
          ${missing.length > 0 ? `
            <div class="jms-detail-title">Missing (${missing.length})</div>
            <div class="jms-chips">
              ${missing.slice(0, 15).map(k => `<span class="jms-chip jms-chip-miss">${escapeHtml(k)}</span>`).join('')}
            </div>
          ` : ''}
          <div class="jms-brand">Job Match Score</div>
        </div>
      </div>
    `;

    const badge = shadow.getElementById('badge');
    badge.addEventListener('click', (e) => {
      if (e.target.id !== 'close-btn') {
        badge.classList.toggle('expanded');
      }
    });

    shadow.getElementById('close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      host.remove();
      scoreOverlay = null;
    });

    document.body.appendChild(host);
    scoreOverlay = host;
  }

  /**
   * Run the matching analysis
   */
  async function analyze() {
    // Skip if we already analyzed this exact URL
    const currentUrl = location.href;
    if (currentUrl === lastAnalyzedUrl && scoreOverlay) return;

    try {
      const data = await chrome.storage.local.get('resumeKeywords');
      if (!data.resumeKeywords || data.resumeKeywords.length === 0) return;

      const jobText = extractJobDescription();
      if (!jobText) return;

      const jobKeywords = JobMatchScore.extractKeywords(jobText);
      if (jobKeywords.length === 0) return;

      const result = JobMatchScore.calculateMatch(data.resumeKeywords, jobKeywords);
      showScoreBadge(result.score, result.matched, result.missing);
      lastAnalyzedUrl = currentUrl;

      // Update extension icon badge
      chrome.runtime.sendMessage({
        type: 'UPDATE_BADGE',
        score: result.score
      });
    } catch (err) {
      console.error('Job Match Score: analysis error', err);
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_MATCH_SCORE') {
      chrome.storage.local.get('resumeKeywords').then(d => {
        if (!d.resumeKeywords) {
          sendResponse({ score: 0, matched: [], missing: [] });
          return;
        }
        const jobText = extractJobDescription();
        if (!jobText) {
          sendResponse({ score: 0, matched: [], missing: [], error: 'no_job_description' });
          return;
        }
        const jobKeywords = JobMatchScore.extractKeywords(jobText);
        const result = JobMatchScore.calculateMatch(d.resumeKeywords, jobKeywords);
        sendResponse(result);
      }).catch(() => {
        sendResponse({ score: 0, matched: [], missing: [], error: 'storage_error' });
      });
      return true;
    }

    // Re-analyze when popup saves new keywords
    if (message.type === 'KEYWORDS_UPDATED') {
      lastAnalyzedUrl = null; // Clear cache
      analyze();
    }
  });

  // Run analysis when page loads
  analyze();

  // Re-run when LinkedIn dynamically loads a new job listing (SPA navigation)
  // Watch for URL changes via the job details container instead of entire body
  let observeTarget = document.querySelector('.jobs-search__job-details') || document.body;
  const observer = new MutationObserver(() => {
    clearTimeout(observer._timeout);
    observer._timeout = setTimeout(() => {
      // Only re-analyze if URL changed (new job selected)
      if (location.href !== lastAnalyzedUrl) {
        analyze();
      }
    }, 1500);
  });

  observer.observe(observeTarget, {
    childList: true,
    subtree: true
  });
})();
