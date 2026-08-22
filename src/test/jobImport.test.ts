import { describe, expect, it } from 'vitest';
import {
  validateBackupJson,
  normalizeImportedJob,
  resolveDuplicateIds,
  mergeJobs,
  buildBackup,
} from '../features/jobs/jobImport';
import type { Job } from '../types';

describe('normalizeImportedJob', () => {
  it('normalizes a valid record', () => {
    const job = normalizeImportedJob({
      id: 'j1',
      companyName: 'Microsoft',
      jobTitle: 'QA Lead',
      status: 'applied',
      location: 'Hyderabad',
    });
    expect(job?.companyName).toBe('Microsoft');
    expect(job?.status).toBe('applied');
    expect(job?.location).toBe('Hyderabad');
  });

  it('rejects records missing required fields', () => {
    expect(normalizeImportedJob({ companyName: 'X' })).toBeNull();
    expect(normalizeImportedJob({ jobTitle: 'Y' })).toBeNull();
    expect(normalizeImportedJob(null)).toBeNull();
    expect(normalizeImportedJob('string')).toBeNull();
  });

  it('falls back to wishlist for invalid status', () => {
    const job = normalizeImportedJob({ companyName: 'X', jobTitle: 'Y', status: 'accepted' });
    expect(job?.status).toBe('wishlist');
  });
});

describe('validateBackupJson', () => {
  it('rejects malformed JSON', () => {
    const result = validateBackupJson('{ not json');
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Malformed');
  });

  it('rejects non-object non-array input', () => {
    const result = validateBackupJson('"hello"');
    expect(result.ok).toBe(false);
  });

  it('rejects a file that is not a CareerPulse backup', () => {
    const result = validateBackupJson(JSON.stringify({ app: 'OtherApp', jobs: [] }));
    expect(result.ok).toBe(false);
  });

  it('accepts an array of jobs and validates them', () => {
    const result = validateBackupJson(
      JSON.stringify([
        { companyName: 'Microsoft', jobTitle: 'QA Lead', status: 'applied' },
        { companyName: 'Google' }, // invalid, skipped
      ]),
    );
    expect(result.ok).toBe(true);
    expect(result.jobs).toHaveLength(1);
    expect(result.skipped).toBe(1);
  });

  it('accepts a full backup object', () => {
    const result = validateBackupJson(
      JSON.stringify({
        app: 'CareerPulse',
        version: 1,
        jobs: [{ companyName: 'Microsoft', jobTitle: 'QA Lead' }],
        profile: { name: 'Test User', skills: ['Selenium'] },
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.jobs).toHaveLength(1);
    expect(result.profile?.name).toBe('Test User');
  });

  it('rejects a backup with no valid data', () => {
    const result = validateBackupJson(JSON.stringify({ app: 'CareerPulse', jobs: [{ foo: 1 }] }));
    expect(result.ok).toBe(false);
  });
});

describe('resolveDuplicateIds / mergeJobs', () => {
  const existing: Job[] = [
    {
      id: 'a',
      companyName: 'Old',
      jobTitle: 'Role',
      status: 'wishlist',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  it('re-IDs colliding jobs on merge', () => {
    const imported: Job[] = [
      {
        id: 'a',
        companyName: 'New',
        jobTitle: 'Role',
        status: 'applied',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
    ];
    const resolved = resolveDuplicateIds(imported, existing);
    expect(resolved[0].id).not.toBe('a');
  });

  it('mergeJobs combines both sets without losing data', () => {
    const imported: Job[] = [
      {
        id: 'b',
        companyName: 'New Co',
        jobTitle: 'Role',
        status: 'applied',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
    ];
    const merged = mergeJobs(existing, imported);
    expect(merged).toHaveLength(2);
  });
});

describe('buildBackup', () => {
  it('creates a CareerPulse backup envelope', () => {
    const job: Job = {
      id: 'x',
      companyName: 'A',
      jobTitle: 'B',
      status: 'wishlist',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const backup = buildBackup([job]);
    expect(backup.app).toBe('CareerPulse');
    expect(backup.version).toBe(1);
    expect(backup.jobs).toHaveLength(1);
    expect(backup.exportedAt).toBeTruthy();
  });
});
