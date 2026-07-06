# Article Extractor — Clean Text for LLM & RAG Pipelines

URL in → clean article JSON out. Title, author, publish date, full plain text, top image, language, word count, reading time. No browser, no boilerplate, no nav-menu garbage in your embeddings.

## Why this Actor

If you're feeding web articles to an LLM — RAG ingestion, summarization pipelines, news monitoring, research agents — raw HTML is 90% noise. This Actor extracts just the article using a three-layer strategy:

1. **JSON-LD** (`Article` / `NewsArticle` / `BlogPosting` structured data) — most reliable when present
2. **Open Graph / meta tags** — title, author, dates, hero image
3. **Readability heuristics** — semantic containers (`<article>`, `<main>`, common content classes) with paragraph-level scoring, nav/footer/aside stripped

Plain-fetch only: fast, cheap, and scales to 1,000 URLs per run.

## Input

```json
{ "url": "https://example.com/blog/some-article" }
```

Batch mode:

```json
{ "urls": ["https://a.com/post-1", "https://b.com/story-2"], "maxChars": 50000 }
```

## Output

```json
{
  "url": "https://example.com/blog/some-article",
  "title": "How We Scaled to 1M Users",
  "author": "Jane Smith",
  "publishedAt": "2026-06-12T09:00:00Z",
  "siteName": "Example Engineering",
  "language": "en",
  "description": "Lessons from scaling...",
  "topImage": "https://example.com/hero.jpg",
  "text": "Full clean plain text of the article...\n\nParagraphs preserved...",
  "wordCount": 1840,
  "readingTimeMinutes": 8,
  "extractionSignals": { "hadJsonLd": true, "hadOgTitle": true }
}
```

Failed URLs return `{ url, error }` rows — batch runs never fail silently.

## Use cases

- **RAG / vector-DB ingestion** — clean text straight to your embedder
- **News + brand monitoring** — schedule against a URL feed, pipe to Slack/webhook
- **LLM research agents** — give your agent a "read this page properly" tool via Apify MCP
- **Content archiving** — normalized JSON of everything your team publishes or tracks

## Limitations

Fetch-only: JavaScript-rendered articles (rare for news/blogs) and hard paywalls are out of scope. For those, pair with a browser-based Actor.

## Pricing

Pay-per-result: **$0.002 per article** ($2 per 1,000). A 100-article batch typically completes in under a minute.

## Author

Built by [Peak Post](https://peakpost.ca) — 14 more data + audit Actors on the profile.
