// content.js — Injected into LinkedIn job listing pages
// Depends on matcher.js being loaded first (via manifest.json script order)

(function () {
  let scoreOverlay = null;

  /**
   * Extract job description text from LinkedIn's DOM
   */
  function extractJobDescription() {
    // LinkedIn uses several possible selectors for job descriptions
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
    // Remove existing overlay if any
    if (scoreOverlay) {
      scoreOverlay.remove();
    }

    // Create shadow DOM host to avoid style conflicts
    const host = document.createElement('div');
    host.id = 'jms-score-host';
    host.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:999999;';

    const shadow = host.attachShadow({ mode: 'closed' });

    // Determine color based on score
    let color, bgColor, label;
    if (score >= 70) {
      color = '#16a34a'; bgColor = '#f0fdf4'; label = 'Great match!';
    } else if (score >= 40) {
      color = '#ca8a04'; bgColor = '#fefce8'; label = 'Partial match';
    } else {
      color = '#dc2626'; bgColor = '#fef2f2'; label = 'Low match';
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
        .jms-info {
          flex: 1;
        }
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
        }
        .jms-badge.expanded .jms-details {
          display: block;
        }
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
              ${matched.slice(0, 12).map(k => `<span class="jms-chip jms-chip-match">${k}</span>`).join('')}
            </div>
          ` : ''}
          ${missing.length > 0 ? `
            <div class="jms-detail-title">Missing (${missing.length})</div>
            <div class="jms-chips">
              ${missing.slice(0, 12).map(k => `<span class="jms-chip jms-chip-miss">${k}</span>`).join('')}
            </div>
          ` : ''}
          <div class="jms-brand">Job Match Score</div>
        </div>
      </div>
    `;

    // Toggle expanded view on click
    const badge = shadow.getElementById('badge');
    badge.addEventListener('click', (e) => {
      if (e.target.id !== 'close-btn') {
        badge.classList.toggle('expanded');
      }
    });

    // Close button
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
    const data = await chrome.storage.local.get('resumeKeywords');
    if (!data.resumeKeywords || data.resumeKeywords.length === 0) return;

    const jobText = extractJobDescription();
    if (!jobText) return;

    const jobKeywords = JobMatchScore.extractKeywords(jobText);
    if (jobKeywords.length === 0) return;

    const result = JobMatchScore.calculateMatch(data.resumeKeywords, jobKeywords);
    showScoreBadge(result.score, result.matched, result.missing);

    // Update extension icon badge
    chrome.runtime.sendMessage({
      type: 'UPDATE_BADGE',
      score: result.score
    });
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_MATCH_SCORE') {
      const data = chrome.storage.local.get('resumeKeywords').then(d => {
        if (!d.resumeKeywords) {
          sendResponse({ score: 0, matched: [], missing: [] });
          return;
        }
        const jobText = extractJobDescription();
        if (!jobText) {
          sendResponse({ score: 0, matched: [], missing: [] });
          return;
        }
        const jobKeywords = JobMatchScore.extractKeywords(jobText);
        const result = JobMatchScore.calculateMatch(d.resumeKeywords, jobKeywords);
        sendResponse(result);
      });
      return true; // Keep message channel open for async response
    }
  });

  // Run analysis when page loads
  analyze();

  // Re-run when LinkedIn dynamically loads a new job listing (SPA navigation)
  const observer = new MutationObserver(() => {
    // Debounce: wait for DOM to settle
    clearTimeout(observer._timeout);
    observer._timeout = setTimeout(analyze, 1000);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();
