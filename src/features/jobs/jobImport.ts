import type { BackupFile, Job, JobDocument, JobStatus, Profile, AppSettings } from '../../types';
import { JOB_STATUSES } from '../../constants/statuses';
import { createId, todayISO } from '../../utils/format';

export interface ImportValidationResult {
  ok: boolean;
  message: string;
  jobs: Job[];
  profile?: Profile;
  documents?: JobDocument[];
  settings?: AppSettings;
  skipped: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === 'string' && (JOB_STATUSES as readonly string[]).includes(value);
}

function requiredString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Validates a raw record and normalizes it into a Job. Invalid records are skipped. */
export function normalizeImportedJob(raw: unknown): Job | null {
  if (!isRecord(raw)) return null;
  const companyName = requiredString(raw.companyName);
  const jobTitle = requiredString(raw.jobTitle);
  if (!companyName || !jobTitle) return null;
  const status = isJobStatus(raw.status) ? raw.status : 'wishlist';
  const now = todayISO();
  return {
    id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : createId('job'),
    companyName,
    jobTitle,
    linkedinUrl: optionalString(raw.linkedinUrl),
    resumeUsed: optionalString(raw.resumeUsed),
    dateApplied: optionalString(raw.dateApplied),
    salaryRange: optionalString(raw.salaryRange),
    notes: optionalString(raw.notes),
    status,
    location: optionalString(raw.location),
    experience: optionalString(raw.experience),
    jobType: optionalString(raw.jobType),
    recruiterName: optionalString(raw.recruiterName),
    recruiterEmail: optionalString(raw.recruiterEmail),
    followUpDate: optionalString(raw.followUpDate),
    interviewDate: optionalString(raw.interviewDate),
    interviewRound: optionalString(raw.interviewRound),
    rejectionReason: optionalString(raw.rejectionReason),
    createdAt: optionalString(raw.createdAt) ?? now,
    updatedAt: optionalString(raw.updatedAt) ?? now,
  };
}

function normalizeImportedProfile(raw: unknown): Profile | undefined {
  if (!isRecord(raw)) return undefined;
  const now = todayISO();
  const profile: Profile = {
    id: 'me',
    name: optionalString(raw.name) ?? '',
    email: optionalString(raw.email) ?? '',
    phone: optionalString(raw.phone) ?? '',
    currentTitle: optionalString(raw.currentTitle) ?? '',
    experience: optionalString(raw.experience) ?? '',
    skills: Array.isArray(raw.skills) ? raw.skills.filter((s): s is string => typeof s === 'string') : [],
    preferredRoles: Array.isArray(raw.preferredRoles)
      ? raw.preferredRoles.filter((r): r is string => typeof r === 'string')
      : [],
    preferredLocation: optionalString(raw.preferredLocation) ?? '',
    remotePreference: optionalString(raw.remotePreference) ?? '',
    minimumSalary: optionalString(raw.minimumSalary) ?? '',
    experienceRange: optionalString(raw.experienceRange) ?? '',
    preferredEmploymentType: optionalString(raw.preferredEmploymentType) ?? '',
    summary: optionalString(raw.summary) ?? '',
    updatedAt: now,
  };
  return profile;
}

function normalizeImportedDocument(raw: unknown): JobDocument | null {
  if (!isRecord(raw)) return null;
  const name = requiredString(raw.name);
  if (!name) return null;
  const category = ['Resumes', 'Cover Letters', 'Certifications', 'Other'].includes(
    String(raw.category),
  )
    ? (raw.category as JobDocument['category'])
    : 'Other';
  const now = todayISO();
  return {
    id: typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : createId('doc'),
    name,
    category,
    fileType: optionalString(raw.fileType) ?? 'application/octet-stream',
    size: typeof raw.size === 'number' && Number.isFinite(raw.size) ? raw.size : 0,
    dataUrl: typeof raw.dataUrl === 'string' ? raw.dataUrl : '',
    uploadedAt: optionalString(raw.uploadedAt) ?? now,
    updatedAt: optionalString(raw.updatedAt) ?? now,
  };
}

function normalizeImportedSettings(raw: unknown): AppSettings | undefined {
  if (!isRecord(raw)) return undefined;
  const theme = raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system' ? raw.theme : 'system';
  const now = todayISO();
  return {
    id: 'app',
    defaultPage: optionalString(raw.defaultPage) ?? 'dashboard',
    defaultSort: optionalString(raw.defaultSort) ?? 'updatedAt',
    itemsPerPage:
      typeof raw.itemsPerPage === 'number' && raw.itemsPerPage > 0
        ? Math.floor(raw.itemsPerPage)
        : 20,
    language: optionalString(raw.language) ?? 'English',
    theme,
    preferredRoles: Array.isArray(raw.preferredRoles)
      ? raw.preferredRoles.filter((r): r is string => typeof r === 'string')
      : [],
    preferredLocations: Array.isArray(raw.preferredLocations)
      ? raw.preferredLocations.filter((l): l is string => typeof l === 'string')
      : [],
    salaryRange: optionalString(raw.salaryRange) ?? '',
    experienceRange: optionalString(raw.experienceRange) ?? '',
    updatedAt: now,
  };
}

/**
 * Validates an imported JSON backup before anything is written to IndexedDB.
 * Malformed JSON, missing required fields and invalid statuses are rejected or skipped.
 */
export function validateBackupJson(text: string): ImportValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: 'Malformed JSON. The file could not be parsed.', jobs: [], skipped: 0 };
  }

  if (Array.isArray(parsed)) {
    // Accept a plain array of jobs.
    const jobs: Job[] = [];
    let skipped = 0;
    for (const raw of parsed) {
      const job = normalizeImportedJob(raw);
      if (job) jobs.push(job);
      else skipped += 1;
    }
    if (jobs.length === 0) {
      return { ok: false, message: 'No valid jobs found in the imported file.', jobs: [], skipped };
    }
    return { ok: true, message: `Validated ${jobs.length} jobs.`, jobs, skipped };
  }

  if (!isRecord(parsed)) {
    return { ok: false, message: 'Invalid backup format. Expected a CareerPulse backup object.', jobs: [], skipped: 0 };
  }

  if (parsed.app !== undefined && parsed.app !== 'CareerPulse') {
    return { ok: false, message: 'This file is not a CareerPulse backup.', jobs: [], skipped: 0 };
  }

  const rawJobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
  const jobs: Job[] = [];
  let skipped = 0;
  for (const raw of rawJobs) {
    const job = normalizeImportedJob(raw);
    if (job) jobs.push(job);
    else skipped += 1;
  }

  const profile = normalizeImportedProfile(parsed.profile);
  const documents: JobDocument[] = [];
  if (Array.isArray(parsed.documents)) {
    for (const raw of parsed.documents) {
      const doc = normalizeImportedDocument(raw);
      if (doc) documents.push(doc);
    }
  }
  const settings = normalizeImportedSettings(parsed.settings);

  if (jobs.length === 0 && !profile && documents.length === 0 && !settings) {
    return {
      ok: false,
      message: 'No valid data found in the imported file.',
      jobs: [],
      documents,
      skipped,
    };
  }

  return { ok: true, message: `Validated ${jobs.length} jobs.`, jobs, profile, documents, settings, skipped };
}

/** Builds a JSON backup file object. */
export function buildBackup(jobs: Job[], profile?: Profile, documents?: JobDocument[], settings?: AppSettings): BackupFile {
  return {
    app: 'CareerPulse',
    version: 1,
    exportedAt: todayISO(),
    jobs,
    profile,
    documents,
    settings,
  };
}

/** Resolves duplicate IDs when merging imported jobs with existing data. */
export function resolveDuplicateIds(imported: Job[], existing: Job[]): Job[] {
  const existingIds = new Set(existing.map((j) => j.id));
  return imported.map((job) =>
    existingIds.has(job.id) ? { ...job, id: createId('job'), updatedAt: todayISO() } : job,
  );
}

export function mergeJobs(existing: Job[], imported: Job[]): Job[] {
  const byId = new Map(existing.map((j) => [j.id, j]));
  for (const job of resolveDuplicateIds(imported, existing)) {
    byId.set(job.id, job);
  }
  return Array.from(byId.values());
}
