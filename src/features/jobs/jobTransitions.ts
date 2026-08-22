import { STATUS_LABELS } from '../../constants/statuses';
import type { JobStatus } from '../../types';
import { isJobStatus } from './jobValidation';

/**
 * Business workflow transitions for the Tracker.
 *
 * Wishlist -> Applied -> Follow-up -> Interview -> Offer | Rejected
 */
export const WORKFLOW_ACTIONS: Record<
  JobStatus,
  | { action: 'apply'; label: string }
  | { action: 'followUp'; label: string }
  | { action: 'interviewScheduled'; label: string }
  | { action: 'offer'; label: string }
  | { action: 'reject'; label: string }
  | null
> = {
  wishlist: { action: 'apply', label: 'Apply' },
  applied: { action: 'followUp', label: 'Follow-up' },
  follow_up: { action: 'interviewScheduled', label: 'Interview Scheduled' },
  interview: null, // Offer / Rejected are shown as two separate buttons
  offer: null,
  rejected: null,
};

/** Returns the next status when the primary workflow action is clicked. */
export function getNextStatus(status: JobStatus): JobStatus | null {
  switch (status) {
    case 'wishlist':
      return 'applied';
    case 'applied':
      return 'follow_up';
    case 'follow_up':
      return 'interview';
    default:
      return null;
  }
}

export interface TransitionResult {
  ok: boolean;
  message: string;
}

/** Validates a transition from -> to against the business workflow (drag-and-drop is unrestricted). */
export function canTransition(from: JobStatus, to: JobStatus): boolean {
  if (from === to) return true;
  switch (from) {
    case 'wishlist':
      return to === 'applied';
    case 'applied':
      return to === 'follow_up';
    case 'follow_up':
      return to === 'interview';
    case 'interview':
      return to === 'offer' || to === 'rejected';
    default:
      return false;
  }
}

export function transitionMessage(from: JobStatus, to: JobStatus): TransitionResult {
  if (from === to) {
    return { ok: true, message: `Application is already in ${STATUS_LABELS[to]}` };
  }
  if (canTransition(from, to)) {
    return { ok: true, message: `Application moved to ${STATUS_LABELS[to]}` };
  }
  return {
    ok: false,
    message: `Cannot move from ${STATUS_LABELS[from]} to ${STATUS_LABELS[to]} directly.`,
  };
}

/** Guard used by repository/service layer when importing or applying workflow updates. */
export function normalizeStatus(value: unknown): JobStatus | null {
  return isJobStatus(value) ? value : null;
}
