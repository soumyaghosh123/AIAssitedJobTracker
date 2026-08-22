import { describe, expect, it } from 'vitest';
import { daysSince, daysUntil, formatDate, isValidUrl, toDateInputValue, createId, escapeCsv, csvRow } from '../utils/format';

describe('date calculations', () => {
  it('daysSince returns correct values', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    expect(daysSince(threeDaysAgo)).toBe(3);
    expect(daysSince(undefined)).toBeNull();
    expect(daysSince('garbage')).toBeNull();
  });

  it('daysUntil returns positive for future dates', () => {
    const inFiveDays = new Date(Date.now() + 5 * 86_400_000).toISOString();
    expect(daysUntil(inFiveDays)).toBe(5);
  });

  it('daysUntil returns negative for past dates', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(daysUntil(twoDaysAgo)).toBe(-2);
  });
});

describe('formatDate', () => {
  it('returns placeholder for empty', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('formats a valid date', () => {
    const out = formatDate('2026-08-22');
    expect(out).toContain('2026');
  });
});

describe('isValidUrl', () => {
  it('accepts empty string', () => {
    expect(isValidUrl('')).toBe(true);
  });

  it('accepts http and https', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('https://linkedin.com/jobs')).toBe(true);
  });

  it('rejects invalid schemes and garbage', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('not a url')).toBe(false);
  });
});

describe('toDateInputValue', () => {
  it('returns yyyy-mm-dd for a date', () => {
    expect(toDateInputValue('2026-08-22T00:00:00.000Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns empty for empty input', () => {
    expect(toDateInputValue('')).toBe('');
    expect(toDateInputValue(undefined)).toBe('');
  });
});

describe('createId', () => {
  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId('job')));
    expect(ids.size).toBe(100);
    expect(ids.values().next().value).toContain('job_');
  });
});

describe('csv escaping', () => {
  it('escapes quotes and commas', () => {
    expect(escapeCsv('Hello, "world"')).toBe('"Hello, ""world"""');
    expect(escapeCsv('plain')).toBe('plain');
    expect(escapeCsv(undefined)).toBe('');
    expect(csvRow(['a', 'b,c'])).toBe('a,"b,c"');
  });
});
