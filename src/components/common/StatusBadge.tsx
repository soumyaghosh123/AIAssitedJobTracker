import type { ReactNode } from 'react';
import { STATUS_BADGE, STATUS_DOT, STATUS_LABELS } from '../../constants/statuses';
import type { JobStatus } from '../../types';

interface StatusBadgeProps {
  status: JobStatus;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, showDot = true, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[status]} ${className}`}
    >
      {showDot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
      ) : null}
      {STATUS_LABELS[status]}
    </span>
  );
}

export function StatusLabel({ status }: { status: JobStatus }) {
  return <>{STATUS_LABELS[status]}</>;
}

export function StatusDot({ status }: { status: JobStatus }) {
  return <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />;
}

export function StatusPill({ status, children }: { status: JobStatus; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[status]}`}
    >
      {children}
    </span>
  );
}
