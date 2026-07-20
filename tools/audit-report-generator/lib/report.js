/**
 * report.js — Renders audit results into a branded, print-to-PDF HTML report.
 * Peak Post identity (petrol + gold). Self-contained: no external assets,
 * so it opens anywhere and prints to a clean PDF via the browser.
 */

const GRADE_COLOR = {
  'A+': '#2E7D45', 'A': '#2E7D45', 'B': '#5B8C3E',
  'C': '#A8720E', 'D': '#B5541C', 'F': '#B3372B',
};
const SEV = {
  good: { bg: '#E8F3EC', fg: '#2E7D45', mark: '✓' },
  warn: { bg: '#F8F0DD', fg: '#A8720E', mark: '!' },
  crit: { bg: '#F9E9E6', fg: '#B3372B', mark: '×' },
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function priorityFixes(data) {
  const fixes = [];
  for (const a of data.audits) {
    for (const f of a.findings) {
      if (f.severity === 'crit') fixes.push({ ...f, area: a.name, rank: 0 });
      else if (f.severity === 'warn') fixes.push({ ...f, area: a.name, rank: 1 });
    }
  }
  return fixes.sort((a, b) => a.rank - b.rank).slice(0, 12);
}

function render(data, opts = {}) {
  const client = opts.client || new URL(data.finalUrl).hostname;
  const date = new Date(data.scannedAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  const fixes = priorityFixes(data);
  const oColor = GRADE_COLOR[data.overallGrade] || '#5B6B63';

  const auditCards = data.audits.map((a) => {
    const c = GRADE_COLOR[a.grade] || '#5B6B63';
    const rows = a.findings.map((f) => {
      const s = SEV[f.severity];
      return `<li class="finding">
        <span class="mark" style="background:${s.bg};color:${s.fg}">${s.mark}</span>
        <div><span class="fl">${esc(f.label)}</span>${f.detail ? `<span class="fd">${esc(f.detail)}</span>` : ''}</div>
      </li>`;
    }).join('');
    return `<section class="card">
      <div class="card-head">
        <h3>${esc(a.name)}</h3>
        <span class="grade" style="background:${c}">${a.grade}</span>
      </div>
      <ul class="findings">${rows}</ul>
    </section>`;
  }).join('');

  const fixRows = fixes.map((f, i) => {
    const s = SEV[f.severity];
    return `<tr>
      <td class="rank">${i + 1}</td>
      <td><span class="pill" style="background:${s.bg};color:${s.fg}">${f.severity === 'crit' ? 'Critical' : 'Improve'}</span></td>
      <td class="area">${esc(f.area)}</td>
      <td><strong>${esc(f.label)}</strong>${f.detail ? `<br><span class="muted">${esc(f.detail)}</span>` : ''}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Website Audit — ${esc(client)}</title>
<style>
  @page { margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.55 -apple-system, "Segoe UI", system-ui, sans-serif; color: #1A2420; background: #fff; }
  .sheet { max-width: 820px; margin: 0 auto; padding: 32px 28px 60px; }
  .cover { background: #134B57; color: #EAF4F1; border-radius: 14px; padding: 34px 36px; display: flex; justify-content: space-between; align-items: center; gap: 24px; }
  .cover .eyebrow { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #F4B942; font-weight: 700; margin: 0 0 6px; }
  .cover h1 { font-size: 30px; margin: 0 0 4px; letter-spacing: -0.02em; }
  .cover .client { font-size: 16px; color: #9FC4CC; margin: 0; word-break: break-all; }
  .cover .date { font-size: 13px; color: #6F97A0; margin: 10px 0 0; }
  .score-badge { flex: none; text-align: center; }
  .score-badge .ring { width: 108px; height: 108px; border-radius: 50%; background: ${oColor}; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .score-badge .g { font-size: 40px; font-weight: 800; line-height: 1; }
  .score-badge .s { font-size: 13px; opacity: 0.9; }
  .score-badge .cap { font-size: 11px; color: #9FC4CC; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.08em; }

  h2 { font-size: 18px; margin: 34px 0 14px; letter-spacing: -0.01em; }
  .lead { color: #4A5B54; margin: 14px 0 0; }

  .fixtable { width: 100%; border-collapse: collapse; font-size: 13.5px; border: 1px solid #E1E6E2; border-radius: 10px; overflow: hidden; }
  .fixtable th { text-align: left; background: #F3F6F4; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #5B6B63; padding: 9px 12px; }
  .fixtable td { padding: 10px 12px; border-top: 1px solid #EDF1EE; vertical-align: top; }
  .fixtable .rank { font-weight: 800; color: #134B57; width: 30px; }
  .fixtable .area { color: #5B6B63; white-space: nowrap; }
  .pill { font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 99px; white-space: nowrap; }
  .muted { color: #6B7C74; }

  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
  .card { border: 1px solid #E1E6E2; border-radius: 10px; padding: 14px 16px; break-inside: avoid; }
  .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .card-head h3 { font-size: 14px; margin: 0; }
  .grade { color: #fff; font-weight: 800; font-size: 13px; padding: 2px 10px; border-radius: 6px; }
  .findings { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
  .finding { display: flex; gap: 8px; align-items: flex-start; }
  .mark { flex: none; width: 18px; height: 18px; border-radius: 5px; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
  .fl { display: block; font-weight: 600; font-size: 13px; }
  .fd { display: block; color: #6B7C74; font-size: 12.5px; margin-top: 1px; }

  .next { background: #F3F6F4; border-radius: 12px; padding: 22px 24px; margin-top: 34px; }
  .next h2 { margin-top: 0; }
  .next p { margin: 8px 0; color: #3E4F48; }
  .footer { margin-top: 34px; padding-top: 16px; border-top: 1px solid #E1E6E2; font-size: 12px; color: #7A8A82; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  .brand { font-weight: 700; color: #134B57; }
  @media (max-width: 640px) { .cards { grid-template-columns: 1fr; } .cover { flex-direction: column; text-align: center; } }
</style></head>
<body><div class="sheet">

  <div class="cover">
    <div>
      <p class="eyebrow">Website Audit Report</p>
      <h1>${esc(client)}</h1>
      <p class="client">${esc(data.finalUrl)}</p>
      <p class="date">Prepared ${date} · Peak Post</p>
    </div>
    <div class="score-badge">
      <div class="ring"><span class="g">${data.overallGrade}</span><span class="s">${data.overallScore}/100</span></div>
      <p class="cap">Overall Health</p>
    </div>
  </div>

  <p class="lead">This report audits <strong>${esc(client)}</strong> across seven areas that affect security, search ranking, speed, and accessibility. Each area is graded A+ to F. The prioritized action list below tells you exactly what to fix first — and why it matters.</p>

  <h2>Priority Fixes</h2>
  <table class="fixtable">
    <thead><tr><th>#</th><th>Priority</th><th>Area</th><th>Issue &amp; recommendation</th></tr></thead>
    <tbody>${fixRows || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#2E7D45;font-weight:600">No critical or warning issues found — excellent.</td></tr>'}</tbody>
  </table>

  <h2>Full Results by Category</h2>
  <div class="cards">${auditCards}</div>

  <div class="next">
    <h2>What's next</h2>
    <p><strong>Want these fixed, not just found?</strong> I can implement the priority fixes above — server headers, meta tags, structured data, compression, and accessibility corrections — as a follow-on project. Audit clients get priority scheduling.</p>
    <p><strong>Deeper analysis available:</strong> per-element WCAG color-contrast audit, real-browser Core Web Vitals measurement, and full PWA installability check are included in the Premium tier or as an add-on.</p>
  </div>

  <div class="footer">
    <span><span class="brand">Peak Post</span> · peakpost.ca · Automation, audits &amp; data pipelines</span>
    <span>Audited ${date}</span>
  </div>

</div></body></html>`;
}

module.exports = { render };
