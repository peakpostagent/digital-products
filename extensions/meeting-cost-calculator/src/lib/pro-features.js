// pro-features.js — Pro-tier feature implementations
// All functions here are only invoked after the feature-gate check (isPaid()).
// Loaded as a regular script in popup.html.

const MccProFeatures = (() => {
  // ---- CSV Export ----

  /**
   * Escape a single CSV field — wrap in quotes and double-up inner quotes.
   * @param {*} value
   * @returns {string}
   */
  function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n\r]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Build a CSV string from a meetings array.
   * @param {Array<object>} meetings — Meeting records with title, cost, etc.
   * @param {string} currency — Currency code (for the header, not conversion)
   * @returns {string} CSV text
   */
  function buildMeetingsCsv(meetings, currency) {
    const header = [
      'Title',
      'Date',
      'Duration (min)',
      'Attendees',
      'Cost (' + (currency || 'USD') + ')',
      'Rating',
      'Week'
    ].join(',');

    const rows = (meetings || []).map((m) => {
      const date = m.timestamp ? new Date(m.timestamp).toISOString().slice(0, 10) : '';
      return [
        csvEscape(m.title),
        csvEscape(date),
        csvEscape(m.duration),
        csvEscape(m.attendees),
        csvEscape(m.cost),
        csvEscape(m.rating || ''),
        csvEscape(m.weekKey || '')
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Trigger a browser download of a CSV file.
   * @param {string} csvText
   * @param {string} filename
   */
  function downloadCsv(csvText, filename) {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'meeting-cost-export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after a short delay so Chrome has time to initiate the download
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---- Rate Profiles ----
  // A rate profile is { id, name, hourlyRate, matchPattern }. matchPattern is a
  // lowercase substring matched against the meeting title OR attendee email
  // domain (both checked). If no profile matches, the default rate is used.

  /**
   * Pick the best-matching rate profile for a meeting.
   * @param {Array<object>} profiles — Rate profiles
   * @param {object} meeting — { title, attendeeEmails }
   * @returns {object|null}
   */
  function pickRateProfile(profiles, meeting) {
    if (!profiles || profiles.length === 0) return null;
    const title = (meeting.title || '').toLowerCase();
    const emails = (meeting.attendeeEmails || []).map((e) => String(e).toLowerCase());

    for (const profile of profiles) {
      const pattern = (profile.matchPattern || '').trim().toLowerCase();
      if (!pattern) continue;
      if (title.includes(pattern)) return profile;
      if (emails.some((email) => email.includes(pattern))) return profile;
    }
    return null;
  }

  /**
   * Validate a rate profile — used before saving.
   * @param {object} profile
   * @returns {{valid: boolean, error?: string}}
   */
  function validateProfile(profile) {
    if (!profile || typeof profile !== 'object') {
      return { valid: false, error: 'Profile is required.' };
    }
    if (!profile.name || !profile.name.trim()) {
      return { valid: false, error: 'Name is required.' };
    }
    if (!profile.hourlyRate || profile.hourlyRate <= 0) {
      return { valid: false, error: 'Hourly rate must be greater than 0.' };
    }
    return { valid: true };
  }

  // ---- Meeting ROI Calculator ----
  // "Would an email work?" decision tree.
  // Inputs: duration, attendees, hourly rate, decision flags.
  // Output: { emailCost, meetingCost, savings, recommendation }

  /**
   * Average time (minutes) a single recipient spends reading & responding to
   * an async update. Deliberately conservative so the tool doesn't oversell.
   */
  const EMAIL_READ_MINUTES = 4;

  /**
   * Compute the async-vs-sync cost comparison for a proposed meeting.
   * @param {object} params
   * @param {number} params.durationMinutes
   * @param {number} params.attendeeCount
   * @param {number} params.hourlyRate
   * @param {object} params.signals — Boolean decision-tree answers:
   *   needsDiscussion, needsDecision, needsRelationshipBuilding, isSensitive
   * @returns {{emailCost: number, meetingCost: number, savings: number, recommendation: string, reasons: string[]}}
   */
  function calculateMeetingRoi({ durationMinutes, attendeeCount, hourlyRate, signals }) {
    const dur = Math.max(1, Number(durationMinutes) || 0);
    const att = Math.max(1, Number(attendeeCount) || 1);
    const rate = Math.max(0, Number(hourlyRate) || 0);
    const flags = signals || {};

    const meetingCost = (dur / 60) * att * rate;
    const emailCost = (EMAIL_READ_MINUTES / 60) * att * rate;
    const savings = Math.max(0, meetingCost - emailCost);

    // Decision tree — async is only safe when no high-touch signals are present
    const reasons = [];
    let asyncSafe = true;
    if (flags.needsDiscussion) {
      asyncSafe = false;
      reasons.push('Needs real-time discussion / debate');
    }
    if (flags.needsDecision && att > 3) {
      asyncSafe = false;
      reasons.push('Group decision with >3 people');
    }
    if (flags.needsRelationshipBuilding) {
      asyncSafe = false;
      reasons.push('Relationship building / 1:1 touchpoint');
    }
    if (flags.isSensitive) {
      asyncSafe = false;
      reasons.push('Sensitive / personal topic');
    }

    let recommendation;
    if (asyncSafe && savings > 0) {
      recommendation = 'email';
      reasons.unshift('No sync-only signals detected');
    } else if (asyncSafe && savings <= 0) {
      recommendation = 'either';
      reasons.unshift('Meeting and email cost about the same');
    } else {
      recommendation = 'meeting';
    }

    return {
      emailCost: Math.round(emailCost * 100) / 100,
      meetingCost: Math.round(meetingCost * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      recommendation,
      reasons
    };
  }

  // ---- YoY Projection ----

  /**
   * Project annual cost based on recent weekly data.
   * @param {Array<{totalCost: number}>} weeks — Oldest to newest
   * @returns {{projectedAnnual: number, confidence: string, weeklyAverage: number}}
   */
  function projectAnnualCost(weeks) {
    const valid = (weeks || []).filter((w) => typeof w.totalCost === 'number');
    if (valid.length === 0) {
      return { projectedAnnual: 0, confidence: 'none', weeklyAverage: 0 };
    }

    const avg = valid.reduce((sum, w) => sum + w.totalCost, 0) / valid.length;
    const projected = Math.round(avg * 52 * 100) / 100;

    let confidence;
    if (valid.length >= 8) confidence = 'high';
    else if (valid.length >= 4) confidence = 'medium';
    else confidence = 'low';

    return {
      projectedAnnual: projected,
      confidence,
      weeklyAverage: Math.round(avg * 100) / 100
    };
  }

  // ---- Team Benchmarking ----
  // Hard-coded reference values for now. Sourced from widely reported industry
  // surveys (see LAUNCH-CHECKLIST.md); when the backend is live these will be
  // replaced with live anonymized averages from /apis/mcc-insights/benchmark.

  const BENCHMARK_REFERENCE = {
    // Weekly average meeting cost per knowledge worker, in USD
    weeklyAverage: 1500,
    // Percentage of meetings rated "valuable" in industry surveys
    valuablePercent: 55,
    // Meetings per week, knowledge-worker average
    meetingsPerWeek: 12
  };

  /**
   * Compare a user's week-stats object to the benchmark reference.
   * @param {{totalCost: number, totalMeetings: number, valuablePercent: number}} weekStats
   * @returns {{costDelta: number, meetingDelta: number, valuableDelta: number, summary: string}}
   */
  function compareToBenchmark(weekStats) {
    const cost = weekStats.totalCost || 0;
    const count = weekStats.totalMeetings || 0;
    const val = weekStats.valuablePercent || 0;

    const costDelta = Math.round((cost - BENCHMARK_REFERENCE.weeklyAverage) * 100) / 100;
    const meetingDelta = count - BENCHMARK_REFERENCE.meetingsPerWeek;
    const valuableDelta = val - BENCHMARK_REFERENCE.valuablePercent;

    let summary;
    if (costDelta < -200 && valuableDelta > 0) {
      summary = 'Below average spend, above average value — excellent.';
    } else if (costDelta > 200 && valuableDelta < 0) {
      summary = 'Higher-than-average spend with lower perceived value.';
    } else {
      summary = 'Close to industry average.';
    }

    return { costDelta, meetingDelta, valuableDelta, summary, reference: BENCHMARK_REFERENCE };
  }

  return {
    csvEscape,
    buildMeetingsCsv,
    downloadCsv,
    pickRateProfile,
    validateProfile,
    calculateMeetingRoi,
    projectAnnualCost,
    compareToBenchmark,
    EMAIL_READ_MINUTES,
    BENCHMARK_REFERENCE
  };
})();

// Make available globally for popup.js (script-tag loading, not ES module)
if (typeof window !== 'undefined') {
  window.MccProFeatures = MccProFeatures;
}
