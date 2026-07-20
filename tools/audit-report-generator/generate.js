#!/usr/bin/env node
/**
 * Peak Post — Website Audit Report Generator
 *
 * Usage:
 *   node generate.js https://example.com
 *   node generate.js https://example.com --client "Acme Inc"
 *   node generate.js https://a.com https://b.com        (batch)
 *
 * Produces a branded HTML report per URL in ./reports/. Open the HTML in
 * any browser and Print → Save as PDF for the client deliverable.
 *
 * This is the delivery engine for Fiverr Gig 1 (Website Audit). It runs
 * the fetch-based audits locally — no Apify plan, no cost, ~5 seconds/site.
 */

const fs = require('fs');
const path = require('path');
const { runAllAudits } = require('./lib/audits');
const { render } = require('./lib/report');

function parseArgs(argv) {
  const urls = [];
  let client = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--client') { client = argv[++i]; continue; }
    urls.push(argv[i].startsWith('http') ? argv[i] : 'https://' + argv[i]);
  }
  return { urls, client };
}

function slug(url) {
  return url.replace(/^https?:\/\//, '').replace(/[^\w.-]/g, '_').replace(/_+$/, '').slice(0, 60);
}

async function main() {
  const { urls, client } = parseArgs(process.argv.slice(2));
  if (!urls.length) {
    console.error('Usage: node generate.js <url> [--client "Name"]');
    process.exit(1);
  }
  const outDir = path.join(__dirname, 'reports');
  fs.mkdirSync(outDir, { recursive: true });

  for (const url of urls) {
    process.stdout.write(`Auditing ${url} ... `);
    try {
      const data = await runAllAudits(url);
      const html = render(data, { client });
      const file = path.join(outDir, `audit-${slug(url)}-${data.scannedAt.slice(0, 10)}.html`);
      fs.writeFileSync(file, html, 'utf8');
      console.log(`${data.overallGrade} (${data.overallScore}/100) → ${path.relative(process.cwd(), file)}`);
      // Console summary of criticals for quick triage
      const crits = data.audits.flatMap((a) => a.findings.filter((f) => f.severity === 'crit').map((f) => `  ✗ [${a.name}] ${f.label}`));
      if (crits.length) console.log(crits.join('\n'));
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }
}

main();
