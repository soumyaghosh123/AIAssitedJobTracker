import { useCallback } from 'react';
import type { Job } from '../types';
import { downloadCsv, downloadXlsx } from '../features/jobs/jobExport';

export function useExportJobs() {
  const exportCsv = useCallback((jobs: Job[]) => {
    downloadCsv(jobs);
  }, []);

  const exportXlsx = useCallback((jobs: Job[]) => {
    downloadXlsx(jobs);
  }, []);

  return { exportCsv, exportXlsx };
}
