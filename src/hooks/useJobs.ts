import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Job, JobInput, JobStatus } from '../types';
import {
  addJob,
  deleteJob as deleteJobService,
  getJobs,
  moveJob,
  updateJob,
  type ServiceResult,
} from '../features/jobs/jobService';
import * as repo from '../features/jobs/jobRepository';
import { buildSeedJobs } from '../features/jobs/seedJobs';

export interface UseJobsResult {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addJob: (input: JobInput) => Promise<ServiceResult<Job>>;
  editJob: (id: string, input: JobInput) => Promise<ServiceResult<Job>>;
  removeJob: (id: string) => Promise<ServiceResult>;
  changeStatus: (id: string, status: JobStatus) => Promise<ServiceResult<Job>>;
  moveJobCard: (id: string, status: JobStatus) => Promise<ServiceResult<Job>>;
  seedDemoData: (replace?: boolean) => Promise<ServiceResult<number>>;
}

export function useJobs(): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const all = await getJobs();
      setJobs(all);
    } catch (e) {
      setError('Could not load jobs from local storage.');
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let all = await getJobs();
        // First-run experience: seed demo data when the local store is empty
        // so the tracker and dashboard render with a realistic spread.
        if (all.length === 0) {
          const seedJobs = buildSeedJobs();
          await repo.bulkPutJobs(seedJobs);
          all = seedJobs;
        }
        if (!cancelled) setJobs(all);
      } catch (e) {
        if (!cancelled) {
          setError('Could not load jobs from local storage.');
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addJobLocal = useCallback(async (input: JobInput) => {
    const result = await addJob(input);
    if (result.ok && result.data) {
      setJobs((prev) => [result.data!, ...prev]);
    }
    return result;
  }, []);

  const editJob = useCallback(async (id: string, input: JobInput) => {
    const result = await updateJob(id, input);
    if (result.ok && result.data) {
      setJobs((prev) => prev.map((j) => (j.id === id ? result.data! : j)));
    }
    return result;
  }, []);

  const removeJob = useCallback(async (id: string) => {
    const result = await deleteJobService(id);
    if (result.ok) {
      setJobs((prev) => prev.filter((j) => j.id !== id));
    }
    return result;
  }, []);

  const changeStatus = useCallback(async (id: string, status: JobStatus) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return { ok: false, message: 'Job not found.' };
    const result = await moveJob(job, status);
    if (result.ok && result.data) {
      setJobs((prev) => prev.map((j) => (j.id === id ? result.data! : j)));
    }
    return result;
  }, [jobs]);

  const moveJobCard = useCallback(async (id: string, status: JobStatus) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return { ok: false, message: 'Job not found.' };
    if (job.status === status) {
      return { ok: true, message: `Application is already in ${status}`, data: job };
    }
    const result = await moveJob(job, status);
    if (result.ok && result.data) {
      setJobs((prev) => prev.map((j) => (j.id === id ? result.data! : j)));
    }
    return result;
  }, [jobs]);

  /**
   * Loads the demo seed set.
   * With `replace = true` it clears existing jobs first so the full sample
   * dataset always loads (used by Settings > Data & Backup).
   */
  const seedDemoData = useCallback(async (replace = false) => {
    const existing = await getJobs();
    if (existing.length > 0 && !replace) {
      return { ok: false, message: 'Demo data was not added because jobs already exist.' };
    }
    const seedJobs = buildSeedJobs();
    if (replace && existing.length > 0) {
      await repo.clearJobs();
    }
    await repo.bulkPutJobs(seedJobs);
    setJobs(seedJobs);
    return {
      ok: true,
      message: `${seedJobs.length} sample jobs loaded${replace && existing.length > 0 ? ' (existing jobs replaced)' : ''}.`,
      data: seedJobs.length,
    };
  }, []);

  return {
    jobs,
    loading,
    error,
    refresh,
    addJob: addJobLocal,
    editJob,
    removeJob,
    changeStatus,
    moveJobCard,
    seedDemoData,
  };
}

export function useJobCounts(jobs: Job[]) {
  return useMemo(() => {
    const counts: Record<JobStatus, number> = {
      wishlist: 0,
      applied: 0,
      follow_up: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const job of jobs) {
      if (counts[job.status] !== undefined) counts[job.status] += 1;
    }
    return counts;
  }, [jobs]);
}
