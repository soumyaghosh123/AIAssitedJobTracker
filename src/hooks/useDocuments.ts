import { useCallback, useEffect, useState } from 'react';
import type { DocCategory, JobDocument } from '../types';
import * as repo from '../features/jobs/jobRepository';
import {
  addDocument,
  downloadDocument,
  removeDocument,
  renameDocument,
} from '../features/docs/documentService';

export interface UseDocumentsResult {
  documents: JobDocument[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  upload: (file: File, category: DocCategory) => Promise<JobDocument>;
  rename: (id: string, name: string) => Promise<JobDocument>;
  remove: (id: string) => Promise<void>;
  download: (doc: JobDocument) => void;
}

export function useDocuments(): UseDocumentsResult {
  const [documents, setDocuments] = useState<JobDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const all = await repo.getAllDocuments();
      setDocuments(all);
    } catch (e) {
      setError('Could not load your documents.');
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const all = await repo.getAllDocuments();
        if (!cancelled) setDocuments(all);
      } catch (e) {
        if (!cancelled) {
          setError('Could not load your documents.');
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upload = useCallback(async (file: File, category: DocCategory) => {
    const doc = await addDocument(file, category);
    setDocuments((prev) => [...prev, doc]);
    return doc;
  }, []);

  const rename = useCallback(async (id: string, name: string) => {
    const updated = await renameDocument(id, name);
    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await removeDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const download = useCallback((doc: JobDocument) => {
    downloadDocument(doc);
  }, []);

  return { documents, loading, error, refresh, upload, rename, remove, download };
}
