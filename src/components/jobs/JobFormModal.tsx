import { useEffect, useMemo, useState } from 'react';
import { useJobs } from '../../hooks/useJobs';
import { useDocuments } from '../../hooks/useDocuments';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';
import { Button } from '../common/PageHeader';
import { Field, SelectInput, TextArea, TextInput } from '../common/Fields';
import { JOB_STATUSES, JOB_TYPES, STATUS_LABELS } from '../../constants/statuses';
import type { Job, JobInput } from '../../types';
import { validateJobInput } from '../../features/jobs/jobValidation';
import { toDateInputValue } from '../../utils/format';

const EXPERIENCE_LEVELS = [
  'Entry Level',
  'Mid Level',
  'Senior Level',
  'Lead',
  'Architect',
  'Executive',
];

interface JobFormModalProps {
  open: boolean;
  job: Job | null;
  onClose: () => void;
}

interface FormState {
  companyName: string;
  jobTitle: string;
  linkedinUrl: string;
  resumeUsed: string;
  dateApplied: string;
  salaryRange: string;
  notes: string;
  status: string;
  location: string;
  experience: string;
  jobType: string;
  recruiterName: string;
  recruiterEmail: string;
  followUpDate: string;
  interviewDate: string;
  interviewRound: string;
  rejectionReason: string;
}

function emptyForm(): FormState {
  return {
    companyName: '',
    jobTitle: '',
    linkedinUrl: '',
    resumeUsed: '',
    dateApplied: '',
    salaryRange: '',
    notes: '',
    status: 'wishlist',
    location: '',
    experience: '',
    jobType: '',
    recruiterName: '',
    recruiterEmail: '',
    followUpDate: '',
    interviewDate: '',
    interviewRound: '',
    rejectionReason: '',
  };
}

function jobToForm(job: Job): FormState {
  return {
    companyName: job.companyName,
    jobTitle: job.jobTitle,
    linkedinUrl: job.linkedinUrl ?? '',
    resumeUsed: job.resumeUsed ?? '',
    dateApplied: toDateInputValue(job.dateApplied),
    salaryRange: job.salaryRange ?? '',
    notes: job.notes ?? '',
    status: job.status,
    location: job.location ?? '',
    experience: job.experience ?? '',
    jobType: job.jobType ?? '',
    recruiterName: job.recruiterName ?? '',
    recruiterEmail: job.recruiterEmail ?? '',
    followUpDate: toDateInputValue(job.followUpDate),
    interviewDate: toDateInputValue(job.interviewDate),
    interviewRound: job.interviewRound ?? '',
    rejectionReason: job.rejectionReason ?? '',
  };
}

export function JobFormModal({ open, job, onClose }: JobFormModalProps) {
  const { addJob, editJob } = useJobs();
  const { documents } = useDocuments();
  const { showToast } = useToast();

  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(job ? jobToForm(job) : emptyForm());
      setErrors({});
      setSubmitting(false);
    }
  }, [open, job]);

  const resumeOptions = useMemo(() => {
    const fromJobs = documents
      .filter((d) => d.category === 'Resumes')
      .map((d) => d.name.replace(/\.[^.]+$/, ''));
    const set = new Set<string>();
    if (form.resumeUsed.trim()) set.add(form.resumeUsed.trim());
    for (const name of fromJobs) set.add(name);
    return Array.from(set);
  }, [documents, form.resumeUsed]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const input: JobInput = {
      companyName: form.companyName,
      jobTitle: form.jobTitle,
      linkedinUrl: form.linkedinUrl || undefined,
      resumeUsed: form.resumeUsed || undefined,
      dateApplied: form.dateApplied || undefined,
      salaryRange: form.salaryRange || undefined,
      notes: form.notes || undefined,
      status: (JOB_STATUSES as readonly string[]).includes(form.status) ? (form.status as Job['status']) : 'wishlist',
      location: form.location || undefined,
      experience: form.experience || undefined,
      jobType: form.jobType || undefined,
      recruiterName: form.recruiterName || undefined,
      recruiterEmail: form.recruiterEmail || undefined,
      followUpDate: form.followUpDate || undefined,
      interviewDate: form.interviewDate || undefined,
      interviewRound: form.interviewRound || undefined,
      rejectionReason: form.rejectionReason || undefined,
    };
    const validation = validateJobInput(input);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      showToast(Object.values(validation)[0] ?? 'Please fix the highlighted fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const result = job ? await editJob(job.id, input) : await addJob(input);
      if (result.ok) {
        showToast(result.message);
        onClose();
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={job ? 'Edit Job' : 'Add Job'}
      description={job ? `Editing ${job.companyName} — ${job.jobTitle}` : 'Add a new job opportunity to your tracker.'}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="job-form" disabled={submitting}>
            {submitting ? 'Saving…' : job ? 'Save Changes' : 'Add Job'}
          </Button>
        </>
      }
    >
      <form id="job-form" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company name" required id="companyName" error={errors.companyName}>
            <TextInput
              id="companyName"
              name="companyName"
              value={form.companyName}
              onChange={(e) => setField('companyName', e.target.value)}
              invalid={!!errors.companyName}
              autoComplete="organization"
              placeholder="e.g. Microsoft"
            />
          </Field>
          <Field label="Job title" required id="jobTitle" error={errors.jobTitle}>
            <TextInput
              id="jobTitle"
              name="jobTitle"
              value={form.jobTitle}
              onChange={(e) => setField('jobTitle', e.target.value)}
              invalid={!!errors.jobTitle}
              autoComplete="off"
              placeholder="e.g. QA Automation Lead"
            />
          </Field>

          <Field label="Status" id="status">
            <SelectInput
              id="status"
              name="status"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              {JOB_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Location" id="location">
            <TextInput
              id="location"
              name="location"
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder="e.g. Hyderabad / Hybrid"
            />
          </Field>

          <Field label="Salary range" id="salaryRange">
            <TextInput
              id="salaryRange"
              name="salaryRange"
              value={form.salaryRange}
              onChange={(e) => setField('salaryRange', e.target.value)}
              placeholder="e.g. ₹30–40 LPA"
            />
          </Field>
          <Field label="Experience" id="experience">
            <SelectInput
              id="experience"
              name="experience"
              value={form.experience}
              onChange={(e) => setField('experience', e.target.value)}
            >
              <option value="">Any</option>
              {EXPERIENCE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Job type" id="jobType">
            <SelectInput
              id="jobType"
              name="jobType"
              value={form.jobType}
              onChange={(e) => setField('jobType', e.target.value)}
            >
              <option value="">Any</option>
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Date applied" id="dateApplied">
            <TextInput
              type="date"
              id="dateApplied"
              name="dateApplied"
              value={form.dateApplied}
              onChange={(e) => setField('dateApplied', e.target.value)}
            />
          </Field>

          <Field label="Resume used" id="resumeUsed" hint="Choose a previous resume or type a new name.">
            <TextInput
              id="resumeUsed"
              name="resumeUsed"
              list="resume-options"
              value={form.resumeUsed}
              onChange={(e) => setField('resumeUsed', e.target.value)}
              placeholder="e.g. QA_Lead_Resume_v3"
            />
            <datalist id="resume-options">
              {resumeOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Field>
          <Field label="LinkedIn / job URL" id="linkedinUrl" error={errors.linkedinUrl}>
            <TextInput
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => setField('linkedinUrl', e.target.value)}
              invalid={!!errors.linkedinUrl}
              placeholder="https://www.linkedin.com/jobs/view/…"
            />
          </Field>

          <Field label="Recruiter name" id="recruiterName">
            <TextInput
              id="recruiterName"
              name="recruiterName"
              value={form.recruiterName}
              onChange={(e) => setField('recruiterName', e.target.value)}
              placeholder="e.g. Priya Sharma"
            />
          </Field>
          <Field label="Recruiter email" id="recruiterEmail" error={errors.recruiterEmail}>
            <TextInput
              id="recruiterEmail"
              name="recruiterEmail"
              type="email"
              value={form.recruiterEmail}
              onChange={(e) => setField('recruiterEmail', e.target.value)}
              invalid={!!errors.recruiterEmail}
              placeholder="recruiter@company.com"
            />
          </Field>

          <Field label="Follow-up date" id="followUpDate">
            <TextInput
              type="date"
              id="followUpDate"
              name="followUpDate"
              value={form.followUpDate}
              onChange={(e) => setField('followUpDate', e.target.value)}
            />
          </Field>
          <Field label="Interview date" id="interviewDate">
            <TextInput
              type="date"
              id="interviewDate"
              name="interviewDate"
              value={form.interviewDate}
              onChange={(e) => setField('interviewDate', e.target.value)}
            />
          </Field>

          <Field label="Interview round" id="interviewRound">
            <TextInput
              id="interviewRound"
              name="interviewRound"
              value={form.interviewRound}
              onChange={(e) => setField('interviewRound', e.target.value)}
              placeholder="e.g. Round 2 - Technical"
            />
          </Field>
          <Field label="Rejection reason" id="rejectionReason">
            <TextInput
              id="rejectionReason"
              name="rejectionReason"
              value={form.rejectionReason}
              onChange={(e) => setField('rejectionReason', e.target.value)}
              placeholder="e.g. Position filled internally"
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Notes" id="notes">
              <TextArea
                id="notes"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Key details, contacts, prep notes…"
              />
            </Field>
          </div>
        </div>
      </form>
    </Modal>
  );
}
