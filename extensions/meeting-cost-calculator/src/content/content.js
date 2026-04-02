// content.js — Meeting Cost Calculator content script for Google Calendar
// Detects event popups/details and overlays meeting cost information

(() => {
  // ---- Utilities ----
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  // ---- State ----
  let settings = { yourRate: 50, defaultRate: 50, currency: 'USD' };
  let costBadge = null;
  let lastEventText = null;
  let debounceTimer = null;
  let liveUpdateTimer = null;
  let currentMeetingData = null;

  // ---- Initialize ----
  loadSettings();
  setupObserver();
  setupMessageListener();

  /**
   * Load user settings from chrome.storage.local
   * @param {Function} [callback] — called after settings are loaded
   */
  function loadSettings(callback) {
    chrome.storage.local.get(['yourRate', 'defaultRate', 'currency'], (result) => {
      settings.yourRate = result.yourRate || 50;
      settings.defaultRate = result.defaultRate || 50;
      settings.currency = result.currency || 'USD';
      if (callback) callback();
    });
  }

  /**
   * Listen for messages from popup
   */
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'SETTINGS_UPDATED') {
        lastEventText = null; // Force re-analysis
        loadSettings(() => {
          analyze();
        });
        sendResponse({ ok: true });
      }
      if (msg.type === 'GET_MEETING_DATA') {
        if (currentMeetingData) {
          // Add live progress data
          if (currentMeetingData.startMinutes !== undefined) {
            currentMeetingData.progress = MeetingCost.getMeetingProgress(
              currentMeetingData.startMinutes,
              currentMeetingData.durationMinutes
            );
          }
          sendResponse(currentMeetingData);
        } else {
          sendResponse({ hasMeeting: false });
        }
      }
      return true; // Keep message channel open for async response
    });
  }

  /**
   * Watch for DOM changes that indicate an event popup or detail view opened
   * Google Calendar is a SPA — content changes dynamically
   */
  function setupObserver() {
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(analyze, 800);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial analysis after page load
    setTimeout(analyze, 2000);
  }

  /**
   * Main analysis function — find event details and calculate cost
   */
  function analyze() {
    try {
      const eventData = findEventData();
      if (!eventData) {
        removeBadge();
        currentMeetingData = null;
        return;
      }

      // Skip if same event text (avoid redundant calculations)
      const eventFingerprint = eventData.title + '|' + eventData.timeText + '|' + eventData.attendeeCount;
      if (eventFingerprint === lastEventText && costBadge) return;
      lastEventText = eventFingerprint;

      // Calculate cost
      const timeData = MeetingCost.parseTimeRange(eventData.timeText);
      if (!timeData) {
        currentMeetingData = null;
        return;
      }

      const hourlyRate = settings.defaultRate || settings.yourRate || 50;
      const costData = MeetingCost.calculateCost({
        durationMinutes: timeData.durationMinutes,
        attendeeCount: eventData.attendeeCount,
        hourlyRate: hourlyRate
      });

      // Get live progress
      const progress = MeetingCost.getMeetingProgress(
        timeData.startMinutes,
        timeData.durationMinutes
      );

      // Store for popup to read
      currentMeetingData = {
        hasMeeting: true,
        title: eventData.title,
        durationMinutes: timeData.durationMinutes,
        startMinutes: timeData.startMinutes,
        attendeeCount: eventData.attendeeCount,
        totalCost: costData.totalCost,
        costPerMinute: costData.costPerMinute,
        costPerPerson: costData.costPerPerson,
        progress: progress
      };

      // Show cost badge
      showBadge(costData, timeData, eventData, progress);

      // Start live updates if meeting is active
      if (progress.isActive) {
        startLiveUpdates(timeData, eventData);
      } else {
        stopLiveUpdates();
      }

    } catch (err) {
      console.error('Meeting Cost Calculator: analysis error', err);
    }
  }

  /**
   * Find event data from Google Calendar's DOM
   * Google Calendar has several ways events appear:
   * 1. Event detail popup (bubble) — when you click on an event in week/day view
   *    - Container: [role="dialog"] with [role="heading"] for title
   *    - Time: nested span with format "1:30 – 2:30pm"
   *    - Attendees: elements with data-email or "X guests" text
   * 2. Event creation dialog — same [role="dialog"] pattern
   * 3. Event detail page — full page view at /eventedit/ URLs
   */
  function findEventData() {
    let title = '';
    let timeText = '';
    let attendeeCount = 1; // At minimum, you're in the meeting

    // Strategy 1: Event detail popup (bubble)
    // This is the primary interaction — clicking an event shows a popup
    const dialogs = document.querySelectorAll('[role="dialog"]');
    for (const dialog of dialogs) {
      // Skip the event creation dialog (it has "Add title" input)
      if (dialog.querySelector('[placeholder="Add title"]')) continue;

      // Find heading (event title) — Google uses span[role="heading"]
      const heading = dialog.querySelector('[role="heading"]');
      if (!heading || !heading.textContent.trim()) continue;

      // Skip dialogs that are just the "Create" dialog
      if (heading.textContent.trim() === 'Create') continue;

      title = heading.textContent.trim();

      // Find time — look for the specific time span within the dialog
      const timeEl = findTimeElement(dialog);
      if (timeEl) {
        timeText = timeEl.textContent.trim();
      }

      // Count attendees
      attendeeCount = countAttendees(dialog);
      break;
    }

    // Strategy 2: Event editing/detail page
    // URL pattern: calendar.google.com/calendar/r/eventedit/...
    if (!title && (location.href.includes('/eventedit/') || location.href.includes('/event?'))) {
      const titleInput = document.querySelector('[aria-label="Title"]') ||
                         document.querySelector('input[aria-label*="title" i]');

      if (titleInput) {
        title = titleInput.value || titleInput.textContent || '';
      }

      const detailTimeEl = findTimeElement(document.body);
      if (detailTimeEl) {
        timeText = detailTimeEl.textContent.trim();
      }

      attendeeCount = countAttendees(document.body);
    }

    // If no event data found, return null
    if (!title || !timeText) return null;

    return { title, timeText, attendeeCount };
  }

  /**
   * Find a time element within a container
   * Google Calendar shows times like:
   *   "1:30 – 2:30pm" (span, most specific — prefer this)
   *   "Tuesday, March 10⋅1:30 – 2:30pm" (parent div, includes date)
   * We prefer the smallest element that contains only the time range.
   */
  function findTimeElement(container) {
    if (!container) return null;

    const allElements = container.querySelectorAll('span, div, time, p');
    // Match time ranges: "1:30 – 2:30pm", "10:00am – 11:30am", etc.
    const timePattern = /\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*[\u2013\u2014\-\u2012]+\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)/i;

    let bestMatch = null;
    let bestLength = Infinity;

    for (const el of allElements) {
      const text = el.textContent.trim();
      if (!timePattern.test(text)) continue;
      if (text.length > 100) continue;

      // Prefer the smallest (most specific) element
      if (text.length < bestLength) {
        bestMatch = el;
        bestLength = text.length;
      }
    }

    return bestMatch;
  }

  /**
   * Count attendees in an event container
   */
  function countAttendees(container) {
    if (!container) return 1;

    // Look for guest/attendee list
    const guestElements = container.querySelectorAll(
      '[data-email], [data-hovercard-id], .gFNwKb, .rBRube'
    );

    if (guestElements.length > 0) {
      return guestElements.length;
    }

    // Look for "X guests" text
    const allText = container.textContent;
    const guestMatch = allText.match(/(\d+)\s*(?:guest|attendee|participant)/i);
    if (guestMatch) {
      return parseInt(guestMatch[1], 10);
    }

    // Default: just you
    return 1;
  }

  /**
   * Show the cost badge on the page
   */
  function showBadge(costData, timeData, eventData, progress) {
    removeBadge();

    // Create shadow DOM host
    const host = document.createElement('div');
    host.id = 'mcc-cost-host';
    host.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:99999;';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });
    const symbol = MeetingCost.CURRENCY_SYMBOLS[settings.currency] || '$';
    const isLive = progress && progress.isActive;

    // Badge content
    const badge = document.createElement('div');
    badge.className = 'mcc-badge' + (isLive ? ' mcc-live' : '');

    let liveBadgeHtml = '';
    let progressHtml = '';

    if (isLive) {
      const elapsed = progress.elapsedMinutes;
      const liveCost = MeetingCost.calculateCost({
        durationMinutes: elapsed,
        attendeeCount: eventData.attendeeCount,
        hourlyRate: settings.defaultRate || settings.yourRate
      });
      liveBadgeHtml = '<span class="mcc-live-dot"></span>';
      progressHtml = '<div class="mcc-progress"><div class="mcc-progress-fill" style="width:' +
        Math.round(progress.progress * 100) + '%"></div></div>' +
        '<div class="mcc-live-cost">' + symbol + liveCost.totalCost.toFixed(2) + ' so far</div>';
    }

    badge.innerHTML =
      '<div class="mcc-header">' + liveBadgeHtml +
        '<span class="mcc-icon">$</span>' +
        '<span class="mcc-total">' + escapeHtml(MeetingCost.formatCost(costData.totalCost, settings.currency)) + '</span>' +
      '</div>' +
      progressHtml +
      '<div class="mcc-details">' +
        '<div class="mcc-row"><span>' + escapeHtml(MeetingCost.formatDuration(timeData.durationMinutes)) + '</span>' +
          '<span>' + escapeHtml(eventData.attendeeCount) + ' ' + (eventData.attendeeCount === 1 ? 'person' : 'people') + '</span></div>' +
        '<div class="mcc-row"><span>' + escapeHtml(symbol + costData.costPerMinute.toFixed(2)) + '/min</span>' +
          '<span>' + escapeHtml(symbol + costData.costPerPerson.toFixed(2)) + '/person</span></div>' +
      '</div>';

    // Styles (inside shadow DOM)
    const style = document.createElement('style');
    style.textContent = getMccStyles();

    shadow.appendChild(style);
    shadow.appendChild(badge);
    costBadge = host;

    // Add click to toggle details
    const headerEl = shadow.querySelector('.mcc-header');
    const detailsEl = shadow.querySelector('.mcc-details');
    if (headerEl && detailsEl) {
      headerEl.style.cursor = 'pointer';
      headerEl.addEventListener('click', () => {
        detailsEl.style.display = detailsEl.style.display === 'none' ? 'block' : 'none';
      });
    }
  }

  /**
   * Get CSS styles for the badge (inside shadow DOM)
   */
  function getMccStyles() {
    return [
      '.mcc-badge {',
      '  font-family: "Google Sans", "Segoe UI", -apple-system, sans-serif;',
      '  background: #ffffff;',
      '  border-radius: 12px;',
      '  box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1);',
      '  padding: 12px 16px;',
      '  min-width: 180px;',
      '  border: 1px solid #e8eaed;',
      '  transition: all 0.2s ease;',
      '}',
      '.mcc-badge:hover {',
      '  box-shadow: 0 6px 24px rgba(0,0,0,0.2);',
      '  transform: translateY(-2px);',
      '}',
      '.mcc-badge.mcc-live {',
      '  border-color: #ea4335;',
      '  border-width: 2px;',
      '}',
      '.mcc-header {',
      '  display: flex;',
      '  align-items: center;',
      '  gap: 8px;',
      '}',
      '.mcc-icon {',
      '  font-size: 16px;',
      '  font-weight: 700;',
      '  color: #1a73e8;',
      '  background: #e8f0fe;',
      '  width: 28px;',
      '  height: 28px;',
      '  border-radius: 50%;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '}',
      '.mcc-total {',
      '  font-size: 22px;',
      '  font-weight: 700;',
      '  color: #1a1a2e;',
      '}',
      '.mcc-live-dot {',
      '  width: 8px;',
      '  height: 8px;',
      '  border-radius: 50%;',
      '  background: #ea4335;',
      '  animation: mcc-pulse 1.5s infinite;',
      '}',
      '@keyframes mcc-pulse {',
      '  0%, 100% { opacity: 1; transform: scale(1); }',
      '  50% { opacity: 0.5; transform: scale(0.8); }',
      '}',
      '.mcc-progress {',
      '  width: 100%;',
      '  height: 4px;',
      '  background: #f1f3f4;',
      '  border-radius: 2px;',
      '  margin: 8px 0 4px;',
      '  overflow: hidden;',
      '}',
      '.mcc-progress-fill {',
      '  height: 100%;',
      '  background: #ea4335;',
      '  border-radius: 2px;',
      '  transition: width 1s linear;',
      '}',
      '.mcc-live-cost {',
      '  font-size: 11px;',
      '  color: #ea4335;',
      '  font-weight: 500;',
      '  margin-bottom: 4px;',
      '}',
      '.mcc-details {',
      '  margin-top: 8px;',
      '  padding-top: 8px;',
      '  border-top: 1px solid #f1f3f4;',
      '}',
      '.mcc-row {',
      '  display: flex;',
      '  justify-content: space-between;',
      '  font-size: 12px;',
      '  color: #5f6368;',
      '  padding: 2px 0;',
      '}'
    ].join('\n');
  }

  /**
   * Remove the cost badge from the page
   */
  function removeBadge() {
    if (costBadge) {
      costBadge.remove();
      costBadge = null;
    }
    // Also clean up any orphaned badges
    const old = document.getElementById('mcc-cost-host');
    if (old) old.remove();
  }

  /**
   * Start updating cost every minute for live meetings
   */
  function startLiveUpdates(timeData, eventData) {
    stopLiveUpdates();
    liveUpdateTimer = setInterval(() => {
      const progress = MeetingCost.getMeetingProgress(
        timeData.startMinutes, timeData.durationMinutes
      );
      if (!progress.isActive) {
        stopLiveUpdates();
        analyze(); // Final update
        return;
      }
      // Recalculate with current elapsed time
      const hourlyRate = settings.defaultRate || settings.yourRate;
      const costData = MeetingCost.calculateCost({
        durationMinutes: timeData.durationMinutes,
        attendeeCount: eventData.attendeeCount,
        hourlyRate: hourlyRate
      });
      showBadge(costData, timeData, eventData, progress);
    }, 30000); // Update every 30 seconds
  }

  /**
   * Stop live update timer
   */
  function stopLiveUpdates() {
    if (liveUpdateTimer) {
      clearInterval(liveUpdateTimer);
      liveUpdateTimer = null;
    }
  }
})();
