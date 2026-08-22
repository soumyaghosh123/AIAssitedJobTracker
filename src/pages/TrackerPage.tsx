import { useMemo, useState } from 'react';
import { ChevronDown, Download, Plus, Search } from 'lucide-react';
import { useJobs, useJobCounts } from '../hooks/useJobs';
import { useExportJobs } from '../hooks/useExportJobs';
import { useToast } from '../components/common/Toast';
import { PageHeader, Button } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { JobFormModal } from '../components/jobs/JobFormModal';
import { JobDetailsModal } from '../components/jobs/JobDetailsModal';
import { TrackerBoard } from '../components/tracker/TrackerBoard';
import { JOB_STATUSES, STATUS_LABELS } from '../constants/statuses';
import type { Job, JobStatus } from '../types';

type ExportFormat = 'xlsx' | 'csv';

export function TrackerPage() {
  const { jobs, loading, error, changeStatus, removeJob, seedDemoData, refresh } = useJobs();
  const counts = useJobCounts(jobs);
  const { exportCsv, exportXlsx } = useExportJobs();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [detailsJob, setDetailsJob] = useState<Job | null>(null);

  const filteredJobs = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.trim().toLowerCase();
    return jobs.filter((job) =>
      [job.companyName, job.jobTitle, job.location, job.recruiterName, job.recruiterEmail, job.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [jobs, search]);

  const handleStatusChange = async (id: string, status: JobStatus) => {
    const result = await changeStatus(id, status);
    if (result.ok) {
      showToast(result.message);
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleExport = () => {
    try {
      if (exportFormat === 'csv') exportCsv(jobs);
      else exportXlsx(jobs);
      setExportOpen(false);
      showToast('Tracker exported successfully');
    } catch {
      showToast('Export failed. Please try again.', 'error');
    }
  };

  const handleAddToColumn = (status: JobStatus) => {
    setEditingJob(null);
    setFormOpen(true);
    void status;
  };

  const openAddJob = () => {
    setEditingJob(null);
    setFormOpen(true);
  };

  const openEditJob = (job: Job) => {
    setEditingJob(job);
    setFormOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingJob) return;
    const result = await removeJob(deletingJob.id);
    setDeletingJob(null);
    if (result.ok) {
      showToast('Job deleted');
    } else {
      showToast(result.message, 'error');
    }
  };

  if (loading) return <Spinner label="Loading jobs…" className="py-24" />;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Tracker"
        subtitle="Manage and track your job application journey"
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs…"
                aria-label="Search jobs"
                className="min-h-[40px] w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:w-56"
              />
            </div>
            <Button variant="outline" onClick={() => setExportOpen(true)}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </Button>
            <Button variant="primary" onClick={openAddJob}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Job
            </Button>
          </>
        }
      />

      {error ? (
        <EmptyState
          title="Could not load jobs"
          description={error}
          action={<Button onClick={() => refresh()}>Try again</Button>}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Add your first job opportunity to start tracking your journey, or load sample data to explore CareerPulse."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={openAddJob}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Job
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const result = await seedDemoData();
                  if (result.ok) showToast(result.message);
                  else showToast(result.message, 'error');
                }}
              >
                Load sample data
              </Button>
            </div>
          }
        />
      ) : (
        <div className="hidden lg:block">
          <TrackerBoard
            jobs={filteredJobs}
            onStatusChange={handleStatusChange}
            onEdit={openEditJob}
            onDelete={setDeletingJob}
            onOpen={setDetailsJob}
            onAddToColumn={handleAddToColumn}
          />
        </div>
      )}

      {/* Tablet: board with horizontal scroll */}
      {jobs.length > 0 && !loading ? (
        <div className="hidden md:block lg:hidden">
          <div className="overflow-x-auto pb-4">
            <div className="flex w-max gap-3">
              <TrackerBoard
                jobs={filteredJobs}
                onStatusChange={handleStatusChange}
                onEdit={openEditJob}
                onDelete={setDeletingJob}
                onOpen={setDetailsJob}
                onAddToColumn={handleAddToColumn}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile: status selector list */}
      <div className="md:hidden">
        <MobileStatusTracker
          jobs={filteredJobs}
          counts={counts}
          onStatusChange={handleStatusChange}
          onEdit={openEditJob}
          onDelete={setDeletingJob}
          onOpen={setDetailsJob}
          onAddToColumn={handleAddToColumn}
          onAddJob={openAddJob}
        />
      </div>

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
        message={
          deletingJob
            ? `Delete ${deletingJob.companyName} — ${deletingJob.jobTitle}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingJob(null)}
      />

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Tracker"
        description="Generate a client-side export of your tracker data."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExport} disabled={jobs.length === 0}>
              Export
            </Button>
          </>
        }
      >
        <fieldset className="space-y-3">
          <legend className="sr-only">Export format</legend>
          {(
            [
              { value: 'xlsx', label: 'Excel (.xlsx)' },
              { value: 'csv', label: 'CSV (.csv)' },
            ] as { value: ExportFormat; label: string }[]
          ).map((option) => (
            <label
              key={option.value}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:border-slate-600 dark:text-slate-200 dark:has-[:checked]:border-blue-500 dark:has-[:checked]:bg-blue-900/30"
            >
              <input
                type="radio"
                name="export-format"
                value={option.value}
                checked={exportFormat === option.value}
                onChange={() => setExportFormat(option.value)}
                className="h-4 w-4 accent-blue-600"
              />
              {option.label}
            </label>
          ))}
        </fieldset>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          {jobs.length} job{`${jobs.length === 1 ? '' : 's'}`} will be exported. Nothing leaves your browser.
        </p>
      </Modal>
    </div>
  );
}

interface MobileStatusTrackerProps {
  jobs: Job[];
  counts: Record<JobStatus, number>;
  onStatusChange: (id: string, status: JobStatus) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onOpen: (job: Job) => void;
  onAddToColumn: (status: JobStatus) => void;
  onAddJob: () => void;
}

function MobileStatusTracker({
  jobs,
  counts,
  onStatusChange,
  onEdit,
  onDelete,
  onOpen,
  onAddToColumn,
  onAddJob,
}: MobileStatusTrackerProps) {
  const [selectedStatus, setSelectedStatus] = useState<JobStatus>('wishlist');

  const statusJobs = useMemo(
    () => jobs.filter((job) => job.status === selectedStatus),
    [jobs, selectedStatus],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            aria-label="Select tracker stage"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as JobStatus)}
            className="min-h-[44px] w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm font-semibold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {JOB_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]} ({counts[status]})
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
        <Button variant="primary" size="md" onClick={onAddJob} aria-label="Add job">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {statusJobs.length === 0 ? (
        <EmptyState
          title="No jobs here yet."
          description="Add a job or move one into this stage."
          action={
            <Button variant="outline" onClick={() => onAddToColumn(selectedStatus)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add to {STATUS_LABELS[selectedStatus]}
            </Button>
          }
        />
      ) : (
        <div className="flex-1 space-y-3 pb-6">
          {statusJobs.map((job) => (
            <MobileJobCard
              key={job.id}
              job={job}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileJobCard({
  job,
  onStatusChange,
  onEdit,
  onDelete,
  onOpen,
}: {
  job: Job;
  onStatusChange: (id: string, status: JobStatus) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onOpen: (job: Job) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-3.5 shadow-card dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => onOpen(job)}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      >
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{job.companyName}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">{job.jobTitle}</p>
      </button>
      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
        {job.salaryRange ? <span>{job.salaryRange}</span> : null}
        {job.location ? <span>{job.location}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.status === 'wishlist' ? (
          <Button size="sm" onClick={() => onStatusChange(job.id, 'applied')}>
            Apply →
          </Button>
        ) : null}
        {job.status === 'applied' ? (
          <Button size="sm" variant="secondary" onClick={() => onStatusChange(job.id, 'follow_up')}>
            Follow-up →
          </Button>
        ) : null}
        {job.status === 'follow_up' ? (
          <Button size="sm" variant="secondary" onClick={() => onStatusChange(job.id, 'interview')}>
            Interview Scheduled →
          </Button>
        ) : null}
        {job.status === 'interview' ? (
          <>
            <Button size="sm" onClick={() => onStatusChange(job.id, 'offer')}>
              Offer ✓
            </Button>
            <Button size="sm" variant="danger" onClick={() => onStatusChange(job.id, 'rejected')}>
              Rejected ✕
            </Button>
          </>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => onEdit(job)}>
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-rose-600 dark:text-rose-400"
          onClick={() => onDelete(job)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
