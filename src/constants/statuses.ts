export const JOB_STATUSES = [
  'wishlist',
  'applied',
  'follow_up',
  'interview',
  'offer',
  'rejected',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const STATUS_LABELS: Record<JobStatus, string> = {
  wishlist: 'Wishlist',
  applied: 'Applied',
  follow_up: 'Follow-up',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<JobStatus, string> = {
  wishlist: 'slate',
  applied: 'blue',
  follow_up: 'violet',
  interview: 'cyan',
  offer: 'emerald',
  rejected: 'rose',
};

/** Tailwind classes for status accent (border + text). Kept as full literal strings. */
export const STATUS_ACCENT: Record<JobStatus, string> = {
  wishlist: 'border-slate-400 text-slate-600 dark:text-slate-300',
  applied: 'border-blue-500 text-blue-700 dark:text-blue-300',
  follow_up: 'border-violet-500 text-violet-700 dark:text-violet-300',
  interview: 'border-cyan-500 text-cyan-700 dark:text-cyan-300',
  offer: 'border-emerald-500 text-emerald-700 dark:text-emerald-300',
  rejected: 'border-rose-500 text-rose-700 dark:text-rose-300',
};

export const STATUS_DOT: Record<JobStatus, string> = {
  wishlist: 'bg-slate-400',
  applied: 'bg-blue-500',
  follow_up: 'bg-violet-500',
  interview: 'bg-cyan-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-rose-500',
};

export const STATUS_BADGE: Record<JobStatus, string> = {
  wishlist: 'bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200',
  applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200',
  follow_up: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200',
  interview: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-200',
  offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200',
};

export const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const EXPERIENCE_LEVELS = [
  'Entry Level',
  'Mid Level',
  'Senior Level',
  'Lead',
  'Architect',
  'Executive',
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const DOC_CATEGORIES = ['Resumes', 'Cover Letters', 'Certifications', 'Other'] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const DEFAULT_LANGUAGE = 'English';
export const DEFAULT_SORT = 'updatedAt';
export const DEFAULT_PAGE_SIZE = 20;

export type AppTheme = 'light' | 'dark' | 'system';
