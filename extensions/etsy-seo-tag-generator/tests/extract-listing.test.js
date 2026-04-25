// extract-listing.test.js — placeholder smoke test for the content script.
// The extractListing() function is wrapped in an IIFE inside content.js so it
// isn't directly importable. When backend integration ships, refactor the
// extractor into a separate lib/ module and add real tests here.

import { describe, it, expect } from 'vitest';

describe('etsy-seo-tag-generator scaffold', () => {
  it('placeholder — vitest runner is wired and finds tests', () => {
    expect(1 + 1).toBe(2);
  });
});
