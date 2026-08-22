import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useJobs } from '../hooks/useJobs';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../components/common/Toast';
import { PageHeader, Button } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { JobFormModal } from '../components/jobs/JobFormModal';
import { JobDetailsModal } from '../components/jobs/JobDetailsModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { SelectInput } from '../components/common/Fields';
import { JOB_STATUSES, STATUS_LABELS } from '../constants/statuses';
import type { Job, JobStatus } from '../types';
import { filterJobs, sortJobs, type JobFilters, type JobSort, EMPTY_FILTERS, SORT_OPTIONS, SALARY_BUCKETS } from '../features/jobs/jobQuery';
import { formatDate } from '../utils/format';

type JobsTab = 'all' | 'wishlist' | 'saved' | 'ignored';

export function JobsPage() {
  const { jobs, loading, error, refresh, removeJob } = useJobs();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<JobsTab>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<JobSort>({
    key: (settings?.defaultSort as JobSort['key']) ?? 'updatedAt',
    direction: 'desc',
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [detailsJob, setDetailsJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);

  const facets = useMemo(() => {
    const roles = new Set<string>();
    const locations = new Set<string>();
    const experience = new Set<string>();
    const resumes = new Set<string>();
    const jobTypes = new Set<string>();
    for (const job of jobs) {
      if (job.jobTitle) roles.add(job.jobTitle);
      if (job.location) locations.add(job.location);
      if (job.experience) experience.add(job.experience);
      if (job.resumeUsed) resumes.add(job.resumeUsed);
      if (job.jobType) jobTypes.add(job.jobType);
    }
    return {
      roles: Array.from(roles).sort(),
      locations: Array.from(locations).sort(),
      experience: Array.from(experience).sort(),
      resumes: Array.from(resumes).sort(),
      jobTypes: Array.from(jobTypes).sort(),
    };
  }, [jobs]);

  const tabJobs = useMemo(() => {
    if (tab === 'wishlist') return jobs.filter((j) => j.status === 'wishlist');
    if (tab === 'saved') return jobs.filter((j) => j.status === 'wishlist');
    // ignored = rejected applications kept for reference
    if (tab === 'ignored') return jobs.filter((j) => j.status === 'rejected');
    return jobs;
  }, [jobs, tab]);

  const filtered = useMemo(() => {
    const combined: JobFilters = { ...filters, query };
    const byFilter = filterJobs(tabJobs, combined);
    return sortJobs(byFilter, sort);
  }, [tabJobs, filters, query, sort]);

  const activeFilterCount =
    filters.statuses.length +
    filters.roles.length +
    filters.locations.length +
    filters.experience.length +
    filters.salary.length +
    filters.resumes.length +
    filters.jobTypes.length;

  const toggleFilter = (key: keyof JobFilters, value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setQuery('');
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingJob) return;
    const result = await removeJob(deletingJob.id);
    setDeletingJob(null);
    if (result.ok) showToast('Job deleted');
    else showToast(result.message, 'error');
  };

  const tabs: { key: JobsTab; label: string }[] = [
    { key: 'all', label: 'All Jobs' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'saved', label: 'Saved Jobs' },
    { key: 'ignored', label: 'Ignored Jobs' },
  ];

  if (loading) return <Spinner label="Loading jobs…" className="py-24" />;

  if (error) {
    return (
      <EmptyState
        title="Could not load jobs"
        description={error}
        action={<Button onClick={() => refresh()}>Try again</Button>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Jobs"
        subtitle="Discover and manage your job opportunity repository."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditingJob(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Job
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role, location, recruiter…"
            aria-label="Search jobs"
            className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <Button variant="outline" onClick={() => setFiltersOpen(true)} aria-expanded={filtersOpen}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filter
          {activeFilterCount > 0 ? (
            <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Sort
          </label>
          <SelectInput
            id="sort-select"
            value={sort.key}
            onChange={(e) => setSort((prev) => ({ ...prev, key: e.target.value as JobSort['key'] }))}
            className="min-h-[40px] w-auto min-w-[160px]"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </SelectInput>
          <Button
            variant="ghost"
            size="md"
            onClick={() => setSort((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
            aria-label={`Sort ${sort.direction === 'asc' ? 'ascending' : 'descending'}`}
          >
            {sort.direction === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-1 border-b border-slate-200 dark:border-slate-700" role="tablist" aria-label="Job views">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`min-h-[40px] rounded-t-lg border-b-2 px-3.5 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              tab === t.key
                ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto hidden self-center text-xs text-slate-400 sm:block">
          {filtered.length} job{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {activeFilterCount > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active filters:</span>
          {filters.statuses.map((s) => (
            <FilterChip key={`s-${s}`} label={STATUS_LABELS[s as JobStatus]} onRemove={() => toggleFilter('statuses', s)} />
          ))}
          {filters.roles.map((r) => (
            <FilterChip key={`r-${r}`} label={r} onRemove={() => toggleFilter('roles', r)} />
          ))}
          {filters.locations.map((l) => (
            <FilterChip key={`l-${l}`} label={l} onRemove={() => toggleFilter('locations', l)} />
          ))}
          {filters.experience.map((e) => (
            <FilterChip key={`e-${e}`} label={e} onRemove={() => toggleFilter('experience', e)} />
          ))}
          {filters.jobTypes.map((t) => (
            <FilterChip key={`t-${t}`} label={t} onRemove={() => toggleFilter('jobTypes', t)} />
          ))}
          {filters.resumes.map((r) => (
            <FilterChip key={`res-${r}`} label={r} onRemove={() => toggleFilter('resumes', r)} />
          ))}
          {filters.salary.map((s) => {
            const bucket = SALARY_BUCKETS.find((b) => b.id === s);
            return (
              <FilterChip
                key={`sal-${s}`}
                label={bucket?.label ?? s}
                onRemove={() => toggleFilter('salary', s)}
              />
            );
          })}
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear all
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title="No job opportunities found."
          description="Try changing your filters."
          action={
            activeFilterCount > 0 ? (
              <Button variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((job) => (
            <article
              key={job.id}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <button
                type="button"
                onClick={() => setDetailsJob(job)}
                className="flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{job.companyName}</h3>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{job.jobTitle}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {job.location ? <span>{job.location}</span> : null}
                  {job.salaryRange ? <span>{job.salaryRange}</span> : null}
                  {job.jobType ? <span>{job.jobType}</span> : null}
                  {job.experience ? <span>{job.experience}</span> : null}
                </div>
                <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                  {job.dateApplied ? `Applied ${formatDate(job.dateApplied)}` : 'Not applied yet'}
                  {job.resumeUsed ? ` · ${job.resumeUsed}` : ''}
                </div>
              </button>
              <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 dark:border-slate-700">
                <Button variant="ghost" size="sm" onClick={() => setDetailsJob(job)}>
                  Details
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingJob(job);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30"
                  onClick={() => setDeletingJob(job)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Filter modal */}
      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        description="Combine filters to narrow your job list."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
            <Button variant="primary" onClick={() => setFiltersOpen(false)}>
              Show results ({filtered.length})
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <FilterGroup label="Status">
            {JOB_STATUSES.map((status) => (
              <FilterCheckbox
                key={status}
                label={STATUS_LABELS[status]}
                checked={filters.statuses.includes(status)}
                onChange={() => toggleFilter('statuses', status)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Role">
            {facets.roles.map((role) => (
              <FilterCheckbox
                key={role}
                label={role}
                checked={filters.roles.includes(role)}
                onChange={() => toggleFilter('roles', role)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Location">
            {facets.locations.map((loc) => (
              <FilterCheckbox
                key={loc}
                label={loc}
                checked={filters.locations.includes(loc)}
                onChange={() => toggleFilter('locations', loc)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Experience">
            {facets.experience.map((exp) => (
              <FilterCheckbox
                key={exp}
                label={exp}
                checked={filters.experience.includes(exp)}
                onChange={() => toggleFilter('experience', exp)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Salary">
            {SALARY_BUCKETS.map((bucket) => (
              <FilterCheckbox
                key={bucket.id}
                label={bucket.label}
                checked={filters.salary.includes(bucket.id)}
                onChange={() => toggleFilter('salary', bucket.id)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Resume used">
            {facets.resumes.map((res) => (
              <FilterCheckbox
                key={res}
                label={res}
                checked={filters.resumes.includes(res)}
                onChange={() => toggleFilter('resumes', res)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Job type">
            {facets.jobTypes.map((jt) => (
              <FilterCheckbox
                key={jt}
                label={jt}
                checked={filters.jobTypes.includes(jt)}
                onChange={() => toggleFilter('jobTypes', jt)}
              />
            ))}
          </FilterGroup>
        </div>
      </Modal>

      <JobFormModal
        open={formOpen}
        job={editingJob}
        onClose={() => {
          setFormOpen(false);
          setEditingJob(null);
        }}
      />
      <JobDetailsModal job={detailsJob} onClose={() => setDetailsJob(null)} />
      <ConfirmDialog
        open={!!deletingJob}
        title="Delete job"
        message={deletingJob ? `Delete ${deletingJob.companyName} — ${deletingJob.jobTitle}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingJob(null)}
      />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${
        checked
          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 accent-blue-600"
      />
      {label}
    </label>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-blue-800"
        aria-label={`Remove filter ${label}`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  );
}
