/**
 * ATS Job Postings Scraper — Apify Actor
 *
 * Scrapes job postings from company career boards hosted on the four
 * major ATS platforms with PUBLIC JSON APIs:
 *   - Greenhouse  (boards-api.greenhouse.io)
 *   - Lever       (api.lever.co)
 *   - Ashby       (api.ashbyhq.com posting-api)
 *   - Workable    (apply.workable.com widget API)
 *
 * Input: company slugs or careers-page URLs (platform auto-detected).
 * Output: one normalized JSON row per job posting.
 *
 * These endpoints are the same ones the companies' own careers pages call —
 * officially public for job-board embedding. No browser, no proxies needed.
 */

const { Actor } = require('apify');

const UA = 'Mozilla/5.0 (compatible; ATSJobPostingsScraper/1.0; +https://apify.com)';

Actor.main(async () => {
  const input = (await Actor.getInput()) || {};

  // Fall back to a known-good demo board so Apify's daily auto-test passes.
  const companies = Array.isArray(input.companies) && input.companies.length
    ? input.companies.slice(0, 500)
    : ['https://boards.greenhouse.io/stripe'];

  const titleFilter = (input.titleFilter || '').toLowerCase().trim();
  const locationFilter = (input.locationFilter || '').toLowerCase().trim();
  const remoteOnly = input.remoteOnly === true;
  const includeDescription = input.includeDescription !== false;

  let totalJobs = 0;
  for (const entry of companies) {
    const target = detectPlatform(entry);
    let jobs = [];
    let errorMsg = null;

    if (target.platform === 'unknown') {
      // Bare slug — try each platform until one responds with jobs
      for (const p of ['greenhouse', 'lever', 'ashby', 'workable']) {
        try {
          jobs = await FETCHERS[p](target.slug);
          if (jobs.length > 0) {
            target.platform = p;
            break;
          }
        } catch (_) { /* try next */ }
      }
      if (target.platform === 'unknown') {
        errorMsg = `No public job board found for "${entry}" on Greenhouse/Lever/Ashby/Workable`;
      }
    } else {
      try {
        jobs = await FETCHERS[target.platform](target.slug);
      } catch (err) {
        errorMsg = err.message;
      }
    }

    if (errorMsg) {
      await Actor.pushData({
        type: 'error',
        company: target.slug,
        input: entry,
        error: errorMsg,
        scrapedAt: new Date().toISOString(),
      });
      continue;
    }

    for (const job of jobs) {
      if (titleFilter && !job.title.toLowerCase().includes(titleFilter)) continue;
      if (locationFilter && !(job.location || '').toLowerCase().includes(locationFilter)) continue;
      if (remoteOnly && !job.isRemote) continue;
      if (!includeDescription) delete job.description;
      await Actor.pushData({
        ...job,
        company: target.slug,
        platform: target.platform,
        scrapedAt: new Date().toISOString(),
      });
      totalJobs++;
    }
  }

  console.log(`Done. ${totalJobs} job postings scraped from ${companies.length} board(s).`);
});

// ---------------------------------------------------------------------------

function detectPlatform(entry) {
  const s = String(entry).trim();
  let m;
  if ((m = s.match(/boards\.greenhouse\.io\/([\w-]+)/i)) || (m = s.match(/job-boards\.greenhouse\.io\/([\w-]+)/i))) {
    return { platform: 'greenhouse', slug: m[1] };
  }
  if ((m = s.match(/jobs\.lever\.co\/([\w-]+)/i))) {
    return { platform: 'lever', slug: m[1] };
  }
  if ((m = s.match(/jobs\.ashbyhq\.com\/([\w-]+)/i))) {
    return { platform: 'ashby', slug: m[1] };
  }
  if ((m = s.match(/apply\.workable\.com\/(?:api\/v1\/widget\/accounts\/)?([\w-]+)/i))) {
    return { platform: 'workable', slug: m[1] };
  }
  if (/^https?:\/\//i.test(s)) {
    // Unrecognized URL — extract last path segment as best-effort slug
    const seg = s.replace(/\/+$/, '').split('/').pop();
    return { platform: 'unknown', slug: seg || s };
  }
  return { platform: 'unknown', slug: s };
}

async function getJson(url, opts = {}) {
  const r = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
    ...opts,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} from ${new URL(url).host}`);
  return r.json();
}

function stripHtml(html) {
  if (!html) return '';
  // Greenhouse returns HTML-escaped markup (&lt;h2&gt;...), so decode
  // entities FIRST, then remove the real tags that emerge.
  let s = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FETCHERS = {
  async greenhouse(slug) {
    const data = await getJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
    return (data.jobs || []).map((j) => ({
      title: j.title || '',
      department: (j.departments || []).map((d) => d.name).join(', ') || null,
      team: null,
      location: j.location?.name || null,
      isRemote: /remote/i.test(j.location?.name || ''),
      employmentType: null,
      compensation: null,
      url: j.absolute_url,
      publishedAt: j.updated_at || null,
      description: stripHtml(j.content).slice(0, 5000) || null,
    }));
  },

  async lever(slug) {
    const data = await getJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    return (Array.isArray(data) ? data : []).map((j) => ({
      title: j.text || '',
      department: j.categories?.department || null,
      team: j.categories?.team || null,
      location: j.categories?.location || null,
      isRemote: j.workplaceType === 'remote' || /remote/i.test(j.categories?.location || ''),
      employmentType: j.categories?.commitment || null,
      compensation: null,
      url: j.hostedUrl,
      publishedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
      description: (j.descriptionPlain || '').slice(0, 5000) || null,
    }));
  },

  async ashby(slug) {
    const data = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`);
    return (data.jobs || []).map((j) => ({
      title: j.title || '',
      department: j.department || null,
      team: j.team || null,
      location: [j.location, ...(j.secondaryLocations || []).map((l) => l.location)]
        .filter(Boolean).join('; ') || null,
      isRemote: j.isRemote === true,
      employmentType: j.employmentType || null,
      compensation: j.compensation?.compensationTierSummary || null,
      url: j.jobUrl || j.applyUrl,
      publishedAt: j.publishedAt || null,
      description: stripHtml(j.descriptionHtml).slice(0, 5000) || null,
    }));
  },

  async workable(slug) {
    const data = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${slug}?details=true`);
    return (data.jobs || []).map((j) => ({
      title: j.title || '',
      department: j.department || null,
      team: null,
      location: [j.city, j.state, j.country].filter(Boolean).join(', ') || null,
      isRemote: j.telecommuting === true,
      employmentType: j.employment_type || null,
      compensation: null,
      url: j.url,
      publishedAt: j.created_at || null,
      description: stripHtml(j.description).slice(0, 5000) || null,
    }));
  },
};
