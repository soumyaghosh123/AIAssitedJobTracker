import { useMemo } from 'react';
import { ArrowRight, Briefcase, CheckCircle2, Clock, Send, XCircle } from 'lucide-react';
import { useJobs } from '../hooks/useJobs';
import { useToast } from '../components/common/Toast';
import { PageHeader, Button } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { JOB_STATUSES, STATUS_LABELS } from '../constants/statuses';
import type { Job, JobStatus } from '../types';
import { daysUntil, formatDate, isPastDue, pluralize } from '../utils/format';
import { qualityRoles } from '../features/jobs/jobQuery';

interface KpiCardProps {
  label: string;
  value: number;
  icon: typeof Briefcase;
  accent: string;
  iconBg: string;
}

function KpiCard({ label, value, icon: Icon, accent, iconBg }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-5 w-5 ${accent}`} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

const FUNNEL_COLORS: Record<JobStatus, string> = {
  wishlist: 'bg-slate-400',
  applied: 'bg-blue-500',
  follow_up: 'bg-violet-500',
  interview: 'bg-cyan-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-rose-500',
};

export function DashboardPage() {
  const { jobs, loading, error, refresh, changeStatus } = useJobs();
  const { showToast } = useToast();

  // The Dashboard is a dedicated QA/testing analytics view: roles whose title
  // contains "QA", "Quality", or Test/Testing/Tester are counted.
  // Tracker and Jobs remain unfiltered.
  const qualityJobList = useMemo(() => qualityRoles(jobs), [jobs]);
  const totalJobs = jobs.length;
  const nonQualityCount = totalJobs - qualityJobList.length;

  const stats = useMemo(() => {
    const counts: Record<JobStatus, number> = {
      wishlist: 0,
      applied: 0,
      follow_up: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const job of qualityJobList) {
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
      total: qualityJobList.length,
    };
  }, [qualityJobList]);

  const recentApplied = useMemo(
    () =>
      qualityJobList
        .filter((j) => j.status !== 'wishlist')
        .sort((a, b) => (b.dateApplied ?? b.createdAt).localeCompare(a.dateApplied ?? a.createdAt))
        .slice(0, 5),
    [qualityJobList],
  );

  const upcomingFollowUps = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return qualityJobList
      .filter((j) => j.followUpDate && j.followUpDate >= today && j.status !== 'rejected' && j.status !== 'offer')
      .sort((a, b) => (a.followUpDate ?? '').localeCompare(b.followUpDate ?? ''))
      .slice(0, 5);
  }, [qualityJobList]);

  const funnelMax = Math.max(1, stats.applied, stats.counts.follow_up, stats.counts.interview, stats.counts.offer);

  if (loading) return <Spinner label="Loading dashboard…" className="py-24" />;

  if (error) {
    return (
      <EmptyState
        title="Could not load dashboard"
        description={error}
        action={<Button onClick={() => refresh()}>Try again</Button>}
      />
    );
  }

  const handleQuickAction = async (job: Job, to: JobStatus) => {
    const result = await changeStatus(job.id, to);
    if (result.ok) showToast(result.message);
    else showToast(result.message, 'error');
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A QA & testing pulse on your job search — metrics are computed from roles with QA, Quality, or Test/Testing in the title."
      />

      {qualityJobList.length === 0 ? (
        <EmptyState
          title="No QA / testing jobs yet"
          description="Your dashboard tracks QA, Quality and Test/Testing roles. Add one or load sample data from Settings, or check the Tracker for all jobs."
          action={<Button onClick={() => refresh()}>Refresh</Button>}
        />
      ) : (
        <>
          {nonQualityCount > 0 ? (
            <div className="mb-4 rounded-lg border border-slate-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-200">
              Dashboard is QA &amp; testing-focused: {nonQualityCount} unrelated job{nonQualityCount === 1 ? '' : 's'} (roles without QA, Quality, or Test/Testing in the title) are excluded from these metrics. They still appear in the Tracker and Jobs pages.
            </div>
          ) : null}
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <KpiCard
              label="Available Jobs"
              value={stats.available}
              icon={Briefcase}
              accent="text-blue-600"
              iconBg="bg-blue-50 dark:bg-blue-900/40"
            />
            <KpiCard
              label="Applied"
              value={stats.applied}
              icon={Send}
              accent="text-indigo-600"
              iconBg="bg-indigo-50 dark:bg-indigo-900/40"
            />
            <KpiCard
              label="Interviews"
              value={stats.interviews}
              icon={Clock}
              accent="text-cyan-600"
              iconBg="bg-cyan-50 dark:bg-cyan-900/40"
            />
            <KpiCard
              label="Offers"
              value={stats.offers}
              icon={CheckCircle2}
              accent="text-emerald-600"
              iconBg="bg-emerald-50 dark:bg-emerald-900/40"
            />
            <KpiCard
              label="Rejected"
              value={stats.rejected}
              icon={XCircle}
              accent="text-rose-600"
              iconBg="bg-rose-50 dark:bg-rose-900/40"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Application funnel */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Application Funnel</h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Progression through your pipeline, calculated from local data.
              </p>
              <div className="mt-5 space-y-3">
                {(
                  [
                    { label: 'Applied', value: stats.applied },
                    { label: 'Follow-up', value: stats.counts.follow_up },
                    { label: 'Interview', value: stats.counts.interview },
                    { label: 'Offer', value: stats.counts.offer },
                    { label: 'Rejected', value: stats.counts.rejected },
                  ] as { label: string; value: number }[]
                ).map((row) => {
                  const status = row.label.toLowerCase().replace(' ', '_') as JobStatus;
                  const pct = Math.round((row.value / funnelMax) * 100);
                  return (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{row.label}</span>
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{row.value}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full ${FUNNEL_COLORS[status]}`}
                          style={{ width: `${pct}%` }}
                          role="img"
                          aria-label={`${row.label}: ${row.value} applications`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Status overview */}
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tracker Overview</h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Where every saved opportunity currently sits.
              </p>
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
                {JOB_STATUSES.map((status) => (
                  <li key={status} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <span className={`h-2 w-2 rounded-full ${FUNNEL_COLORS[status]}`} aria-hidden="true" />
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {stats.counts[status]}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 dark:bg-slate-700/40 dark:text-slate-400">
                All metrics are calculated from locally stored QA / Quality / Test roles — no live market data is used.
              </div>
            </section>
          </div>

          {/* Tables */}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Applied Jobs</h2>
                <a
                  href="#/tracker"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">
                      <th className="px-5 py-2.5 font-semibold">Company</th>
                      <th className="px-5 py-2.5 font-semibold">Role</th>
                      <th className="px-5 py-2.5 font-semibold">Applied On</th>
                      <th className="px-5 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {recentApplied.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-sm text-slate-400">
                          No applications yet.
                        </td>
                      </tr>
                    ) : (
                      recentApplied.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{job.companyName}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{job.jobTitle}</td>
                          <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                            {job.dateApplied ? formatDate(job.dateApplied) : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={job.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Follow-ups</h2>
                <a
                  href="#/tracker"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  View all <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">
                      <th className="px-5 py-2.5 font-semibold">Company</th>
                      <th className="px-5 py-2.5 font-semibold">Role</th>
                      <th className="px-5 py-2.5 font-semibold">Follow-up Date</th>
                      <th className="px-5 py-2.5 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {upcomingFollowUps.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-sm text-slate-400">
                          No upcoming follow-ups. Nice and calm.
                        </td>
                      </tr>
                    ) : (
                      upcomingFollowUps.map((job) => {
                        const overdue = job.followUpDate ? isPastDue(job.followUpDate) : false;
                        const days = job.followUpDate ? daysUntil(job.followUpDate) : null;
                        return (
                          <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{job.companyName}</td>
                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{job.jobTitle}</td>
                            <td className="px-5 py-3">
                              <span className={overdue ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}>
                                {job.followUpDate ? formatDate(job.followUpDate) : '—'}
                                {days !== null && days >= 0 ? ` (${pluralize(days, 'day')} left)` : overdue ? ' (overdue)' : ''}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {job.status === 'applied' ? (
                                <button
                                  type="button"
                                  onClick={() => handleQuickAction(job, 'follow_up')}
                                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                                >
                                  Mark Follow-up
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
