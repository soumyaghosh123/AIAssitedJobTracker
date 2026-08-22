import { describe, expect, it } from 'vitest';
import { validateJobInput, isJobStatus } from '../features/jobs/jobValidation';

describe('validateJobInput', () => {
  it('rejects missing company name', () => {
    const errors = validateJobInput({ jobTitle: 'QA Engineer' });
    expect(errors.companyName).toBeTruthy();
  });

  it('rejects missing job title', () => {
    const errors = validateJobInput({ companyName: 'Microsoft' });
    expect(errors.jobTitle).toBeTruthy();
  });

  it('accepts a valid minimal job', () => {
    const errors = validateJobInput({ companyName: 'Microsoft', jobTitle: 'QA Engineer' });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('rejects invalid URLs', () => {
    const errors = validateJobInput({
      companyName: 'Microsoft',
      jobTitle: 'QA Engineer',
      linkedinUrl: 'not-a-url',
    });
    expect(errors.linkedinUrl).toBeTruthy();
  });

  it('accepts valid http/https URLs', () => {
    const errors = validateJobInput({
      companyName: 'Microsoft',
      jobTitle: 'QA Engineer',
      linkedinUrl: 'https://www.linkedin.com/jobs/view/123',
    });
    expect(errors.linkedinUrl).toBeUndefined();
  });

  it('rejects invalid emails', () => {
    const errors = validateJobInput({
      companyName: 'Microsoft',
      jobTitle: 'QA Engineer',
      recruiterEmail: 'nope',
    });
    expect(errors.recruiterEmail).toBeTruthy();
  });

  it('trims and validates whitespace-only required fields', () => {
    const errors = validateJobInput({ companyName: '   ', jobTitle: '  ' });
    expect(errors.companyName).toBeTruthy();
    expect(errors.jobTitle).toBeTruthy();
  });
});

describe('isJobStatus', () => {
  it('accepts the six statuses', () => {
    expect(isJobStatus('wishlist')).toBe(true);
    expect(isJobStatus('applied')).toBe(true);
    expect(isJobStatus('follow_up')).toBe(true);
    expect(isJobStatus('interview')).toBe(true);
    expect(isJobStatus('offer')).toBe(true);
    expect(isJobStatus('rejected')).toBe(true);
  });

  it('rejects invalid statuses', () => {
    expect(isJobStatus('accepted')).toBe(false);
    expect(isJobStatus('')).toBe(false);
    expect(isJobStatus(undefined)).toBe(false);
    expect(isJobStatus('WISHLIST')).toBe(false);
  });
});
