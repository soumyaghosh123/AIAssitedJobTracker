import { describe, expect, it } from 'vitest';
import { jobsToCsv, EXPORT_COLUMNS, exportFilename, jobsToWorkbook } from '../features/jobs/jobExport';
import type { Job } from '../types';

function makeJob(): Job {
  return {
    id: 'j1',
    companyName: 'Microsoft',
    jobTitle: 'QA Lead',
    status: 'applied',
    resumeUsed: 'QA_Lead_v3',
    dateApplied: '2026-08-20',
    salaryRange: '₹30–40 LPA',
    location: 'Hyderabad',
    experience: 'Lead',
    jobType: 'Full-time',
    recruiterName: 'Priya',
    recruiterEmail: 'priya@example.com',
    followUpDate: '2026-08-25',
    interviewDate: '',
    interviewRound: '',
    linkedinUrl: 'https://linkedin.com/jobs/x',
    notes: 'Note with, comma',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
  };
}

describe('export columns', () => {
  it('includes all required columns', () => {
    const headers = EXPORT_COLUMNS.map((c) => c.header);
    for (const required of [
      'Company',
      'Job Title',
      'Status',
      'Resume Used',
      'Date Applied',
      'Salary Range',
      'Location',
      'Experience',
      'Job Type',
      'Recruiter',
      'Recruiter Email',
      'Follow-up Date',
      'Interview Date',
      'Interview Round',
      'LinkedIn URL',
      'Notes',
      'Created Date',
      'Updated Date',
    ]) {
      expect(headers).toContain(required);
    }
  });
});

describe('jobsToCsv', () => {
  it('produces a CSV with header and escaped rows', () => {
    const csv = jobsToCsv([makeJob()]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('Company');
    expect(lines[1]).toContain('Microsoft');
    expect(lines[1]).toContain('"Note with, comma"');
    expect(lines[1]).toContain('Applied'); // display label, not internal value
  });
});

describe('exportFilename', () => {
  it('uses the CareerPulse naming convention', () => {
    expect(exportFilename('csv')).toMatch(/^CareerPulse_Tracker_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(exportFilename('xlsx')).toMatch(/^CareerPulse_Tracker_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});

describe('jobsToWorkbook', () => {
  it('builds an xlsx workbook with a Tracker sheet', () => {
    const workbook = jobsToWorkbook([makeJob()]);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    expect(workbook.SheetNames).toContain('Tracker');
    const cell = sheet?.['B2'];
    expect(cell).toBeTruthy();
  });
});
