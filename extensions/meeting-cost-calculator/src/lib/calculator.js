// calculator.js — Core meeting cost calculation engine
// Loaded as a content script (no ES module imports).
// Functions are attached to a global namespace for content.js to use.

const MeetingCost = (() => {
  /**
   * Default settings for new users
   */
  const DEFAULTS = {
    yourRate: 50,        // User's hourly rate in dollars
    defaultRate: 50,     // Default hourly rate for other attendees
    currency: 'USD',     // Currency code
    rateType: 'hourly'   // 'hourly' or 'annual'
  };

  /**
   * Currency symbols for display
   */
  const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '\u00A5',
    INR: '\u20B9'
  };

  /**
   * Convert annual salary to hourly rate
   * Assumes 2,080 working hours per year (40 hrs/week * 52 weeks)
   * @param {number} annual - Annual salary
   * @returns {number} - Hourly rate
   */
  function annualToHourly(annual) {
    if (!annual || annual <= 0) return 0;
    return annual / 2080;
  }

  /**
   * Parse a time string like "10:00am" or "2:30 PM" into minutes since midnight
   * @param {string} timeStr - Time string to parse
   * @returns {number} - Minutes since midnight, or -1 if unparseable
   */
  function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return -1;

    const clean = timeStr.trim().toLowerCase().replace(/\s+/g, '');

    // Match patterns like "10:00am", "2:30pm", "14:00", "9am"
    const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
    if (!match) return -1;

    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3];

    // Validate ranges
    if (minutes < 0 || minutes > 59) return -1;

    if (ampm) {
      // 12-hour format
      if (hours < 1 || hours > 12) return -1;
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    } else {
      // 24-hour format
      if (hours < 0 || hours > 23) return -1;
    }

    return hours * 60 + minutes;
  }

  /**
   * Parse a time range string like "10:00am - 11:30am" or "10:00 AM \u2013 11:30 AM"
   * Also handles "Monday, March 10 \u22C5 10:00am \u2013 11:30am" format
   * @param {string} rangeStr - Time range string
   * @returns {{ startMinutes: number, endMinutes: number, durationMinutes: number } | null}
   */
  function parseTimeRange(rangeStr) {
    if (!rangeStr || typeof rangeStr !== 'string') return null;

    const clean = rangeStr.trim();

    // Try to extract time portion from various formats
    // Google Calendar uses formats like:
    // "1:30 – 2:30pm"          (am/pm only on end time!)
    // "10:00am – 11:30am"
    // "Monday, March 10 ⋅ 10:00am – 11:30am"
    // "Tuesday, March 10⋅1:30 – 2:30pm"  (dot separator, no spaces)
    // "10:00 AM - 11:30 AM"
    const timeRangePattern = /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[\u2013\u2014\-\u2012]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
    const match = clean.match(timeRangePattern);

    if (!match) return null;

    let startStr = match[1].trim();
    const endStr = match[2].trim();

    // Google Calendar often omits am/pm on start time when both are same period
    // e.g., "1:30 – 2:30pm" means 1:30pm – 2:30pm
    const hasAmPm = /am|pm/i;
    if (!hasAmPm.test(startStr) && hasAmPm.test(endStr)) {
      // Inherit am/pm from end time
      const endAmPm = endStr.match(/am|pm/i)[0];
      startStr = startStr + endAmPm;
    }

    const startMinutes = parseTime(startStr);
    const endMinutes = parseTime(endStr);

    if (startMinutes === -1 || endMinutes === -1) return null;

    // Calculate duration (handle overnight meetings)
    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes <= 0) {
      durationMinutes += 24 * 60; // Overnight meeting
    }

    return { startMinutes, endMinutes, durationMinutes };
  }

  /**
   * Calculate the total cost of a meeting
   * @param {object} params
   * @param {number} params.durationMinutes - Meeting duration in minutes
   * @param {number} params.attendeeCount - Number of attendees
   * @param {number} params.hourlyRate - Hourly rate per person
   * @returns {{ totalCost: number, costPerMinute: number, costPerPerson: number }}
   */
  function calculateCost({ durationMinutes, attendeeCount, hourlyRate }) {
    if (!durationMinutes || durationMinutes <= 0) {
      return { totalCost: 0, costPerMinute: 0, costPerPerson: 0 };
    }
    if (!attendeeCount || attendeeCount <= 0) {
      return { totalCost: 0, costPerMinute: 0, costPerPerson: 0 };
    }
    if (!hourlyRate || hourlyRate <= 0) {
      return { totalCost: 0, costPerMinute: 0, costPerPerson: 0 };
    }

    const durationHours = durationMinutes / 60;
    const totalCost = durationHours * attendeeCount * hourlyRate;
    const costPerMinute = totalCost / durationMinutes;
    const costPerPerson = totalCost / attendeeCount;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      costPerMinute: Math.round(costPerMinute * 100) / 100,
      costPerPerson: Math.round(costPerPerson * 100) / 100
    };
  }

  /**
   * Format a cost value with currency symbol
   * @param {number} amount - Dollar amount
   * @param {string} currency - Currency code (e.g., 'USD')
   * @returns {string} - Formatted string like "$1,234.56"
   */
  function formatCost(amount, currency) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    if (amount >= 1000) {
      return symbol + amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return symbol + amount.toFixed(2);
  }

  /**
   * Format duration in minutes to a readable string
   * @param {number} minutes - Duration in minutes
   * @returns {string} - e.g., "1h 30m" or "45m"
   */
  function formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return m + 'm';
    if (m === 0) return h + 'h';
    return h + 'h ' + m + 'm';
  }

  /**
   * Calculate how much of the meeting has elapsed (for live cost)
   * @param {number} startMinutes - Start time in minutes since midnight
   * @param {number} durationMinutes - Total duration in minutes
   * @returns {{ elapsedMinutes: number, progress: number, isActive: boolean, isUpcoming: boolean }}
   */
  function getMeetingProgress(startMinutes, durationMinutes) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = startMinutes + durationMinutes;

    if (nowMinutes < startMinutes) {
      return { elapsedMinutes: 0, progress: 0, isActive: false, isUpcoming: true };
    }
    if (nowMinutes >= endMinutes) {
      return { elapsedMinutes: durationMinutes, progress: 1, isActive: false, isUpcoming: false };
    }

    const elapsed = nowMinutes - startMinutes;
    return {
      elapsedMinutes: elapsed,
      progress: elapsed / durationMinutes,
      isActive: true,
      isUpcoming: false
    };
  }

  // Expose functions globally
  return {
    DEFAULTS,
    CURRENCY_SYMBOLS,
    annualToHourly,
    parseTime,
    parseTimeRange,
    calculateCost,
    formatCost,
    formatDuration,
    getMeetingProgress
  };
})();
