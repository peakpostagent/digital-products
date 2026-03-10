// matcher.test.js — Unit tests for the keyword matching engine
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

let JobMatchScore;

beforeAll(() => {
  // Set up a minimal DOM environment for stripHtml
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.document = dom.window.document;

  // Load matcher.js and capture the global it creates
  const matcherCode = readFileSync(
    join(__dirname, '..', 'src', 'lib', 'matcher.js'),
    'utf-8'
  );
  // Execute in this context — it defines `JobMatchScore` globally
  const fn = new Function(matcherCode + '\nreturn JobMatchScore;');
  JobMatchScore = fn();
});

describe('normalize', () => {
  it('lowercases input', () => {
    expect(JobMatchScore.normalize('JavaScript')).toBe('javascript');
  });

  it('resolves synonyms', () => {
    expect(JobMatchScore.normalize('js')).toBe('javascript');
    expect(JobMatchScore.normalize('ts')).toBe('typescript');
    expect(JobMatchScore.normalize('k8s')).toBe('kubernetes');
    expect(JobMatchScore.normalize('react.js')).toBe('react');
    expect(JobMatchScore.normalize('node.js')).toBe('nodejs');
  });

  it('returns unchanged if no synonym', () => {
    expect(JobMatchScore.normalize('python')).toBe('python');
    expect(JobMatchScore.normalize('docker')).toBe('docker');
  });
});

describe('extractKeywords', () => {
  it('returns empty array for empty input', () => {
    expect(JobMatchScore.extractKeywords('')).toEqual([]);
    expect(JobMatchScore.extractKeywords(null)).toEqual([]);
    expect(JobMatchScore.extractKeywords(undefined)).toEqual([]);
  });

  it('extracts simple keywords', () => {
    const keywords = JobMatchScore.extractKeywords('Python developer with Docker experience');
    expect(keywords).toContain('python');
    expect(keywords).toContain('docker');
    expect(keywords).toContain('developer');
  });

  it('filters out stop words', () => {
    const keywords = JobMatchScore.extractKeywords('We are looking for a strong candidate with experience');
    // All of these are stop words, so result should be empty or very few
    expect(keywords).not.toContain('we');
    expect(keywords).not.toContain('are');
    expect(keywords).not.toContain('for');
    expect(keywords).not.toContain('with');
    expect(keywords).not.toContain('experience');
    expect(keywords).not.toContain('strong');
  });

  it('normalizes synonyms during extraction', () => {
    const keywords = JobMatchScore.extractKeywords('Proficient in JS and React.js');
    expect(keywords).toContain('javascript');
    expect(keywords).toContain('react');
    expect(keywords).not.toContain('js');
    expect(keywords).not.toContain('react.js');
  });

  it('detects multi-word terms', () => {
    const keywords = JobMatchScore.extractKeywords(
      'Experience with machine learning and natural language processing'
    );
    expect(keywords).toContain('machine learning');
    expect(keywords).toContain('natural language processing');
  });

  it('deduplicates keywords', () => {
    const keywords = JobMatchScore.extractKeywords('Python Python python PYTHON');
    const count = keywords.filter(k => k === 'python').length;
    expect(count).toBe(1);
  });

  it('strips HTML when present', () => {
    const keywords = JobMatchScore.extractKeywords(
      '<p>We need a <strong>Python</strong> developer</p>'
    );
    expect(keywords).toContain('python');
    expect(keywords).toContain('developer');
  });

  it('returns sorted results', () => {
    const keywords = JobMatchScore.extractKeywords('Zebra Python Docker Angular');
    const sorted = [...keywords].sort();
    expect(keywords).toEqual(sorted);
  });
});

describe('calculateMatch', () => {
  it('returns 0 for empty job keywords', () => {
    const result = JobMatchScore.calculateMatch(['python'], []);
    expect(result.score).toBe(0);
    expect(result.matched).toEqual([]);
    expect(result.missing).toEqual([]);
  });

  it('returns 0 for empty resume keywords', () => {
    const result = JobMatchScore.calculateMatch([], ['python', 'docker']);
    expect(result.score).toBe(0);
    expect(result.matched).toEqual([]);
    expect(result.missing).toEqual(['python', 'docker']);
  });

  it('returns 100 for perfect match', () => {
    const keywords = ['python', 'docker', 'kubernetes'];
    const result = JobMatchScore.calculateMatch(keywords, keywords);
    expect(result.score).toBe(100);
    expect(result.matched.length).toBe(3);
    expect(result.missing.length).toBe(0);
  });

  it('calculates partial match correctly', () => {
    const resume = ['python', 'docker', 'linux'];
    const job = ['python', 'docker', 'kubernetes', 'terraform'];
    const result = JobMatchScore.calculateMatch(resume, job);
    expect(result.score).toBe(50); // 2 of 4
    expect(result.matched).toContain('python');
    expect(result.matched).toContain('docker');
    expect(result.missing).toContain('kubernetes');
    expect(result.missing).toContain('terraform');
  });

  it('matches via synonyms', () => {
    const resume = ['javascript'];
    const job = ['js'];
    const result = JobMatchScore.calculateMatch(resume, job);
    // 'js' normalizes to 'javascript', which is in resume
    expect(result.score).toBe(100);
    expect(result.matched).toContain('js');
  });

  it('handles partial substring matches', () => {
    const resume = ['postgresql'];
    const job = ['postgres'];
    const result = JobMatchScore.calculateMatch(resume, job);
    // 'postgres' normalizes to 'postgresql', and 'postgresql' contains 'postgresql'
    expect(result.score).toBe(100);
  });

  it('returns score as integer percentage', () => {
    const resume = ['python'];
    const job = ['python', 'docker', 'kubernetes'];
    const result = JobMatchScore.calculateMatch(resume, job);
    expect(result.score).toBe(33); // Math.round(1/3 * 100)
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it('handles null inputs gracefully', () => {
    expect(JobMatchScore.calculateMatch(null, ['python']).score).toBe(0);
    expect(JobMatchScore.calculateMatch(['python'], null).score).toBe(0);
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    const text = JobMatchScore.stripHtml('<p>Hello <b>world</b></p>');
    expect(text).toBe('Hello world');
  });

  it('handles plain text', () => {
    const text = JobMatchScore.stripHtml('Just plain text');
    expect(text).toBe('Just plain text');
  });
});
