import { JOB_STATUSES, STATUS_LABELS } from '../../constants/statuses';
import type { JobInput, JobStatus } from '../../types';
import { isValidUrl } from '../../utils/format';

export interface FieldErrors {
  [field: string]: string;
}

const MAX_LENGTHS: Record<string, number> = {
  companyName: 150,
  jobTitle: 200,
  linkedinUrl: 1000,
  resumeUsed: 200,
  salaryRange: 100,
  notes: 5000,
  location: 200,
  experience: 100,
  jobType: 100,
  recruiterName: 200,
  recruiterEmail: 200,
  followUpDate: 100,
  interviewDate: 100,
  interviewRound: 100,
  rejectionReason: 1000,
};

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === 'string' && (JOB_STATUSES as readonly string[]).includes(value);
}

export function validateJobInput(input: Partial<JobInput>): FieldErrors {
  const errors: FieldErrors = {};

  const companyName = (input.companyName ?? '').trim();
  const jobTitle = (input.jobTitle ?? '').trim();

  if (!companyName) {
    errors.companyName = 'Company name is required.';
  } else if (companyName.length > MAX_LENGTHS.companyName) {
    errors.companyName = `Company name must be ${MAX_LENGTHS.companyName} characters or fewer.`;
  }

  if (!jobTitle) {
    errors.jobTitle = 'Job title is required.';
  } else if (jobTitle.length > MAX_LENGTHS.jobTitle) {
    errors.jobTitle = `Job title must be ${MAX_LENGTHS.jobTitle} characters or fewer.`;
  }

  if (input.linkedinUrl && !isValidUrl(input.linkedinUrl)) {
    errors.linkedinUrl = 'Please enter a valid URL starting with http:// or https://.';
  }

  if (input.recruiterEmail) {
    const email = input.recruiterEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.recruiterEmail = 'Please enter a valid email address.';
    }
  }

  for (const key of Object.keys(MAX_LENGTHS) as (keyof typeof MAX_LENGTHS)[]) {
    const value = input[key as keyof JobInput];
    if (typeof value === 'string' && value.length > MAX_LENGTHS[key]) {
      if (!errors[key]) {
        errors[key] = `${key} must be ${MAX_LENGTHS[key]} characters or fewer.`;
      }
    }
  }

  if (input.status !== undefined && !isJobStatus(input.status)) {
    errors.status = 'Invalid job status.';
  }

  return errors;
}

export function validateRequired(input: Partial<JobInput>): boolean {
  return validateJobInput(input).companyName === undefined && validateJobInput(input).jobTitle === undefined;
}

export function toErrorMessage(errors: FieldErrors): string {
  return Object.values(errors)[0] ?? 'Please fix the highlighted fields.';
}

export function describeStatus(status: JobStatus): string {
  return STATUS_LABELS[status];
}
