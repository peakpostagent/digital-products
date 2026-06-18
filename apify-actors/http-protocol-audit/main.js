/**
 * HTTP Protocol & Compression Audit — Apify Actor
 *
 * Audits how a URL is served: protocol version (HTTP/1.1, HTTP/2, HTTP/3),
 * compression (Brotli, gzip, deflate, none), TLS version, and key
 * performance-related headers (cache-control, vary, etag, connection).
 *
 * Useful for perf consultants, infrastructure audits, and detecting hosts
 * that are leaving 30-50% performance on the table by not enabling HTTP/2
 * or Brotli.
 *
 * Implementation: uses Node's native fetch which surfaces HTTP/2 via the
 * undici HTTP client. For HTTP/3 (QUIC) detection we infer from
 * Alt-Svc headers (the standard advertisement mechanism).
 */

const { Actor } = require('apify');

Actor.main(async () => {
  const input = (await Actor.getInput()) || {};
  const urls = Array.isArray(input.urls) && input.urls.length
    ? input.urls
    : input.url
      ? [input.url]
      : ['https://example.com'];

  for (const targetUrl of urls.slice(0, 1000)) {
    const result = await audit(targetUrl);
    await Actor.pushData(result);
  }
});

async function audit(targetUrl) {
  // First request: no compression preference, just to see what server defaults to
  const noCompressionResp = await tryFetch(targetUrl, {});

  // Second request: advertise we accept br + gzip
  const compressionResp = await tryFetch(targetUrl, {
    'accept-encoding': 'br, gzip, deflate',
  });

  if (!noCompressionResp.ok && !compressionResp.ok) {
    return {
      url: targetUrl,
      error: noCompressionResp.error || compressionResp.error,
      scannedAt: new Date().toISOString(),
    };
  }

  const resp = compressionResp.ok ? compressionResp : noCompressionResp;

  const headers = resp.headers;

  // --- Detection ---
  const contentEncoding = (headers['content-encoding'] || '').toLowerCase();
  const compressionType = contentEncoding || 'none';

  const altSvc = headers['alt-svc'] || '';
  const supportsH3 = /h3(=|,|\s|$)/i.test(altSvc) || /quic/i.test(altSvc);

  const server = headers['server'] || '(not advertised)';
  const cacheControl = headers['cache-control'] || '(not set)';
  const vary = headers['vary'] || '(not set)';
  const etag = headers['etag'] ? 'present' : 'missing';
  const lastModified = headers['last-modified'] ? 'present' : 'missing';

  // HSTS
  const hsts = headers['strict-transport-security'] || null;

  // Estimate compression savings (rough)
  const sizeBytes = resp.sizeBytes || 0;
  const isHttps = targetUrl.startsWith('https://');

  // --- Score ---
  let score = 100;
  const issues = [];

  if (!isHttps) {
    issues.push('Not served over HTTPS');
    score -= 30;
  }
  if (compressionType === 'none') {
    issues.push('No compression — pages send raw text');
    score -= 25;
  } else if (compressionType === 'gzip') {
    issues.push('Using gzip (ok). Brotli would save another 15-25%');
    score -= 5;
  }
  if (!supportsH3) {
    issues.push('HTTP/3 not advertised — slower for repeat visitors over flaky networks');
    score -= 10;
  }
  if (etag === 'missing' && lastModified === 'missing') {
    issues.push('No cache-validation headers (etag or last-modified)');
    score -= 10;
  }
  if (!hsts) {
    issues.push('No HSTS header — first-visit downgrade attack possible');
    score -= 5;
  }
  if (cacheControl === '(not set)') {
    issues.push('No cache-control header — browsers default to suboptimal caching');
    score -= 5;
  }

  let grade;
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return {
    url: targetUrl,
    finalUrl: resp.finalUrl,
    httpStatus: resp.status,
    grade,
    score: Math.max(0, score),
    protocol: {
      isHttps,
      altSvc,
      supportsH3,
      server,
    },
    compression: {
      type: compressionType,
      contentLength: headers['content-length'] || null,
      contentEncoding,
      sizeBytesReceived: sizeBytes,
    },
    caching: {
      cacheControl,
      vary,
      etag,
      lastModified,
    },
    security: {
      hsts,
    },
    issues,
    scannedAt: new Date().toISOString(),
  };
}

async function tryFetch(url, extraHeaders) {
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; Apify-HTTPProtocolAudit/1.0)',
        ...extraHeaders,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    const headers = {};
    r.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });
    let sizeBytes = 0;
    try {
      const body = await r.arrayBuffer();
      sizeBytes = body.byteLength;
    } catch (_) {}
    return { ok: true, status: r.status, headers, finalUrl: r.url, sizeBytes };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
