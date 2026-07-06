/**
 * CSS Inspector — Popup script
 * The pattern to copy: scan → render free slice → gate the Pro slice
 * behind isPaid() → showPaywall() on gated interactions.
 */

import { isPaid } from '../lib/is-paid.js';
import { setupPaywall, showPaywall } from '../popup/paywall.js';

let lastScan = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupPaywall();
  document.getElementById('rescan-btn').addEventListener('click', runScan);
  document.getElementById('export-btn').addEventListener('click', exportJson);
  await runScan();
});

async function runScan() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !/^https?:/.test(tab.url || '')) {
    renderEmpty('Open a regular web page to inspect its CSS variables.');
    return;
  }
  const resp = await chrome.tabs.sendMessage(tab.id, { type: 'extkit/css-scan' }).catch(() => null);
  if (!resp?.ok) {
    renderEmpty('Could not scan this page.');
    return;
  }
  lastScan = resp;
  const paid = await isPaid();

  document.getElementById('counts').textContent =
    `${resp.counts.root} :root · ${resp.counts.scopes} scopes · ${resp.counts.orphans} orphans`;

  renderVars(document.getElementById('root-list'), resp.root);

  const proList = document.getElementById('pro-list');
  if (paid) {
    proList.classList.remove('pro-locked');
    const flat = {};
    for (const [scope, vars] of Object.entries(resp.byScope)) {
      for (const [k, v] of Object.entries(vars)) flat[`${scope} ${k}`] = v;
    }
    for (const orphan of resp.orphans) flat[`⚠ ${orphan}`] = '(used but never defined)';
    renderVars(proList, flat);
  } else {
    proList.classList.add('pro-locked');
    proList.innerHTML = '';
    const li = document.createElement('li');
    li.style.border = 'none';
    li.textContent = `${resp.counts.scopes} scoped declarations + ${resp.counts.orphans} orphaned var() hidden — upgrade to see them.`;
    li.addEventListener('click', showPaywall);
    proList.appendChild(li);
  }
}

function renderVars(container, vars) {
  container.innerHTML = '';
  const entries = Object.entries(vars);
  if (!entries.length) {
    const li = document.createElement('li');
    li.textContent = '(none found)';
    container.appendChild(li);
    return;
  }
  for (const [name, value] of entries.slice(0, 300)) {
    const li = document.createElement('li');
    const isColor = /^#|^rgb|^hsl|^oklch/.test(value.trim());
    li.innerHTML =
      `<span class="var-name">${esc(name)}</span>` +
      `<span class="var-value">${isColor ? `<span class="swatch" style="background:${esc(value)}"></span>` : ''}${esc(value)}</span>`;
    container.appendChild(li);
  }
}

async function exportJson() {
  if (!(await isPaid())) return showPaywall();
  if (!lastScan) return;
  const blob = new Blob([JSON.stringify({ root: lastScan.root, byScope: lastScan.byScope, orphans: lastScan.orphans }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'css-variables.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderEmpty(message) {
  document.getElementById('counts').textContent = '';
  document.getElementById('root-list').innerHTML = `<li>${esc(message)}</li>`;
  document.getElementById('pro-list').innerHTML = '';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
