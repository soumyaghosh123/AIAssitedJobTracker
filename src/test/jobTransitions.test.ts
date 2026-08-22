import { describe, expect, it } from 'vitest';
import {
  canTransition,
  getNextStatus,
  transitionMessage,
  WORKFLOW_ACTIONS,
} from '../features/jobs/jobTransitions';

describe('workflow transitions', () => {
  it('wishlist -> applied', () => {
    expect(getNextStatus('wishlist')).toBe('applied');
    expect(canTransition('wishlist', 'applied')).toBe(true);
    expect(WORKFLOW_ACTIONS.wishlist?.action).toBe('apply');
  });

  it('applied -> follow_up', () => {
    expect(getNextStatus('applied')).toBe('follow_up');
    expect(canTransition('applied', 'follow_up')).toBe(true);
  });

  it('follow_up -> interview', () => {
    expect(getNextStatus('follow_up')).toBe('interview');
    expect(canTransition('follow_up', 'interview')).toBe(true);
    expect(WORKFLOW_ACTIONS.follow_up?.action).toBe('interviewScheduled');
  });

  it('interview -> offer and interview -> rejected', () => {
    expect(canTransition('interview', 'offer')).toBe(true);
    expect(canTransition('interview', 'rejected')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('wishlist', 'interview')).toBe(false);
    expect(canTransition('applied', 'offer')).toBe(false);
    expect(canTransition('offer', 'applied')).toBe(false);
    expect(canTransition('rejected', 'wishlist')).toBe(false);
  });

  it('no next stage after offer/rejected', () => {
    expect(getNextStatus('offer')).toBeNull();
    expect(getNextStatus('rejected')).toBeNull();
  });

  it('transitionMessage returns helpful messages', () => {
    expect(transitionMessage('wishlist', 'applied').ok).toBe(true);
    expect(transitionMessage('wishlist', 'applied').message).toContain('Applied');
    expect(transitionMessage('wishlist', 'offer').ok).toBe(false);
  });
});
