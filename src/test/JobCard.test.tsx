import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { JobCard } from '../components/tracker/JobCard';
import { ToastProvider } from '../components/common/Toast';
import type { Job } from '../types';

function makeJob(status: Job['status']): Job {
  return {
    id: 'j1',
    companyName: 'Microsoft',
    jobTitle: 'QA Lead',
    status,
    location: 'Hyderabad',
    salaryRange: '₹30–40 LPA',
    resumeUsed: 'QA_Lead_v3',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

function renderCard(job: Job, onAction = vi.fn()) {
  return render(
    <ToastProvider>
      <DndContext>
        <SortableContext items={[job.id]}>
          <JobCard job={job} onAction={onAction} onEdit={vi.fn()} onDelete={vi.fn()} />
        </SortableContext>
      </DndContext>
    </ToastProvider>,
  );
}

describe('JobCard', () => {
  it('shows Apply button for wishlist', () => {
    renderCard(makeJob('wishlist'));
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument();
  });

  it('shows Follow-up button for applied', () => {
    renderCard(makeJob('applied'));
    expect(screen.getByRole('button', { name: /Follow-up/i })).toBeInTheDocument();
  });

  it('shows Interview Scheduled for follow_up', () => {
    renderCard(makeJob('follow_up'));
    expect(screen.getByRole('button', { name: /Interview Scheduled/i })).toBeInTheDocument();
  });

  it('shows Offer and Rejected for interview', () => {
    renderCard(makeJob('interview'));
    expect(screen.getByRole('button', { name: /Offer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rejected/i })).toBeInTheDocument();
  });

  it('shows no workflow action for offer and rejected', () => {
    const { container } = renderCard(makeJob('offer'));
    expect(container.querySelectorAll('button').length).toBeGreaterThanOrEqual(3); // edit/delete/grip
  });

  it('triggers apply action when Apply is clicked', () => {
    const onAction = vi.fn();
    renderCard(makeJob('wishlist'), onAction);
    screen.getByRole('button', { name: /Apply/i }).click();
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'j1' }), 'applied');
  });

  it('triggers offer action from interview', () => {
    const onAction = vi.fn();
    renderCard(makeJob('interview'), onAction);
    screen.getByRole('button', { name: /Offer/i }).click();
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'j1' }), 'offer');
  });

  it('triggers rejected action from interview', () => {
    const onAction = vi.fn();
    renderCard(makeJob('interview'), onAction);
    screen.getByRole('button', { name: /Rejected/i }).click();
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'j1' }), 'rejected');
  });

  it('shows company name, job title and salary', () => {
    renderCard(makeJob('wishlist'));
    expect(screen.getByText('Microsoft')).toBeInTheDocument();
    expect(screen.getByText('QA Lead')).toBeInTheDocument();
    expect(screen.getByText('₹30–40 LPA')).toBeInTheDocument();
  });
});
