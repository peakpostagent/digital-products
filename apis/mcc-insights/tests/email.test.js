// email.test.js — Unit tests for renderEmailHtml.
// Critical contract: any string that could contain user input (LLM output,
// stats values) must be HTML-escaped before insertion. Untrusted data goes
// into a user's inbox via Resend, so XSS that escapes into email HTML would
// land in every Pro subscriber's mail client.

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { renderEmailHtml } = require('../lib/email');

const baseStats = {
  totalMeetings: 9,
  totalCost: 640.50,
  avgCost: 71.17,
  prevTotalCost: 780.00,
  valuablePercent: 55,
  currency: 'USD'
};

describe('renderEmailHtml', () => {
  it('renders a complete HTML document', () => {
    const html = renderEmailHtml('This week was great.', baseStats);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('</body></html>');
    expect(html).toContain('Your weekly meeting digest');
  });

  it('includes all stat values from the table', () => {
    const html = renderEmailHtml('ok', baseStats);
    expect(html).toContain('9'); // totalMeetings
    expect(html).toContain('640.50');
    expect(html).toContain('71.17');
    expect(html).toContain('780.00');
    expect(html).toContain('55');
  });

  it('includes the insight text', () => {
    const html = renderEmailHtml('Your meetings dropped by 15% this week.', baseStats);
    expect(html).toContain('Your meetings dropped by 15% this week.');
  });

  it('ESCAPES <script> in insight text (XSS protection)', () => {
    const malicious = 'Hello <script>alert(1)</script>';
    const html = renderEmailHtml(malicious, baseStats);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes & < > " \'', () => {
    const html = renderEmailHtml('A&B <i>italic</i> "quoted" \'single\'', baseStats);
    expect(html).toContain('A&amp;B');
    expect(html).toContain('&lt;i&gt;italic&lt;/i&gt;');
    expect(html).toContain('&quot;quoted&quot;');
    expect(html).toContain('&#39;single&#39;');
  });

  it('escapes values in the stat table too', () => {
    const statsWithEvil = {
      ...baseStats,
      totalMeetings: '<img onerror=alert(1)>',
      valuablePercent: '"><script>'
    };
    const html = renderEmailHtml('ok', statsWithEvil);
    expect(html).not.toContain('<img onerror=alert(1)>');
    expect(html).not.toContain('"><script>');
    expect(html).toContain('&lt;img');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('defaults currency to USD when missing', () => {
    const html = renderEmailHtml('ok', { ...baseStats, currency: undefined });
    expect(html).toContain('USD');
  });

  it('handles zero-value stats without crashing', () => {
    const html = renderEmailHtml('empty week', {
      totalMeetings: 0, totalCost: 0, avgCost: 0, prevTotalCost: 0, valuablePercent: 0, currency: 'USD'
    });
    expect(html).toContain('0.00');
    expect(html).toContain('empty week');
  });

  it('preserves whitespace in insight via white-space:pre-line', () => {
    const html = renderEmailHtml('Line 1\n\nLine 2', baseStats);
    // The CSS white-space:pre-line rule on the <p> preserves linebreaks visually
    expect(html).toContain('white-space:pre-line');
    expect(html).toContain('Line 1');
    expect(html).toContain('Line 2');
  });

  it('contains a placeholder for the unsubscribe URL', () => {
    const html = renderEmailHtml('ok', baseStats);
    expect(html).toContain('{{UNSUBSCRIBE_URL}}');
  });
});
