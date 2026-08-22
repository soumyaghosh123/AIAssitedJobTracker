import type { Job, JobInput, JobStatus } from '../../types';
import { createId, todayISO } from '../../utils/format';
import { isJobStatus, validateJobInput } from './jobValidation';
import { canTransition } from './jobTransitions';
import { getNextStatus } from './jobTransitions';
import * as repo from './jobRepository';

/**
 * Application service layer.
 *
 * Contains the business rules (validation, timestamps, workflow transitions)
 * and delegates persistence to the repository. UI components never touch
 * IndexedDB directly.
 */

export interface ServiceResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

export function toJob(job: Job): Job {
  return job;
}

export function buildNewJob(input: JobInput, id?: string): Job {
  const now = todayISO();
  const status: JobStatus = input.status && isJobStatus(input.status) ? input.status : 'wishlist';
  return {
    id: id ?? createId('job'),
    companyName: input.companyName.trim(),
    jobTitle: input.jobTitle.trim(),
    linkedinUrl: input.linkedinUrl?.trim() || undefined,
    resumeUsed: input.resumeUsed?.trim() || undefined,
    dateApplied: input.dateApplied || undefined,
    salaryRange: input.salaryRange?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    status,
    location: input.location?.trim() || undefined,
    experience: input.experience?.trim() || undefined,
    jobType: input.jobType?.trim() || undefined,
    recruiterName: input.recruiterName?.trim() || undefined,
    recruiterEmail: input.recruiterEmail?.trim() || undefined,
    followUpDate: input.followUpDate || undefined,
    interviewDate: input.interviewDate || undefined,
    interviewRound: input.interviewRound?.trim() || undefined,
    rejectionReason: input.rejectionReason?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export async function addJob(input: JobInput): Promise<ServiceResult<Job>> {
  const errors = validateJobInput(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: Object.values(errors)[0] ?? 'Invalid job data.' };
  }
  const job = buildNewJob(input);
  await repo.createJob(job);
  return { ok: true, message: 'Job added successfully', data: job };
}

export async function updateJob(id: string, input: JobInput): Promise<ServiceResult<Job>> {
  const existing = await repo.getJob(id);
  if (!existing) {
    return { ok: false, message: 'Job not found.' };
  }
  const errors = validateJobInput(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: Object.values(errors)[0] ?? 'Invalid job data.' };
  }
  const updated: Job = {
    ...existing,
    companyName: input.companyName.trim(),
    jobTitle: input.jobTitle.trim(),
    linkedinUrl: input.linkedinUrl?.trim() || undefined,
    resumeUsed: input.resumeUsed?.trim() || undefined,
    dateApplied: input.dateApplied || undefined,
    salaryRange: input.salaryRange?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    location: input.location?.trim() || undefined,
    experience: input.experience?.trim() || undefined,
    jobType: input.jobType?.trim() || undefined,
    recruiterName: input.recruiterName?.trim() || undefined,
    recruiterEmail: input.recruiterEmail?.trim() || undefined,
    followUpDate: input.followUpDate || undefined,
    interviewDate: input.interviewDate || undefined,
    interviewRound: input.interviewRound?.trim() || undefined,
    rejectionReason: input.rejectionReason?.trim() || undefined,
    updatedAt: todayISO(),
  };
  await repo.updateJob(updated);
  return { ok: true, message: 'Job updated successfully', data: updated };
}

export async function deleteJob(id: string): Promise<ServiceResult> {
  const existing = await repo.getJob(id);
  if (!existing) {
    return { ok: false, message: 'Job not found.' };
  }
  await repo.deleteJob(id);
  return { ok: true, message: 'Job deleted' };
}

export async function getJobs(): Promise<Job[]> {
  return repo.getAllJobs();
}

export async function getJob(id: string): Promise<Job | undefined> {
  return repo.getJob(id);
}

/**
 * Applies a workflow action (Apply, Follow-up, Interview Scheduled, Offer, Rejected).
 * Persists immediately and returns the updated job.
 *
 * When a job moves into `follow_up` and has no follow-up date yet, one is
 * auto-stamped (7 days from now) so it shows up under "Upcoming Follow-ups"
 * on the Dashboard.
 */
export async function moveJob(job: Job, to: JobStatus): Promise<ServiceResult<Job>> {
  if (job.status === to) {
    return { ok: true, message: `Application is already in ${to}`, data: job };
  }
  if (!canTransition(job.status, to)) {
    return { ok: false, message: `Cannot move from ${job.status} to ${to} directly.` };
  }

  let updated: Job | undefined;
  if (to === 'follow_up' && !job.followUpDate) {
    const followUpDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    updated = await repo.updateJobStatusWithFields(job.id, to, { followUpDate });
  } else {
    updated = await repo.updateJobStatus(job.id, to);
  }

  if (!updated) {
    return { ok: false, message: 'Job not found.' };
  }
  return { ok: true, message: `Application moved to ${to}`, data: updated };
}

export async function moveToNextStage(job: Job): Promise<ServiceResult<Job>> {
  const next = getNextStatus(job.status);
  if (!next) {
    return { ok: false, message: 'No next stage for this application.' };
  }
  return moveJob(job, next);
}

export async function exportJobs(): Promise<Job[]> {
  return repo.getAllJobs();
}

export async function bulkImportJobs(jobs: Job[]): Promise<ServiceResult<number>> {
  await repo.bulkPutJobs(jobs);
  return { ok: true, message: `${jobs.length} jobs imported.`, data: jobs.length };
}
