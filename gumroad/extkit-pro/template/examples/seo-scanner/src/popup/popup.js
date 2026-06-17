/**
 * SEO Scanner — Popup script
 *
 * Runs the SEO scan on the active tab. Shows free-tier results immediately,
 * shows Pro-tier results behind isPaid() gate, shows the paywall otherwise.
 *
 * This is THE pattern ExtKit Pro buyers should copy: scan → gate → paywall.
 */

import { isPaid } from '../lib/is-paid.js';
import { setupPaywall, showPaywall } from '../popup/paywall.js';
import { calculateGrade, FREE_HEURISTICS, PRO_HEURISTICS } from '../lib/scanner.js';

const HUMAN_NAMES = {
  title: 'Title tag',
  description: 'Meta description',
  h1: 'H1 heading',
  canonical: 'Canonical URL',
  viewport: 'Viewport meta',
  openGraph: 'OpenGraph tags',
  twitter: 'Twitter card',
  structuredData: 'JSON-LD',
  imageAltCoverage: 'Image alt coverage',
};

document.addEventListener('DOMContentLoaded', async () => {
  setupPaywall();
  document.getElementById('scan-btn').addEventListener('click', runScan);
  document.getElementById('upgrade-btn').addEventListener('click', showPaywall);
  await runScan();
});

async function runScan() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !/^https?:/.test(tab.url || '')) {
    showEmpty('Open a regular web page to scan.');
    return;
  }

  const response = await chrome.tabs.sendMessage(tab.id, { type: 'extkit/seo-scan' }).catch(() => null);
  if (!response?.ok) {
    showEmpty('Could not scan this page (script not loaded).');
    return;
  }

  const paid = await isPaid();
  const grade = calculateGrade(response.result, paid);

  // Header
  const badge = document.getElementById('grade-badge');
  badge.textContent = grade.grade;
  badge.style.background = gradeColor(grade.grade);
  document.getElementById('page-title').textContent = response.title || tab.title;
  document.getElementById('score-line').textContent = 'SEO score: ' + grade.percentage + '%' + (paid ? '' : '  ·  Free tier');

  // Free section
  renderChecks(
    document.getElementById('free-list'),
    response.result.free,
    FREE_HEURISTICS,
    /*locked=*/ false
  );

  // Pro section
  renderChecks(
    document.getElementById('pro-list'),
    response.result.pro,
    PRO_HEURISTICS,
    /*locked=*/ !paid
  );
}

function renderChecks(container, results, keys, locked) {
  container.innerHTML = '';
  if (locked) {
    container.classList.add('pro-locked');
    const overlay = document.createElement('li');
    overlay.className = 'locked-overlay';
    overlay.textContent = 'Upgrade to unlock OpenGraph, Twitter, JSON-LD, and image alt-text checks.';
    container.appendChild(overlay);
    return;
  }
  container.classList.remove('pro-locked');
  for (const key of keys) {
    const r = results[key];
    if (!r) continue;
    const li = document.createElement('li');
    li.innerHTML =
      '<span class="check-dot ' + r.score + '"></span>' +
      '<span class="check-name">' + HUMAN_NAMES[key] + '</span>' +
      '<span class="check-value">' + formatValue(key, r) + '</span>';
    container.appendChild(li);
  }
}

function formatValue(key, r) {
  if (key === 'title' || key === 'description') return r.length + ' chars';
  if (key === 'h1') return r.count + ' on page';
  if (key === 'canonical') return r.value ? 'set' : 'missing';
  if (key === 'viewport') return r.value ? 'set' : 'missing';
  if (key === 'openGraph') return Object.keys(r.keys).length + ' tags';
  if (key === 'twitter') return r.card || 'missing';
  if (key === 'structuredData') return r.count + ' blocks';
  if (key === 'imageAltCoverage') return Math.round(r.ratio * 100) + '%';
  return '';
}

function showEmpty(message) {
  document.getElementById('grade-badge').textContent = '--';
  document.getElementById('page-title').textContent = message;
  document.getElementById('score-line').textContent = '';
  document.getElementById('free-list').innerHTML = '';
  document.getElementById('pro-list').innerHTML = '';
}

function gradeColor(g) {
  switch (g) {
    case 'A+': return '#22c55e';
    case 'A': return '#16a34a';
    case 'B': return '#f59e0b';
    case 'C': return '#fb923c';
    case 'D': return '#ef4444';
    case 'F': return '#dc2626';
    default: return '#6b7280';
  }
}
