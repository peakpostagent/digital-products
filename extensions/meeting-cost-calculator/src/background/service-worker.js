// service-worker.js — Background service worker for Meeting Cost Calculator
// Handles extension install, weekly data aggregation, data cleanup,
// and (v1.2.0) the Pro-tier ExtensionPay subscription gate.

// ---- ExtensionPay integration ----
// The official SDK is vendored at src/lib/extpay-sdk.js (see INSTALL.md).
// We also load our thin wrapper which exposes self.MccPro.
// Both files are wrapped in try/catch so the service worker still boots even
// if the SDK hasn't been dropped in yet (keeps free tier 100% working).
try {
  importScripts('../lib/extpay-sdk.js', '../lib/extpay.js');
} catch (err) {
  // SDK not yet vendored — free tier only. See INSTALL.md.
  console.warn('[MCC Pro] ExtensionPay SDK not loaded, running in free-only mode:', err);
}

let extpay = null;
if (self.MccPro && typeof self.MccPro.loadExtPaySdk === 'function') {
  extpay = self.MccPro.loadExtPaySdk();
  self.MccPro.startExtPay(extpay);
  if (extpay && typeof extpay.onPaid === 'object' && typeof extpay.onPaid.addListener === 'function') {
    // Persist the paid flag immediately so gating works offline too
    extpay.onPaid.addListener(() => {
      chrome.storage.local.set({ mccProPaid: true, mccProLastCheck: Date.now() });
    });
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.local.set({
      yourRate: 50,
      defaultRate: 50,
      currency: 'USD',
      rateType: 'hourly',
      mccProPaid: false,
      mccProRateProfiles: [],
      mccProInsightsOptIn: false,
      mccProInstalledAt: Date.now()
    });
  }

  if (details.reason === 'update') {
    // First-time v1.2.0 update — seed Pro defaults without overwriting anything
    chrome.storage.local.get(['mccProRateProfiles', 'mccProInsightsOptIn'], (existing) => {
      const patch = {};
      if (!existing.mccProRateProfiles) patch.mccProRateProfiles = [];
      if (typeof existing.mccProInsightsOptIn === 'undefined') patch.mccProInsightsOptIn = false;
      if (Object.keys(patch).length > 0) chrome.storage.local.set(patch);
    });
  }

  cleanupOldData();
  refreshProStatus();
});

// Refresh Pro status on browser startup (ExtensionPay is the source of truth)
chrome.runtime.onStartup.addListener(() => {
  refreshProStatus();
});

// Periodic Pro status refresh (every 6 hours) — keeps cached flag in sync
chrome.alarms.create('mcc-pro-refresh', { periodInMinutes: 360 });
// Existing daily cleanup alarm
chrome.alarms.create('mcc-cleanup', { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'mcc-cleanup') {
    cleanupOldData();
  } else if (alarm.name === 'mcc-pro-refresh') {
    refreshProStatus();
  }
});

// Listen for messages from content script / popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'RECORD_MEETING') {
    recordMeeting(msg.data).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'RATE_MEETING') {
    rateMeeting(msg.meetingId, msg.rating).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'GET_WEEKLY_STATS') {
    getWeeklyStats().then((stats) => sendResponse(stats));
    return true;
  }

  if (msg.type === 'GET_CHART_DATA') {
    // weeks parameter — free tier sends 4, Pro sends 12
    getChartData(msg.weeks || 4).then((data) => sendResponse(data));
    return true;
  }

  // ---- Pro-tier messages ----

  if (msg.type === 'GET_PRO_STATUS') {
    getProStatus().then((status) => sendResponse(status));
    return true;
  }

  if (msg.type === 'OPEN_PAYMENT_PAGE') {
    if (self.MccPro) self.MccPro.openPaymentPage(extpay);
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === 'OPEN_TRIAL_PAGE') {
    if (self.MccPro) self.MccPro.openTrialPage(extpay);
    sendResponse({ ok: true });
    return false;
  }

  if (msg.type === 'GET_ALL_MEETINGS') {
    // Pro feature: full export (up to 8 weeks retained, matching cleanup cutoff)
    getAllMeetings().then((data) => sendResponse(data));
    return true;
  }

  if (msg.type === 'REGISTER_INSIGHTS_EMAIL') {
    // Pro feature: register the user with the /apis/mcc-insights/ backend
    registerInsightsEmail(msg.email, msg.optIn).then((r) => sendResponse(r));
    return true;
  }
});

// ---- ISO week key helper (unchanged) ----
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
 */
async function recordMeeting(data) {
  const weekKey = getWeekKey();
  const storageKey = 'meetings_' + weekKey;

  const result = await chrome.storage.local.get([storageKey]);
  const meetings = result[storageKey] || [];

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
    weekKey: weekKey,
    rating: null
  });

  await chrome.storage.local.set({ [storageKey]: meetings });
}

/**
 * Rate a meeting by its ID
 */
async function rateMeeting(meetingId, rating) {
  const weekKey = getWeekKey();
  const storageKey = 'meetings_' + weekKey;

  const result = await chrome.storage.local.get([storageKey]);
  const meetings = result[storageKey] || [];

  const meeting = meetings.find((m) => m.id === meetingId);
  if (meeting) {
    meeting.rating = rating;
    await chrome.storage.local.set({ [storageKey]: meetings });
  }
}

/**
 * Get weekly statistics for the current and previous week
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

  const sorted = [...meetings].sort((a, b) => (b.cost || 0) - (a.cost || 0));
  const mostExpensive = sorted[0];

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
 * Get chart data for the last N weeks.
 * Free tier: N=4. Pro: N=12.
 * @param {number} weeks
 */
async function getChartData(weeks) {
  const count = Math.max(1, Math.min(52, weeks || 4));
  const weekKeys = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weekKeys.push(getWeekKey(d));
  }

  const uniqueWeeks = [...new Set(weekKeys)];
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
 * Return all retained meetings across all weeks — used by Pro CSV export.
 * Data retention is 8 weeks (see cleanupOldData); export reflects that cap.
 */
async function getAllMeetings() {
  const all = await chrome.storage.local.get(null);
  const out = [];
  for (const key of Object.keys(all)) {
    if (!key.startsWith('meetings_')) continue;
    const weekKey = key.replace('meetings_', '');
    const meetings = all[key] || [];
    for (const m of meetings) {
      out.push({ ...m, weekKey: m.weekKey || weekKey });
    }
  }
  // Newest first
  out.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return out;
}

/**
 * Remove meeting data older than 8 weeks
 */
async function cleanupOldData() {
  const allData = await chrome.storage.local.get(null);
  const keysToRemove = [];

  const cutoff = new Date();
  // Pro users get 12 weeks of history; free users get 8. We keep 12 across the
  // board because Pro can be toggled at any time — easier than migrating.
  cutoff.setDate(cutoff.getDate() - 12 * 7);
  const cutoffKey = getWeekKey(cutoff);

  for (const key of Object.keys(allData)) {
    if (key.startsWith('meetings_')) {
      const weekPart = key.replace('meetings_', '');
      if (weekPart < cutoffKey) {
        keysToRemove.push(key);
      }
    }
  }

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }
}

// ---- Pro tier helpers ----

/**
 * Refresh cached Pro status from ExtensionPay. The cached flag
 * (mccProPaid) is the source of truth for gating — ExtensionPay is contacted
 * opportunistically so offline users keep their access.
 */
async function refreshProStatus() {
  if (!self.MccPro || !self.MccPro.PRO_ENABLED) {
    await chrome.storage.local.set({ mccProPaid: false, mccProLastCheck: Date.now() });
    return;
  }
  if (!extpay) {
    await chrome.storage.local.set({ mccProPaid: false, mccProLastCheck: Date.now() });
    return;
  }
  const status = await self.MccPro.fetchUserStatus(extpay);
  await chrome.storage.local.set({
    mccProPaid: !!status.paid,
    mccProTrialStartedAt: status.trialStartedAt,
    mccProSubscriptionStatus: status.subscriptionStatus,
    mccProLastCheck: Date.now()
  });
}

/**
 * Resolve the popup's isPaid() check.
 * Returns both the cached flag and the trial days remaining (if applicable).
 */
async function getProStatus() {
  const stored = await chrome.storage.local.get([
    'mccProPaid', 'mccProTrialStartedAt', 'mccProSubscriptionStatus',
    'mccProLastCheck', 'mccProInstalledAt', 'mccProInsightsOptIn'
  ]);

  const proEnabled = self.MccPro ? self.MccPro.PRO_ENABLED : false;
  const trialDays = self.MccPro ? self.MccPro.TRIAL_DAYS : 14;
  const installedAt = stored.mccProInstalledAt || Date.now();
  const daysSinceInstall = Math.floor((Date.now() - installedAt) / (24 * 60 * 60 * 1000));
  const trialDaysRemaining = Math.max(0, trialDays - daysSinceInstall);

  return {
    proEnabled,
    paid: !!stored.mccProPaid,
    // Users are considered "in trial" for the first N days post-install IF they
    // haven't started ExtensionPay's hosted trial yet. Real billing/trial state
    // always comes from ExtensionPay once they've clicked Upgrade.
    trialDaysRemaining,
    subscriptionStatus: stored.mccProSubscriptionStatus || 'free',
    lastCheck: stored.mccProLastCheck || null,
    insightsOptIn: !!stored.mccProInsightsOptIn,
    sdkAvailable: !!extpay
  };
}

/**
 * Register the user's email with the /apis/mcc-insights/ backend for weekly
 * emails. Only called by popup after the user opts in AND is paid.
 * Persists locally regardless; backend call is fire-and-forget so popup stays
 * snappy even on flaky networks.
 */
async function registerInsightsEmail(email, optIn) {
  if (!email || typeof email !== 'string') {
    return { ok: false, error: 'Email required' };
  }

  await chrome.storage.local.set({
    mccProInsightsEmail: email.trim(),
    mccProInsightsOptIn: !!optIn
  });

  // Fire-and-forget POST to the backend. URL is empty until the backend is
  // deployed — see LAUNCH-CHECKLIST.md. We guard against empty URL so we don't
  // throw before launch.
  const BACKEND_URL = ''; // e.g. 'https://mcc-insights.vercel.app/api/register'
  if (!BACKEND_URL) {
    return { ok: true, pending: true };
  }

  try {
    await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), optIn: !!optIn })
    });
    return { ok: true };
  } catch (err) {
    console.warn('[MCC Pro] Could not reach insights backend:', err);
    // Opt-in is still saved locally — the next refresh will retry
    return { ok: true, pending: true };
  }
}
