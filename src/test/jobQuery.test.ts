import { describe, expect, it } from 'vitest';
import {
  filterJobs,
  sortJobs,
  searchJobs,
  isQualityRole,
  qualityRoles,
  EMPTY_FILTERS,
  type JobFilters,
  type JobSort,
} from '../features/jobs/jobQuery';
import type { Job } from '../types';

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: overrides.id ?? 'job_1',
    companyName: 'Microsoft',
    jobTitle: 'QA Engineer',
    status: 'wishlist',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

const jobs: Job[] = [
  makeJob({ id: '1', companyName: 'Microsoft', jobTitle: 'QA Lead', status: 'wishlist', location: 'Hyderabad', salaryRange: '₹30–40 LPA', experience: 'Lead', jobType: 'Full-time' }),
  makeJob({ id: '2', companyName: 'Google', jobTitle: 'SDET', status: 'applied', location: 'Bengaluru', salaryRange: '₹10–20 LPA', experience: 'Mid Level', jobType: 'Full-time' }),
  makeJob({ id: '3', companyName: 'Amazon', jobTitle: 'QA Architect', status: 'interview', location: 'Remote', salaryRange: '₹40+ LPA', experience: 'Architect', jobType: 'Contract' }),
  makeJob({ id: '4', companyName: 'Infosys', jobTitle: 'QA Engineer', status: 'rejected', location: 'Pune', salaryRange: '₹5–10 LPA', experience: 'Entry Level', jobType: 'Full-time' }),
];

describe('searchJobs', () => {
  it('finds by company name', () => {
    expect(searchJobs(jobs, 'google').map((j) => j.id)).toEqual(['2']);
  });

  it('finds by job title', () => {
    expect(searchJobs(jobs, 'architect').map((j) => j.id)).toEqual(['3']);
  });

  it('finds by location', () => {
    expect(searchJobs(jobs, 'hyderabad').map((j) => j.id)).toEqual(['1']);
  });

  it('returns everything for an empty query', () => {
    expect(searchJobs(jobs, '')).toHaveLength(4);
  });

  it('is case insensitive', () => {
    expect(searchJobs(jobs, 'MICROSOFT')).toHaveLength(1);
  });
});

describe('filterJobs', () => {
  it('filters by status', () => {
    const result = filterJobs(jobs, { ...EMPTY_FILTERS, statuses: ['applied'] });
    expect(result.map((j) => j.id)).toEqual(['2']);
  });

  it('combines multiple filters', () => {
    const filters: JobFilters = { ...EMPTY_FILTERS, statuses: ['wishlist'], locations: ['Hyderabad'] };
    expect(filterJobs(jobs, filters).map((j) => j.id)).toEqual(['1']);
  });

  it('filters by experience', () => {
    const result = filterJobs(jobs, { ...EMPTY_FILTERS, experience: ['Architect'] });
    expect(result.map((j) => j.id)).toEqual(['3']);
  });

  it('filters by job type', () => {
    const result = filterJobs(jobs, { ...EMPTY_FILTERS, jobTypes: ['Contract'] });
    expect(result.map((j) => j.id)).toEqual(['3']);
  });

  it('filters by salary bucket', () => {
    const result = filterJobs(jobs, { ...EMPTY_FILTERS, salary: ['10-20'] });
    expect(result.map((j) => j.id)).toEqual(['2']);
  });

  it('filters by resume used', () => {
    const withResume = jobs.map((j) => ({ ...j, resumeUsed: j.id === '1' ? 'QA_Lead_v3' : undefined }));
    const result = filterJobs(withResume, { ...EMPTY_FILTERS, resumes: ['QA_Lead_v3'] });
    expect(result.map((j) => j.id)).toEqual(['1']);
  });
});

describe('sortJobs', () => {
  it('sorts by company name ascending', () => {
    const sort: JobSort = { key: 'companyName', direction: 'asc' };
    expect(sortJobs(jobs, sort).map((j) => j.companyName)).toEqual(['Amazon', 'Google', 'Infosys', 'Microsoft']);
  });

  it('sorts by company name descending', () => {
    const sort: JobSort = { key: 'companyName', direction: 'desc' };
    expect(sortJobs(jobs, sort).map((j) => j.companyName)).toEqual(['Microsoft', 'Infosys', 'Google', 'Amazon']);
  });

  it('sorts by date applied with fallback to createdAt', () => {
    const withDates = [
      makeJob({ id: 'a', companyName: 'A', dateApplied: '2026-08-10' }),
      makeJob({ id: 'b', companyName: 'B' }), // no dateApplied -> createdAt 2026-08-01
      makeJob({ id: 'c', companyName: 'C', dateApplied: '2026-08-05' }),
    ];
    const sort: JobSort = { key: 'dateApplied', direction: 'asc' };
    const result = sortJobs(withDates, sort);
    // B (createdAt fallback) sorts first, then C, then A
    expect(result.map((j) => j.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('isQualityRole / qualityRoles', () => {
  it('matches QA in the title (case-insensitive)', () => {
    expect(isQualityRole(makeJob({ jobTitle: 'QA Lead' }))).toBe(true);
    expect(isQualityRole(makeJob({ jobTitle: 'qa automation engineer' }))).toBe(true);
    expect(isQualityRole(makeJob({ jobTitle: 'Senior QA Engineer' }))).toBe(true);
  });

  it('matches Quality in the title', () => {
    expect(isQualityRole(makeJob({ jobTitle: 'Quality Engineer' }))).toBe(true);
    expect(isQualityRole(makeJob({ jobTitle: 'Software Quality Analyst' }))).toBe(true);
  });

  it('matches Test/Testing/Tester as whole words', () => {
    expect(isQualityRole(makeJob({ jobTitle: 'Test Automation Lead' }))).toBe(true);
    expect(isQualityRole(makeJob({ jobTitle: 'Testing Engineer' }))).toBe(true);
    expect(isQualityRole(makeJob({ jobTitle: 'Senior Tester' }))).toBe(true);
    expect(isQualityRole(makeJob({ jobTitle: 'Software Test Engineer' }))).toBe(true);
  });

  it('does not false-positive on substrings like latest/protest', () => {
    expect(isQualityRole(makeJob({ jobTitle: 'Backend Developer' }))).toBe(false);
    expect(isQualityRole(makeJob({ jobTitle: 'DevOps Engineer' }))).toBe(false);
    expect(isQualityRole(makeJob({ jobTitle: 'Frontend Engineer' }))).toBe(false);
    expect(isQualityRole(makeJob({ jobTitle: 'Latest Stack Engineer' }))).toBe(false);
    expect(isQualityRole(makeJob({ jobTitle: 'Protest Analyst' }))).toBe(false);
    expect(isQualityRole(makeJob({ jobTitle: 'DevTester' }))).toBe(false); // no word boundary inside compound
  });

  it('filters a list down to QA/testing jobs only', () => {
    const list = [
      makeJob({ id: '1', jobTitle: 'QA Engineer' }),
      makeJob({ id: '2', jobTitle: 'Quality Analyst' }),
      makeJob({ id: '3', jobTitle: 'Test Automation Lead' }),
      makeJob({ id: '4', jobTitle: 'Frontend Developer' }),
      makeJob({ id: '5', jobTitle: 'SDET' }),
    ];
    expect(qualityRoles(list).map((j) => j.id)).toEqual(['1', '2', '3']);
  });
});
