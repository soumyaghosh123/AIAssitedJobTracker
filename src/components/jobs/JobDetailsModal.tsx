import { ExternalLink, Mail, User } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import type { Job } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';
import { useJobs } from '../../hooks/useJobs';
import { useToast } from '../common/Toast';

interface JobDetailsModalProps {
  job: Job | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  );
}

export function JobDetailsModal({ job, onClose }: JobDetailsModalProps) {
  const { changeStatus } = useJobs();
  const { showToast } = useToast();

  if (!job) return null;

  const handleStatus = async (status: Job['status']) => {
    const result = await changeStatus(job.id, status);
    if (result.ok) showToast(result.message);
    else showToast(result.message, 'error');
  };

  return (
    <Modal
      open={!!job}
      onClose={onClose}
      title={job.companyName}
      description={job.jobTitle}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {job.status === 'wishlist' ? (
            <Button onClick={() => handleStatus('applied')}>Apply →</Button>
          ) : null}
          {job.status === 'applied' ? (
            <Button onClick={() => handleStatus('follow_up')}>Follow-up →</Button>
          ) : null}
          {job.status === 'follow_up' ? (
            <Button onClick={() => handleStatus('interview')}>Interview Scheduled →</Button>
          ) : null}
          {job.status === 'interview' ? (
            <>
              <Button onClick={() => handleStatus('offer')}>Offer ✓</Button>
              <Button variant="danger" onClick={() => handleStatus('rejected')}>
                Rejected ✕
              </Button>
            </>
          ) : null}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={job.status} />
          {job.jobType ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {job.jobType}
            </span>
          ) : null}
          {job.experience ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {job.experience}
            </span>
          ) : null}
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <DetailRow label="Location" value={job.location} />
          <DetailRow label="Salary range" value={job.salaryRange} />
          <DetailRow label="Resume used" value={job.resumeUsed} />
          <DetailRow label="Date applied" value={job.dateApplied ? formatDate(job.dateApplied) : undefined} />
          <DetailRow label="Follow-up date" value={job.followUpDate ? formatDate(job.followUpDate) : undefined} />
          <DetailRow label="Interview date" value={job.interviewDate ? formatDate(job.interviewDate) : undefined} />
          <DetailRow label="Interview round" value={job.interviewRound} />
          <DetailRow label="Rejection reason" value={job.rejectionReason} />
          <DetailRow label="Created" value={formatDateTime(job.createdAt)} />
          <DetailRow label="Updated" value={formatDateTime(job.updatedAt)} />
        </dl>

        {job.recruiterName || job.recruiterEmail ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-700/30">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Recruiter
            </h4>
            <div className="mt-2 space-y-1.5 text-sm text-slate-700 dark:text-slate-200">
              {job.recruiterName ? (
                <p className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {job.recruiterName}
                </p>
              ) : null}
              {job.recruiterEmail ? (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <a
                    href={`mailto:${job.recruiterEmail}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {job.recruiterEmail}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {job.linkedinUrl ? (
          <a
            href={job.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded dark:text-blue-400"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View job posting
          </a>
        ) : null}

        {job.notes ? (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Notes
            </h4>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{job.notes}</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
