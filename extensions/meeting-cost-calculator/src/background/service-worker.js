// service-worker.js — Background service worker for Meeting Cost Calculator
// Handles extension install, weekly data aggregation, and data cleanup

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      yourRate: 50,
      defaultRate: 50,
      currency: 'USD',
      rateType: 'hourly'
    });
  }

  // Run data cleanup on install/update
  cleanupOldData();
});

// Listen for messages from content script / popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'RECORD_MEETING') {
    recordMeeting(msg.data).then(() => sendResponse({ ok: true }));
    return true; // async
  }

  if (msg.type === 'RATE_MEETING') {
    rateMeeting(msg.meetingId, msg.rating).then(() => sendResponse({ ok: true }));
    return true; // async
  }

  if (msg.type === 'GET_WEEKLY_STATS') {
    getWeeklyStats().then((stats) => sendResponse(stats));
    return true; // async
  }

  if (msg.type === 'GET_CHART_DATA') {
    getChartData().then((data) => sendResponse(data));
    return true; // async
  }
});

// Set up periodic cleanup alarm (every 24 hours)
chrome.alarms.create('mcc-cleanup', { periodInMinutes: 1440 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'mcc-cleanup') {
    cleanupOldData();
  }
});

/**
 * Get the current ISO week key (e.g., "2026-W15")
 * @param {Date} [date] - Date to check (defaults to now)
 * @returns {string}
 */
function getWeekKey(date) {
  const d = date ? new Date(date) : new Date();
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return d.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
}

/**
 * Record a completed meeting for weekly stats
 * @param {object} data - Meeting data from content script
 */
async function recordMeeting(data) {
  const weekKey = getWeekKey();
  const storageKey = 'meetings_' + weekKey;

  const result = await chrome.storage.local.get([storageKey]);
  const meetings = result[storageKey] || [];

  // Check for duplicate (same title + date)
  const meetingId = data.title + '|' + new Date().toDateString();
  const exists = meetings.some((m) => m.id === meetingId);
  if (exists) return;

  meetings.push({
    id: meetingId,
    title: data.title || 'Untitled Meeting',
    cost: data.totalCost || 0,
    duration: data.durationMinutes || 0,
    attendees: data.attendeeCount || 1,
    timestamp: Date.now(),
    rating: null // Will be filled by RATE_MEETING
  });

  await chrome.storage.local.set({ [storageKey]: meetings });
}

/**
 * Rate a meeting by its ID
 * @param {string} meetingId - Meeting identifier
 * @param {string} rating - 'valuable', 'somewhat', or 'email'
 */
async function rateMeeting(meetingId, rating) {
  const weekKey = getWeekKey();
  const storageKey = 'meetings_' + weekKey;

  const result = await chrome.storage.local.get([storageKey]);
  const meetings = result[storageKey] || [];

  // Find and update the meeting rating
  const meeting = meetings.find((m) => m.id === meetingId);
  if (meeting) {
    meeting.rating = rating;
    await chrome.storage.local.set({ [storageKey]: meetings });
  }
}

/**
 * Get weekly statistics for the current and previous week
 * @returns {object} - Stats including totals, averages, and comparison
 */
async function getWeeklyStats() {
  const currentWeek = getWeekKey();
  const prevWeekDate = new Date();
  prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const prevWeek = getWeekKey(prevWeekDate);

  const result = await chrome.storage.local.get([
    'meetings_' + currentWeek,
    'meetings_' + prevWeek
  ]);

  const currentMeetings = result['meetings_' + currentWeek] || [];
  const prevMeetings = result['meetings_' + prevWeek] || [];

  return {
    currentWeek: buildWeekStats(currentMeetings),
    prevWeek: buildWeekStats(prevMeetings),
    weekKey: currentWeek
  };
}

/**
 * Build stats summary from a meetings array
 * @param {Array} meetings - Array of meeting objects
 * @returns {object}
 */
function buildWeekStats(meetings) {
  if (!meetings.length) {
    return {
      totalMeetings: 0,
      totalCost: 0,
      avgCost: 0,
      mostExpensive: null,
      valuablePercent: 0,
      ratedCount: 0,
      meetings: []
    };
  }

  const totalCost = meetings.reduce((sum, m) => sum + (m.cost || 0), 0);
  const avgCost = totalCost / meetings.length;

  // Find most expensive
  const sorted = [...meetings].sort((a, b) => (b.cost || 0) - (a.cost || 0));
  const mostExpensive = sorted[0];

  // Rating stats
  const rated = meetings.filter((m) => m.rating);
  const valuable = rated.filter((m) => m.rating === 'valuable');
  const valuablePercent = rated.length > 0
    ? Math.round((valuable.length / rated.length) * 100)
    : 0;

  return {
    totalMeetings: meetings.length,
    totalCost: Math.round(totalCost * 100) / 100,
    avgCost: Math.round(avgCost * 100) / 100,
    mostExpensive: mostExpensive
      ? { title: mostExpensive.title, cost: mostExpensive.cost }
      : null,
    valuablePercent: valuablePercent,
    ratedCount: rated.length,
    meetings: meetings
  };
}

/**
 * Get chart data for the last 4 weeks
 * @returns {Array} - Array of { weekKey, totalCost, meetingCount } objects
 */
async function getChartData() {
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weeks.push(getWeekKey(d));
  }

  // Deduplicate week keys (if weeks overlap)
  const uniqueWeeks = [...new Set(weeks)];
  const keys = uniqueWeeks.map((w) => 'meetings_' + w);
  const result = await chrome.storage.local.get(keys);

  return uniqueWeeks.map((weekKey) => {
    const meetings = result['meetings_' + weekKey] || [];
    const totalCost = meetings.reduce((sum, m) => sum + (m.cost || 0), 0);
    return {
      weekKey: weekKey,
      totalCost: Math.round(totalCost * 100) / 100,
      meetingCount: meetings.length
    };
  });
}

/**
 * Remove meeting data older than 8 weeks to keep storage clean
 */
async function cleanupOldData() {
  const allData = await chrome.storage.local.get(null);
  const keysToRemove = [];

  // Calculate the cutoff: 8 weeks ago
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 56);
  const cutoffKey = getWeekKey(cutoff);

  for (const key of Object.keys(allData)) {
    if (key.startsWith('meetings_')) {
      const weekPart = key.replace('meetings_', '');
      // Compare week keys lexicographically (YYYY-WNN format sorts correctly)
      if (weekPart < cutoffKey) {
        keysToRemove.push(key);
      }
    }
  }

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }
}
