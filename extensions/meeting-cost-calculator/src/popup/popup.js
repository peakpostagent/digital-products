// popup.js — Meeting Cost Calculator popup logic
// v1.2.0: Adds Pro-tier feature gating, upgrade flow, and paid-only sections.
// Free-tier behaviour is unchanged from v1.1.0 — the Pro layer is additive.

document.addEventListener('DOMContentLoaded', () => {
  // ---- DOM elements (v1.1.0 unchanged) ----
  const currencySelect = document.getElementById('currency-select');
  const btnHourly = document.getElementById('btn-hourly');
  const btnAnnual = document.getElementById('btn-annual');
  const yourRateInput = document.getElementById('your-rate');
  const defaultRateInput = document.getElementById('default-rate');
  const yourRateLabel = document.getElementById('your-rate-label');
  const defaultRateLabel = document.getElementById('default-rate-label');
  const saveBtn = document.getElementById('save-btn');
  const statusEl = document.getElementById('status');
  const currentMeetingSection = document.getElementById('current-meeting');
  const meetingInfoEl = document.getElementById('meeting-info');
  const weeklyDashboard = document.getElementById('weekly-dashboard');

  // ---- DOM elements (Pro v1.2.0) ----
  const proBadge = document.getElementById('pro-badge');
  const proBanner = document.getElementById('pro-banner');
  const btnStartTrial = document.getElementById('btn-start-trial');
  const btnUpgrade = document.getElementById('btn-upgrade');
  const proTrialStatus = document.getElementById('pro-trial-status');
  const footerProStatus = document.getElementById('footer-pro-status');
  const chartTitleEl = document.getElementById('chart-title');

  let currentRateType = 'hourly';
  let proStatus = { paid: false, proEnabled: false, trialDaysRemaining: 0, sdkAvailable: false };

  // Load saved settings AND Pro status
  loadSettings();
  loadProStatus();

  // Toggle between hourly and annual
  btnHourly.addEventListener('click', () => switchRateType('hourly'));
  btnAnnual.addEventListener('click', () => switchRateType('annual'));

  // Save button
  saveBtn.addEventListener('click', saveSettings);

  // Pro CTA handlers
  btnStartTrial.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_TRIAL_PAGE' });
  });
  btnUpgrade.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT_PAGE' });
  });
  document.querySelectorAll('.pro-unlock-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT_PAGE' });
    });
  });

  /**
   * Switch between hourly and annual rate input mode
   */
  function switchRateType(type) {
    currentRateType = type;
    const symbol = getCurrencySymbol();

    if (type === 'hourly') {
      btnHourly.classList.add('active');
      btnAnnual.classList.remove('active');
      yourRateLabel.textContent = 'Your rate (' + symbol + '/hr)';
      defaultRateLabel.textContent = 'Default attendee rate (' + symbol + '/hr)';
    } else {
      btnAnnual.classList.add('active');
      btnHourly.classList.remove('active');
      yourRateLabel.textContent = 'Your annual salary (' + symbol + '/yr)';
      defaultRateLabel.textContent = 'Default attendee salary (' + symbol + '/yr)';
    }
  }

  function getCurrencySymbol() {
    const symbols = { USD: '$', EUR: '\u20AC', GBP: '\u00A3', CAD: 'C$', AUD: 'A$', JPY: '\u00A5', INR: '\u20B9' };
    return symbols[currencySelect.value] || '$';
  }

  currencySelect.addEventListener('change', () => {
    switchRateType(currentRateType);
  });

  function loadSettings() {
    chrome.storage.local.get(
      ['yourRate', 'defaultRate', 'currency', 'rateType'],
      (result) => {
        const yourRate = result.yourRate || MeetingCost.DEFAULTS.yourRate;
        const defaultRate = result.defaultRate || MeetingCost.DEFAULTS.defaultRate;
        const currency = result.currency || MeetingCost.DEFAULTS.currency;
        const rateType = result.rateType || MeetingCost.DEFAULTS.rateType;

        currencySelect.value = currency;
        currentRateType = rateType;
        switchRateType(rateType);

        if (rateType === 'annual') {
          yourRateInput.value = Math.round(yourRate * 2080);
          defaultRateInput.value = Math.round(defaultRate * 2080);
        } else {
          yourRateInput.value = yourRate;
          defaultRateInput.value = defaultRate;
        }

        fetchCurrentMeeting();
        loadWeeklyDashboard();
      }
    );
  }

  function saveSettings() {
    let yourRate = parseFloat(yourRateInput.value) || 0;
    let defaultRate = parseFloat(defaultRateInput.value) || 0;

    if (yourRate < 0 || defaultRate < 0) {
      showStatus('Rates must be positive numbers', 'error');
      return;
    }

    if (currentRateType === 'annual') {
      yourRate = MeetingCost.annualToHourly(yourRate);
      defaultRate = MeetingCost.annualToHourly(defaultRate);
    }

    const settings = {
      yourRate: Math.round(yourRate * 100) / 100,
      defaultRate: Math.round(defaultRate * 100) / 100,
      currency: currencySelect.value,
      rateType: currentRateType
    };

    chrome.storage.local.set(settings, () => {
      showStatus('Settings saved!', 'success');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED' }, () => {
            if (chrome.runtime.lastError) { /* no content script */ }
          });
        }
      });
    });
  }

  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'status ' + type;
    statusEl.classList.remove('hidden');
    setTimeout(() => statusEl.classList.add('hidden'), 2500);
  }

  function fetchCurrentMeeting() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      const tab = tabs[0];
      chrome.tabs.sendMessage(tab.id, { type: 'GET_MEETING_DATA' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          currentMeetingSection.classList.add('hidden');
          return;
        }
        currentMeetingSection.classList.remove('hidden');
        if (!response.hasMeeting) {
          meetingInfoEl.innerHTML = '<p class="meeting-label">Click on a calendar event to see its cost.</p>';
          return;
        }
        displayMeetingCost(response);
      });
    });
  }

  function displayMeetingCost(data) {
    const symbol = getCurrencySymbol();
    const isLive = data.progress && data.progress.isActive;
    let html = '';
    if (isLive) html += '<span class="live-badge">Live</span> ';
    html += '<div style="font-weight:600; margin: 6px 0;">' + escapeHtml(data.title || 'Meeting') + '</div>';
    html += '<div class="meeting-cost-display">' + escapeHtml(MeetingCost.formatCost(data.totalCost, currencySelect.value)) + '</div>';
    if (data.annualCost && data.recurrenceFrequency) {
      html += '<div class="annual-cost-line">&#x1F501; ~' +
        escapeHtml(MeetingCost.formatCost(data.annualCost, currencySelect.value)) +
        '/year (' + escapeHtml(data.recurrenceFrequency) + ')</div>';
    }
    if (isLive && data.progress) {
      const pct = Math.round(data.progress.progress * 100);
      html += '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
      html += '<div class="meeting-detail"><span>Elapsed</span><span class="meeting-detail-value">' +
        escapeHtml(MeetingCost.formatDuration(data.progress.elapsedMinutes)) + ' / ' +
        escapeHtml(MeetingCost.formatDuration(data.durationMinutes)) + '</span></div>';
    }
    html += '<div class="meeting-detail"><span>Duration</span><span class="meeting-detail-value">' +
      escapeHtml(MeetingCost.formatDuration(data.durationMinutes)) + '</span></div>';
    html += '<div class="meeting-detail"><span>Attendees</span><span class="meeting-detail-value">' +
      escapeHtml(String(data.attendeeCount)) + '</span></div>';
    html += '<div class="meeting-detail"><span>Cost/person</span><span class="meeting-detail-value">' +
      escapeHtml(MeetingCost.formatCost(data.costPerPerson, currencySelect.value)) + '</span></div>';
    html += '<div class="meeting-detail"><span>Cost/minute</span><span class="meeting-detail-value">' +
      escapeHtml(MeetingCost.formatCost(data.costPerMinute, currencySelect.value)) + '</span></div>';
    if (!data.recurrenceFrequency) html += buildRecurringToggle(data);
    meetingInfoEl.innerHTML = html;
    if (!data.recurrenceFrequency) attachRecurringToggleHandlers(data);
  }

  function buildRecurringToggle(data) {
    return '<div class="recurring-toggle">' +
      '<div class="recurring-row">' +
        '<input type="checkbox" id="recurring-check" class="recurring-checkbox">' +
        '<label for="recurring-check" style="cursor:pointer;">Recurring?</label>' +
        '<select id="recurring-freq" class="recurring-select" disabled>' +
          '<option value="weekly">Weekly</option>' +
          '<option value="biweekly">Biweekly</option>' +
          '<option value="monthly">Monthly</option>' +
          '<option value="daily">Daily</option>' +
        '</select>' +
      '</div>' +
      '<div id="manual-annual-cost" class="annual-cost-line hidden"></div>' +
    '</div>';
  }

  function attachRecurringToggleHandlers(data) {
    const checkbox = document.getElementById('recurring-check');
    const freqSelect = document.getElementById('recurring-freq');
    const annualEl = document.getElementById('manual-annual-cost');
    if (!checkbox || !freqSelect || !annualEl) return;
    checkbox.addEventListener('change', () => {
      freqSelect.disabled = !checkbox.checked;
      updateManualAnnualCost(data, checkbox.checked, freqSelect.value, annualEl);
    });
    freqSelect.addEventListener('change', () => {
      updateManualAnnualCost(data, checkbox.checked, freqSelect.value, annualEl);
    });
  }

  function updateManualAnnualCost(data, isRecurring, frequency, el) {
    if (!isRecurring) { el.classList.add('hidden'); return; }
    const annualCost = MeetingCost.calculateAnnualCost(data.totalCost, frequency);
    if (annualCost > 0) {
      el.innerHTML = '&#x1F501; ~' +
        escapeHtml(MeetingCost.formatCost(annualCost, currencySelect.value)) +
        '/year (' + escapeHtml(frequency) + ')';
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function loadWeeklyDashboard() {
    chrome.runtime.sendMessage({ type: 'GET_WEEKLY_STATS' }, (stats) => {
      if (chrome.runtime.lastError || !stats) {
        weeklyDashboard.classList.add('hidden');
        return;
      }
      const current = stats.currentWeek;
      if (current.totalMeetings === 0) {
        weeklyDashboard.classList.add('hidden');
        return;
      }

      weeklyDashboard.classList.remove('hidden');

      document.getElementById('dash-total-meetings').textContent = current.totalMeetings;
      document.getElementById('dash-total-cost').textContent =
        MeetingCost.formatCost(current.totalCost, currencySelect.value);
      document.getElementById('dash-avg-cost').textContent =
        MeetingCost.formatCost(current.avgCost, currencySelect.value);

      let extraHtml = '';
      if (current.mostExpensive) {
        extraHtml += '<div class="dash-stat-row"><span>Most Expensive</span>' +
          '<span class="dash-stat-value">' +
            escapeHtml(truncateTitle(current.mostExpensive.title, 18)) + ' ' +
            escapeHtml(MeetingCost.formatCost(current.mostExpensive.cost, currencySelect.value)) +
          '</span></div>';
      }
      const prev = stats.prevWeek;
      if (prev.totalMeetings > 0) {
        const diff = current.totalCost - prev.totalCost;
        const pctChange = prev.totalCost > 0 ? Math.round((diff / prev.totalCost) * 100) : 0;
        let compClass = 'comparison-neutral';
        let compText = 'Same as last week';
        if (pctChange > 0) { compClass = 'comparison-up'; compText = '\u2191 ' + pctChange + '% vs last week'; }
        else if (pctChange < 0) { compClass = 'comparison-down'; compText = '\u2193 ' + Math.abs(pctChange) + '% vs last week'; }
        extraHtml += '<div class="dash-stat-row"><span>Trend</span>' +
          '<span class="' + compClass + '">' + escapeHtml(compText) + '</span></div>';
      }
      document.getElementById('dash-extra-stats').innerHTML = extraHtml;

      displayEfficiency(current);

      // Pro users get 12-week chart; free get 4
      const weekCount = isPaid() ? 12 : 4;
      chartTitleEl.textContent = 'Cost Trend (' + weekCount + ' Weeks)';
      loadChartData(weekCount);

      // Pro-only extras on the dashboard
      if (isPaid()) {
        renderProDashExtras(current);
      }
    });
  }

  function displayEfficiency(weekStats) {
    const effSection = document.getElementById('dash-efficiency');
    const effFill = document.getElementById('dash-efficiency-fill');
    const effValue = document.getElementById('dash-efficiency-value');
    const effDetail = document.getElementById('dash-efficiency-detail');

    if (weekStats.ratedCount === 0) { effSection.classList.add('hidden'); return; }
    effSection.classList.remove('hidden');
    const pct = weekStats.valuablePercent;
    effFill.style.width = pct + '%';
    effFill.className = 'efficiency-fill';
    if (pct < 40) effFill.classList.add('low');
    else if (pct < 70) effFill.classList.add('medium');
    effValue.textContent = pct + '%';
    effDetail.textContent = weekStats.ratedCount + ' of ' + weekStats.totalMeetings +
      ' meetings rated, ' + pct + '% rated valuable';
  }

  function loadChartData(weeks) {
    chrome.runtime.sendMessage({ type: 'GET_CHART_DATA', weeks: weeks }, (chartData) => {
      if (chrome.runtime.lastError || !chartData || !chartData.length) return;
      const chartEl = document.getElementById('dash-chart');
      if (!chartEl) return;

      const maxCost = Math.max(...chartData.map((d) => d.totalCost), 1);
      let chartHtml = '';
      chartData.forEach((week, i) => {
        const heightPct = maxCost > 0 ? (week.totalCost / maxCost) * 100 : 0;
        const isCurrentWeek = i === chartData.length - 1;
        const barClass = isCurrentWeek ? 'chart-bar current' : 'chart-bar';
        const weekLabel = week.weekKey.split('-')[1] || week.weekKey;

        chartHtml += '<div class="chart-bar-group">' +
          '<div class="chart-bar-value">' +
            escapeHtml(MeetingCost.formatCost(week.totalCost, currencySelect.value)) +
          '</div>' +
          '<div class="' + barClass + '" style="height:' + Math.max(heightPct, 5) + '%"></div>' +
          '<div class="chart-bar-label">' + escapeHtml(weekLabel) + '</div>' +
        '</div>';
      });
      chartEl.innerHTML = chartHtml;
    });
  }

  // ---- Pro dashboard extras: YoY projection + benchmarking ----
  function renderProDashExtras(currentWeekStats) {
    chrome.runtime.sendMessage({ type: 'GET_CHART_DATA', weeks: 12 }, (chartData) => {
      if (chrome.runtime.lastError || !chartData) return;
      const extras = document.getElementById('pro-dash-extras');
      const projection = MccProFeatures.projectAnnualCost(chartData);
      const bench = MccProFeatures.compareToBenchmark(currentWeekStats);

      let html = '<div class="pro-dash-row"><span>YoY Projection</span>' +
        '<span class="pro-dash-value">' +
          escapeHtml(MeetingCost.formatCost(projection.projectedAnnual, currencySelect.value)) +
          ' (' + projection.confidence + ')</span></div>';

      html += '<div class="pro-dash-row"><span>vs Industry Avg</span>' +
        '<span class="pro-dash-value">' +
          (bench.costDelta >= 0 ? '+' : '') +
          escapeHtml(MeetingCost.formatCost(Math.abs(bench.costDelta), currencySelect.value)) +
          '</span></div>';

      html += '<div class="pro-benchmark-summary">' + escapeHtml(bench.summary) + '</div>';

      extras.innerHTML = html;
      extras.classList.remove('hidden');
    });
  }

  function truncateTitle(title, maxLen) {
    if (!title) return '';
    if (title.length <= maxLen) return title;
    return title.substring(0, maxLen - 1) + '\u2026';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ---- Pro feature gating ----

  /**
   * Single source of truth for feature gates. Used everywhere.
   * Pro is considered unlocked when:
   *   - Pro tier is enabled at build time (PRO_ENABLED in lib/extpay.js)
   *   - AND the ExtensionPay SDK has confirmed paid status
   */
  function isPaid() {
    return !!(proStatus && proStatus.proEnabled && proStatus.paid);
  }

  /**
   * Load Pro status from the service worker and update the UI.
   * Called on popup open; re-checked on focus in case subscription changed.
   */
  function loadProStatus() {
    chrome.runtime.sendMessage({ type: 'GET_PRO_STATUS' }, (status) => {
      if (chrome.runtime.lastError || !status) {
        proStatus = { paid: false, proEnabled: false, trialDaysRemaining: 0, sdkAvailable: false };
      } else {
        proStatus = status;
      }
      renderProUi();
    });
  }

  /**
   * Show/hide Pro CTAs and unlocked content based on proStatus.
   * Free users see locked state with upgrade CTAs.
   * Paid users see the real Pro features.
   */
  function renderProUi() {
    const paid = isPaid();

    // Banner only shows for free users when Pro tier is enabled
    if (proStatus.proEnabled && !paid) {
      proBanner.classList.remove('hidden');
      if (proStatus.trialDaysRemaining > 0) {
        proTrialStatus.classList.remove('hidden');
        proTrialStatus.textContent = proStatus.trialDaysRemaining +
          ' days left in your free trial window.';
      } else {
        proTrialStatus.classList.add('hidden');
      }
    } else {
      proBanner.classList.add('hidden');
    }

    // Pro badge in header
    if (paid) {
      proBadge.classList.remove('hidden');
      footerProStatus.textContent = 'Pro';
    } else {
      proBadge.classList.add('hidden');
      footerProStatus.textContent = proStatus.proEnabled ? 'Free' : '';
    }

    // Swap each Pro section between locked and unlocked states
    const sections = [
      { locked: 'pro-roi-locked', content: 'pro-roi-content' },
      { locked: 'pro-profiles-locked', content: 'pro-profiles-content' },
      { locked: 'pro-insights-locked', content: 'pro-insights-content' },
      { locked: 'pro-export-locked', content: 'pro-export-content' }
    ];
    sections.forEach(({ locked, content }) => {
      const lockedEl = document.getElementById(locked);
      const contentEl = document.getElementById(content);
      if (!lockedEl || !contentEl) return;
      if (paid) {
        lockedEl.classList.add('hidden');
        contentEl.classList.remove('hidden');
      } else {
        lockedEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
      }
    });

    // Wire up unlocked features once
    if (paid && !renderProUi._wired) {
      wireProFeatures();
      renderProUi._wired = true;
    }
  }

  /**
   * Wire event handlers for all the Pro feature UI. Only called after the user
   * is confirmed paid — protects us from accidentally exposing the surface.
   */
  function wireProFeatures() {
    wireRoiCalculator();
    wireRateProfiles();
    wireInsightsEmail();
    wireCsvExport();
  }

  // ---- ROI calculator ----
  function wireRoiCalculator() {
    const btn = document.getElementById('roi-calculate');
    const resultEl = document.getElementById('roi-result');
    if (!btn || !resultEl) return;

    btn.addEventListener('click', () => {
      if (!isPaid()) return; // defence-in-depth
      const duration = parseInt(document.getElementById('roi-duration').value, 10) || 30;
      const attendees = parseInt(document.getElementById('roi-attendees').value, 10) || 1;

      chrome.storage.local.get(['defaultRate', 'yourRate'], (result) => {
        const rate = result.defaultRate || result.yourRate || 50;
        const signals = {
          needsDiscussion: document.getElementById('roi-discussion').checked,
          needsDecision: document.getElementById('roi-decision').checked,
          needsRelationshipBuilding: document.getElementById('roi-relationship').checked,
          isSensitive: document.getElementById('roi-sensitive').checked
        };

        const roi = MccProFeatures.calculateMeetingRoi({
          durationMinutes: duration,
          attendeeCount: attendees,
          hourlyRate: rate,
          signals: signals
        });

        const recLabels = {
          email: 'Send an email instead',
          meeting: 'Hold the meeting',
          either: 'Either works'
        };
        const symbol = getCurrencySymbol();

        let html = '<div class="roi-result-heading">' +
          escapeHtml(recLabels[roi.recommendation]) + '</div>';

        html += '<div class="roi-result-detail">' +
          'Meeting cost: <strong>' + escapeHtml(MeetingCost.formatCost(roi.meetingCost, currencySelect.value)) + '</strong><br>' +
          'Email cost: <strong>' + escapeHtml(MeetingCost.formatCost(roi.emailCost, currencySelect.value)) + '</strong><br>';

        if (roi.recommendation === 'email' && roi.savings > 0) {
          html += 'Potential savings: <span class="roi-result-savings">' +
            escapeHtml(MeetingCost.formatCost(roi.savings, currencySelect.value)) + '</span>';
        }

        if (roi.reasons.length > 0) {
          html += '<ul style="margin-top:6px; padding-left:18px;">';
          roi.reasons.forEach((r) => { html += '<li>' + escapeHtml(r) + '</li>'; });
          html += '</ul>';
        }
        html += '</div>';

        resultEl.innerHTML = html;
        resultEl.className = 'roi-result rec-' + roi.recommendation;
        resultEl.classList.remove('hidden');
      });
    });
  }

  // ---- Rate profiles ----
  function wireRateProfiles() {
    const listEl = document.getElementById('profiles-list');
    const addBtn = document.getElementById('add-profile-btn');
    if (!listEl || !addBtn) return;

    renderProfiles();

    addBtn.addEventListener('click', () => {
      if (!isPaid()) return;
      chrome.storage.local.get(['mccProRateProfiles'], (result) => {
        const profiles = result.mccProRateProfiles || [];
        profiles.push({
          id: 'p_' + Date.now(),
          name: '',
          hourlyRate: 75,
          matchPattern: ''
        });
        chrome.storage.local.set({ mccProRateProfiles: profiles }, renderProfiles);
      });
    });

    function renderProfiles() {
      chrome.storage.local.get(['mccProRateProfiles'], (result) => {
        const profiles = result.mccProRateProfiles || [];
        if (profiles.length === 0) {
          listEl.innerHTML = '<div class="profile-empty">No profiles yet. Add one to get started.</div>';
          return;
        }

        let html = '';
        profiles.forEach((p, i) => {
          html += '<div class="profile-row" data-idx="' + i + '">' +
            '<input class="profile-name" type="text" placeholder="Client name" value="' + escapeHtml(p.name || '') + '">' +
            '<input class="profile-rate" type="number" placeholder="Rate" value="' + escapeHtml(String(p.hourlyRate || '')) + '" min="0">' +
            '<input class="profile-match" type="text" placeholder="match (domain or keyword)" value="' + escapeHtml(p.matchPattern || '') + '">' +
            '<button class="delete-profile" title="Delete">\u00D7</button>' +
          '</div>';
        });
        listEl.innerHTML = html;

        // Wire inputs — save on blur
        listEl.querySelectorAll('.profile-row').forEach((row) => {
          const idx = parseInt(row.getAttribute('data-idx'), 10);
          ['input', 'change'].forEach((evt) => {
            row.addEventListener(evt, () => saveProfileRow(row, idx));
          });
          const deleteBtn = row.querySelector('.delete-profile');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteProfile(idx));
          }
        });
      });
    }

    function saveProfileRow(row, idx) {
      chrome.storage.local.get(['mccProRateProfiles'], (result) => {
        const profiles = result.mccProRateProfiles || [];
        if (!profiles[idx]) return;
        profiles[idx].name = row.querySelector('.profile-name').value.trim();
        profiles[idx].hourlyRate = parseFloat(row.querySelector('.profile-rate').value) || 0;
        profiles[idx].matchPattern = row.querySelector('.profile-match').value.trim();
        chrome.storage.local.set({ mccProRateProfiles: profiles });
      });
    }

    function deleteProfile(idx) {
      chrome.storage.local.get(['mccProRateProfiles'], (result) => {
        const profiles = result.mccProRateProfiles || [];
        profiles.splice(idx, 1);
        chrome.storage.local.set({ mccProRateProfiles: profiles }, renderProfiles);
      });
    }
  }

  // ---- Weekly insights email opt-in ----
  function wireInsightsEmail() {
    const emailInput = document.getElementById('insights-email');
    const optInCheck = document.getElementById('insights-optin');
    const saveBtn = document.getElementById('insights-save-btn');
    if (!emailInput || !optInCheck || !saveBtn) return;

    chrome.storage.local.get(['mccProInsightsEmail', 'mccProInsightsOptIn'], (result) => {
      emailInput.value = result.mccProInsightsEmail || '';
      optInCheck.checked = !!result.mccProInsightsOptIn;
    });

    saveBtn.addEventListener('click', () => {
      if (!isPaid()) return;
      const email = (emailInput.value || '').trim();
      const optIn = optInCheck.checked;

      if (optIn && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showStatus('Please enter a valid email', 'error');
        return;
      }

      chrome.runtime.sendMessage(
        { type: 'REGISTER_INSIGHTS_EMAIL', email: email, optIn: optIn },
        (response) => {
          if (response && response.ok) {
            showStatus(optIn ? 'Insights email enabled' : 'Insights email disabled', 'success');
          } else {
            showStatus('Could not save preferences', 'error');
          }
        }
      );
    });
  }

  // ---- CSV export ----
  function wireCsvExport() {
    const exportBtn = document.getElementById('export-csv-btn');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', () => {
      if (!isPaid()) return;
      chrome.runtime.sendMessage({ type: 'GET_ALL_MEETINGS' }, (meetings) => {
        if (chrome.runtime.lastError || !meetings) {
          showStatus('Could not export data', 'error');
          return;
        }
        if (meetings.length === 0) {
          showStatus('No meeting data to export yet', 'error');
          return;
        }
        const csv = MccProFeatures.buildMeetingsCsv(meetings, currencySelect.value);
        const today = new Date().toISOString().slice(0, 10);
        MccProFeatures.downloadCsv(csv, 'meeting-cost-' + today + '.csv');
        showStatus('Exported ' + meetings.length + ' meetings', 'success');
      });
    });
  }
});
