import { describe, expect, it } from 'vitest';
import type { Job } from '../types';

// Mirrors the dashboard calculation logic used by DashboardPage so it can be unit tested.
function dashboardStats(jobs: Job[]) {
  const counts: Record<Job['status'], number> = {
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
  const applied = counts.applied + counts.follow_up + counts.interview + counts.offer;
  return {
    counts,
    available: counts.wishlist + applied,
    applied,
    interviews: counts.interview,
    offers: counts.offer,
    rejected: counts.rejected,
    total: jobs.length,
  };
}

function job(status: Job['status']): Job {
  return {
    id: Math.random().toString(),
    companyName: 'X',
    jobTitle: 'Y',
    status,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

describe('dashboard calculations', () => {
  it('counts KPIs correctly', () => {
    const jobs = [
      job('wishlist'),
      job('applied'),
      job('applied'),
      job('follow_up'),
      job('interview'),
      job('offer'),
      job('rejected'),
      job('rejected'),
    ];
    const stats = dashboardStats(jobs);
    expect(stats.total).toBe(8);
    expect(stats.available).toBe(6);
    expect(stats.applied).toBe(5);
    expect(stats.interviews).toBe(1);
    expect(stats.offers).toBe(1);
    expect(stats.rejected).toBe(2);
  });

  it('handles empty job list', () => {
    const stats = dashboardStats([]);
    expect(stats.total).toBe(0);
    expect(stats.available).toBe(0);
    expect(stats.applied).toBe(0);
  });
});
