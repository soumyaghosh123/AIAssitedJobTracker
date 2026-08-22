import * as XLSX from 'xlsx';
import { STATUS_LABELS } from '../../constants/statuses';
import type { Job } from '../../types';
import { csvRow, downloadBlob, downloadText, todayISO } from '../../utils/format';

export const EXPORT_COLUMNS: { header: string; value: (job: Job) => unknown }[] = [
  { header: 'Company', value: (j) => j.companyName },
  { header: 'Job Title', value: (j) => j.jobTitle },
  { header: 'Status', value: (j) => STATUS_LABELS[j.status] },
  { header: 'Resume Used', value: (j) => j.resumeUsed ?? '' },
  { header: 'Date Applied', value: (j) => j.dateApplied ?? '' },
  { header: 'Salary Range', value: (j) => j.salaryRange ?? '' },
  { header: 'Location', value: (j) => j.location ?? '' },
  { header: 'Experience', value: (j) => j.experience ?? '' },
  { header: 'Job Type', value: (j) => j.jobType ?? '' },
  { header: 'Recruiter', value: (j) => j.recruiterName ?? '' },
  { header: 'Recruiter Email', value: (j) => j.recruiterEmail ?? '' },
  { header: 'Follow-up Date', value: (j) => j.followUpDate ?? '' },
  { header: 'Interview Date', value: (j) => j.interviewDate ?? '' },
  { header: 'Interview Round', value: (j) => j.interviewRound ?? '' },
  { header: 'LinkedIn URL', value: (j) => j.linkedinUrl ?? '' },
  { header: 'Notes', value: (j) => j.notes ?? '' },
  { header: 'Created Date', value: (j) => j.createdAt ?? '' },
  { header: 'Updated Date', value: (j) => j.updatedAt ?? '' },
];

export function exportDateStamp(): string {
  return todayISO().slice(0, 10);
}

export function exportFilename(ext: 'csv' | 'xlsx'): string {
  return `CareerPulse_Tracker_${exportDateStamp()}.${ext}`;
}

export function jobsToCsv(jobs: Job[]): string {
  const rows: string[] = [EXPORT_COLUMNS.map((c) => c.header).join(',')];
  for (const job of jobs) {
    rows.push(csvRow(EXPORT_COLUMNS.map((c) => c.value(job))));
  }
  return rows.join('\r\n');
}

export function downloadCsv(jobs: Job[]): void {
  const csv = jobsToCsv(jobs);
  downloadText(csv, exportFilename('csv'), 'text/csv;charset=utf-8');
}

export function jobsToWorkbook(jobs: Job[]): XLSX.WorkBook {
  const data = jobs.map((job) => {
    const row: Record<string, unknown> = {};
    for (const col of EXPORT_COLUMNS) {
      row[col.header] = col.value(job);
    }
    return row;
  });
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tracker');
  return workbook;
}

export function downloadXlsx(jobs: Job[]): void {
  const workbook = jobsToWorkbook(jobs);
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    exportFilename('xlsx'),
  );
}
