import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { TrackerColumn } from '../components/tracker/TrackerColumn';
import { SortableContext } from '@dnd-kit/sortable';
import type { Job } from '../types';

const jobs: Job[] = [
  {
    id: '1',
    companyName: 'Microsoft',
    jobTitle: 'QA Lead',
    status: 'wishlist',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: '2',
    companyName: 'Google',
    jobTitle: 'SDET',
    status: 'wishlist',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
];

function renderColumn(count: number, withCards: boolean) {
  return render(
    <DndContext>
      <TrackerColumn
        status="wishlist"
        count={count}
        onAddToColumn={vi.fn()}
      >
        <SortableContext items={withCards ? jobs.map((j) => j.id) : []}>
          {withCards ? jobs.map((j) => <div key={j.id}>{j.companyName}</div>) : null}
        </SortableContext>
      </TrackerColumn>
    </DndContext>,
  );
}

describe('TrackerColumn', () => {
  it('shows the status label and count', () => {
    renderColumn(12, false);
    expect(screen.getByText('Wishlist')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows empty state when there are no jobs', () => {
    renderColumn(0, false);
    expect(screen.getByText('No jobs here yet.')).toBeInTheDocument();
  });

  it('renders children when there are jobs', () => {
    renderColumn(2, true);
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('provides an add-job control per column', () => {
    renderColumn(0, false);
    expect(screen.getByLabelText('Add job to Wishlist')).toBeInTheDocument();
  });
});
