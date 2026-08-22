import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { STATUS_DOT, STATUS_LABELS } from '../../constants/statuses';
import type { JobStatus } from '../../types';
import { EmptyState } from '../common/EmptyState';
import type { ReactNode } from 'react';

interface TrackerColumnProps {
  status: JobStatus;
  count: number;
  children: ReactNode;
  onAddToColumn: (status: JobStatus) => void;
}

export function TrackerColumn({ status, count, children, onAddToColumn }: TrackerColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={`${STATUS_LABELS[status]} column`}
      className={`flex w-full flex-col self-start rounded-xl border bg-slate-50 dark:bg-slate-800/50 ${
        isOver
          ? 'border-blue-400 ring-2 ring-blue-500/30 dark:border-blue-500'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5 dark:border-slate-700">
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {STATUS_LABELS[status]}
        </h2>
        <span
          className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300"
        >
          {count}
        </span>
        <button
          type="button"
          onClick={() => onAddToColumn(status)}
          className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          aria-label={`Add job to ${STATUS_LABELS[status]}`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="flex-1 space-y-2.5 p-2.5">
        {count === 0 ? (
          <EmptyState
            compact
            title="No jobs here yet."
            description="Add a job or move one into this stage."
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
