import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { JOB_STATUSES } from '../../constants/statuses';
import type { Job, JobStatus } from '../../types';
import { TrackerColumn } from './TrackerColumn';
import { JobCard } from './JobCard';
import { useToast } from '../common/Toast';

interface TrackerBoardProps {
  jobs: Job[];
  onStatusChange: (id: string, status: JobStatus) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onOpen: (job: Job) => void;
  onAddToColumn: (status: JobStatus) => void;
}

export function TrackerBoard({
  jobs,
  onStatusChange,
  onEdit,
  onDelete,
  onOpen,
  onAddToColumn,
}: TrackerBoardProps) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const { showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnJobs = useMemo(() => {
    const map = new Map<JobStatus, Job[]>();
    for (const status of JOB_STATUSES) map.set(status, []);
    for (const job of jobs) {
      map.get(job.status)?.push(job);
    }
    return map;
  }, [jobs]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = String(event.active.id);
      const job = jobs.find((j) => j.id === id);
      if (job) setActiveJob(job);
    },
    [jobs],
  );

  const findColumnForId = useCallback(
    (id: string): JobStatus => {
      const job = jobs.find((j) => j.id === id);
      if (job) return job.status;
      if ((JOB_STATUSES as readonly string[]).includes(id)) return id as JobStatus;
      return 'wishlist';
    },
    [jobs],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveJob(null);
      const { active, over } = event;
      if (!over) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId) return;

      const activeStatus = findColumnForId(activeId);
      const overStatus = findColumnForId(overId);

      // Cross-column: change status (persisted via onStatusChange)
      if (activeStatus !== overStatus) {
        const job = jobs.find((j) => j.id === activeId);
        if (job) {
          onStatusChange(job.id, overStatus);
        }
        return;
      }

      // Same column reorder: visual only; column order is not persisted.
      showToast('Card reordered.');
    },
    [findColumnForId, jobs, onStatusChange, showToast],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveJob(null)}
    >
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        role="region"
        aria-label="Tracker board"
      >
        {JOB_STATUSES.map((status) => {
          const statusJobs = columnJobs.get(status) ?? [];
          return (
            <TrackerColumn
              key={status}
              status={status}
              count={statusJobs.length}
              onAddToColumn={onAddToColumn}
            >
              <SortableContext items={statusJobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
                {statusJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onAction={(j, to) => onStatusChange(j.id, to)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onOpen={onOpen}
                  />
                ))}
              </SortableContext>
            </TrackerColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeJob ? (
          <div className="w-[280px] opacity-95">
            <JobCard
              job={activeJob}
              onAction={() => undefined}
              onEdit={() => undefined}
              onDelete={() => undefined}
              onOpen={() => undefined}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
