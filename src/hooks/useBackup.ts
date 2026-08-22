import { useCallback } from 'react';
import { buildBackup, validateBackupJson } from '../features/jobs/jobImport';
import * as repo from '../features/jobs/jobRepository';
import { downloadText, todayISO } from '../utils/format';

export type ImportMode = 'replace' | 'merge';

export interface BackupResult {
  ok: boolean;
  message: string;
  jobsImported: number;
}

export function useBackup() {
  /** Exports all local data (jobs + profile + documents + settings) as a JSON backup file. */
  const exportBackup = useCallback(async (): Promise<BackupResult> => {
    try {
      const data = await repo.exportAllData();
      const backup = buildBackup(data.jobs, data.profile, data.documents, data.settings);
      const json = JSON.stringify(backup, null, 2);
      downloadText(json, `CareerPulse_Backup_${todayISO().slice(0, 10)}.json`, 'application/json');
      return { ok: true, message: 'Backup exported successfully', jobsImported: data.jobs.length };
    } catch (e) {
      console.error(e);
      return { ok: false, message: 'Could not export the backup.', jobsImported: 0 };
    }
  }, []);

  /**
   * Imports a JSON backup. Text is validated before anything is written.
   * "replace" clears all stores first; "merge" keeps existing data and only
   * re-IDs collisions.
   */
  const importBackup = useCallback(
    async (text: string, mode: ImportMode, onProgress?: (message: string) => void): Promise<BackupResult> => {
      const validation = validateBackupJson(text);
      if (!validation.ok) {
        return { ok: false, message: validation.message, jobsImported: 0 };
      }
      try {
        onProgress?.('Validated backup. Writing to local database…');
        if (mode === 'replace') {
          const data = {
            jobs: validation.jobs,
            profile: validation.profile,
            documents: validation.documents ?? [],
            settings: validation.settings,
          };
          await repo.replaceAllData(data);
        } else {
          const existing = await repo.getAllJobs();
          const byId = new Map(existing.map((j) => [j.id, j]));
          for (const job of validation.jobs) {
            const key = job.id;
            if (byId.has(key)) {
              byId.set(`${key}_imported`, { ...job, id: `${key}_imported` });
            } else {
              byId.set(key, job);
            }
          }
          await repo.bulkPutJobs(Array.from(byId.values()));
          if (validation.documents && validation.documents.length > 0) {
            const existingDocs = await repo.getAllDocuments();
            const docIds = new Set(existingDocs.map((d) => d.id));
            const toAdd = validation.documents
              .filter((d) => !docIds.has(d.id))
              .map((d) => (docIds.has(d.id) ? d : d));
            await repo.bulkPutDocuments(toAdd);
          }
        }
        onProgress?.('Import complete.');
        return {
          ok: true,
          message:
            mode === 'replace'
              ? `Imported ${validation.jobs.length} jobs. Existing data was replaced.`
              : `Merged ${validation.jobs.length} jobs with existing data.`,
          jobsImported: validation.jobs.length,
        };
      } catch (e) {
        console.error(e);
        return { ok: false, message: 'Could not write the imported data.', jobsImported: 0 };
      }
    },
    [],
  );

  return { exportBackup, importBackup };
}
