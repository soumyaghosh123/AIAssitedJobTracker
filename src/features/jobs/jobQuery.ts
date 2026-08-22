import type { Job } from '../../types';

export type SortKey =
  | 'companyName'
  | 'jobTitle'
  | 'status'
  | 'dateApplied'
  | 'updatedAt'
  | 'createdAt'
  | 'salaryRange'
  | 'location';

export type SortDirection = 'asc' | 'desc';

export interface JobSort {
  key: SortKey;
  direction: SortDirection;
}

export interface JobFilters {
  query: string;
  statuses: string[];
  roles: string[];
  locations: string[];
  experience: string[];
  salary: string[];
  resumes: string[];
  jobTypes: string[];
}

export const EMPTY_FILTERS: JobFilters = {
  query: '',
  statuses: [],
  roles: [],
  locations: [],
  experience: [],
  salary: [],
  resumes: [],
  jobTypes: [],
};

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'updatedAt', label: 'Recently Updated' },
  { key: 'createdAt', label: 'Recently Added' },
  { key: 'dateApplied', label: 'Date Applied' },
  { key: 'companyName', label: 'Company' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'status', label: 'Status' },
  { key: 'location', label: 'Location' },
  { key: 'salaryRange', label: 'Salary' },
];

export const SALARY_BUCKETS: { id: string; label: string; test: (value?: string) => boolean }[] = [
  {
    id: '5-10',
    label: '₹5–10 LPA',
    test: (v) => /5\s*[-–]\s*10/.test(v ?? '') || /₹\s*5/.test(v ?? ''),
  },
  {
    id: '10-20',
    label: '₹10–20 LPA',
    test: (v) => /10\s*[-–]\s*20/.test(v ?? ''),
  },
  {
    id: '20-40',
    label: '₹20–40 LPA',
    test: (v) => /20\s*[-–]\s*40/.test(v ?? ''),
  },
  {
    id: '40+',
    label: '₹40+ LPA',
    test: (v) => /40\s*\+/.test(v ?? '') || /40\s*[-–]\s*\d+/.test(v ?? ''),
  },
];

function matchesSalary(jobSalary: string | undefined, bucketIds: string[]): boolean {
  if (bucketIds.length === 0) return true;
  return bucketIds.some((id) => {
    const bucket = SALARY_BUCKETS.find((b) => b.id === id);
    return bucket ? bucket.test(jobSalary) : false;
  });
}

export function filterJobs(jobs: Job[], filters: JobFilters): Job[] {
  const query = filters.query.trim().toLowerCase();
  return jobs.filter((job) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(job.status)) return false;
    if (filters.roles.length > 0 && !filters.roles.includes(job.jobTitle)) return false;
    if (filters.locations.length > 0 && !filters.locations.includes(job.location ?? '')) return false;
    if (filters.experience.length > 0 && !filters.experience.includes(job.experience ?? '')) return false;
    if (filters.jobTypes.length > 0 && !filters.jobTypes.includes(job.jobType ?? '')) return false;
    if (filters.resumes.length > 0 && !filters.resumes.includes(job.resumeUsed ?? '')) return false;
    if (!matchesSalary(job.salaryRange, filters.salary)) return false;

    if (query) {
      const haystack = [
        job.companyName,
        job.jobTitle,
        job.location,
        job.recruiterName,
        job.recruiterEmail,
        job.notes,
        job.resumeUsed,
        job.jobType,
        job.experience,
        job.salaryRange,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  if (a === b) return 0;
  if (a === undefined || a === null || a === '') return 1;
  if (b === undefined || b === null || b === '') return -1;
  const result = String(a).localeCompare(String(b), undefined, { numeric: true });
  return direction === 'asc' ? result : -result;
}

export function sortJobs(jobs: Job[], sort: JobSort): Job[] {
  const { key, direction } = sort;
  return [...jobs].sort((a, b) => {
    const aVal = key === 'dateApplied' ? a.dateApplied ?? a.createdAt : a[key];
    const bVal = key === 'dateApplied' ? b.dateApplied ?? b.createdAt : b[key];
    return compareValues(aVal, bVal, direction);
  });
}

export function searchJobs(jobs: Job[], query: string): Job[] {
  return filterJobs(jobs, { ...EMPTY_FILTERS, query });
}

/**
 * Quality-focused job matcher used by the Dashboard.
 * A job counts as a QA/testing opportunity when its title contains:
 *  - "qa" or "quality" (substring), or
 *  - "test" / "testing" / "tester" as whole words (word-boundary match so
 *    "latest", "protest", "contest" etc. do not false-positive).
 * Case-insensitive: "QA Lead", "Quality Engineer", "Test Automation Lead",
 * "SDET (Testing)" all match while unrelated roles are excluded.
 */
export function isQualityRole(job: Job): boolean {
  const title = job.jobTitle.toLowerCase();
  if (title.includes('qa') || title.includes('quality')) return true;
  return /\b(test|testing|tester)\b/.test(title);
}

export function qualityRoles(jobs: Job[]): Job[] {
  return jobs.filter(isQualityRole);
}
