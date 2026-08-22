import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { STATUS_ACCENT, STATUS_LABELS } from '../../constants/statuses';
import type { Job, JobStatus } from '../../types';
import { daysSinceLabel } from '../../utils/format';
import { StatusBadge } from '../common/StatusBadge';
import { WORKFLOW_ACTIONS } from '../../features/jobs/jobTransitions';

interface JobCardProps {
  job: Job;
  onAction: (job: Job, to: JobStatus) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onOpen?: (job: Job) => void;
}

function workflowActionFor(job: Job): { label: string; to: JobStatus | null } | null {
  const action = WORKFLOW_ACTIONS[job.status];
  if (!action) return null;
  const to: JobStatus | null =
    action.action === 'apply'
      ? 'applied'
      : action.action === 'followUp'
        ? 'follow_up'
        : action.action === 'interviewScheduled'
          ? 'interview'
          : null;
  return { label: action.label, to };
}

export function JobCard({ job, onAction, onEdit, onDelete, onOpen }: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const workflow = workflowActionFor(job);

  const handlePrimaryAction = () => {
    if (!workflow?.to) return;
    onAction(job, workflow.to);
  };

  const days = job.dateApplied ? daysSinceLabel(job.dateApplied) : null;

  return (
    <article
      ref={setNodeRef}
      style={style}
      aria-label={`${job.companyName} — ${job.jobTitle}, ${STATUS_LABELS[job.status]}`}
      className={`group relative rounded-lg border border-slate-200 border-l-4 bg-white p-3 shadow-card transition-shadow hover:shadow-md focus-within:shadow-md dark:border-slate-700 dark:bg-slate-800 ${
        STATUS_ACCENT[job.status].split(' ')[0]
      } ${isDragging ? 'z-20 opacity-90 ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen?.(job)}
          className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{job.companyName}</h3>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{job.jobTitle}</p>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onEdit(job)}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label={`Edit ${job.companyName}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(job)}
            className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
            aria-label={`Delete ${job.companyName}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="hidden cursor-grab touch-none rounded p-1.5 text-slate-300 hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing sm:block dark:text-slate-600 dark:hover:text-slate-300"
            aria-label={`Drag ${job.companyName} to another column`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-300">
        {job.salaryRange ? <span>{job.salaryRange}</span> : null}
        {job.salaryRange && job.location ? <span aria-hidden="true">·</span> : null}
        {job.location ? <span className="truncate">{job.location}</span> : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-300">
        {job.resumeUsed ? <span>Resume: {job.resumeUsed}</span> : null}
        {days ? <span>{days}</span> : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusBadge status={job.status} />
        {job.linkedinUrl ? (
          <a
            href={job.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Open ${job.companyName} job posting`}
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            LinkedIn
          </a>
        ) : null}
      </div>

      {workflow ? (
        <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-700">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className={`flex min-h-[40px] w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              job.status === 'wishlist'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
            }`}
          >
            {workflow.label}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}

      {job.status === 'interview' ? (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onAction(job, 'offer')}
            className="flex min-h-[40px] items-center justify-center gap-1 rounded-lg bg-emerald-700 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
          >
            Offer ✓
          </button>
          <button
            type="button"
            onClick={() => onAction(job, 'rejected')}
            className="flex min-h-[40px] items-center justify-center gap-1 rounded-lg bg-rose-100 px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 dark:bg-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
          >
            Rejected ✕
          </button>
        </div>
      ) : null}

      {job.notes ? (
        <p className="mt-2 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{job.notes}</p>
      ) : null}
    </article>
  );
}
