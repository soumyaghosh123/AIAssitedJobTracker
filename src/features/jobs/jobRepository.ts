import type { AppSettings, DocCategory, Job, JobDocument, JobStatus, Profile } from '../../types';
import { openDatabase, STORE_DOCUMENTS, STORE_JOBS, STORE_PROFILE, STORE_SETTINGS } from '../../db/database';
import { createId, todayISO } from '../../utils/format';

/**
 * Repository layer.
 *
 * This is the ONLY module that talks directly to IndexedDB. UI components and
 * services must go through this repository so the persistence layer can be
 * swapped for a REST/API implementation later without rewriting the UI.
 */

function getDb() {
  return openDatabase();
}

// ---------- Jobs ----------

export async function getAllJobs(): Promise<Job[]> {
  const db = await getDb();
  return db.getAll(STORE_JOBS);
}

export async function getJob(id: string): Promise<Job | undefined> {
  const db = await getDb();
  return db.get(STORE_JOBS, id);
}

export async function createJob(job: Job): Promise<Job> {
  const db = await getDb();
  await db.put(STORE_JOBS, job);
  return job;
}

export async function updateJob(job: Job): Promise<Job> {
  const db = await getDb();
  await db.put(STORE_JOBS, job);
  return job;
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_JOBS, id);
}

export async function updateJobStatus(id: string, status: JobStatus): Promise<Job | undefined> {
  const db = await getDb();
  const tx = db.transaction(STORE_JOBS, 'readwrite');
  const job = await tx.store.get(id);
  if (!job) {
    await tx.done;
    return undefined;
  }
  job.status = status;
  job.updatedAt = todayISO();
  await tx.store.put(job);
  await tx.done;
  return job;
}

/**
 * Applies a status change plus optional extra field updates in one write.
 * Used by workflow actions that need to stamp dates alongside the status
 * (e.g. setting a follow-up date when a job moves to follow_up).
 */
export async function updateJobStatusWithFields(
  id: string,
  status: JobStatus,
  fields: Partial<Pick<Job, 'followUpDate' | 'dateApplied' | 'interviewDate'>>,
): Promise<Job | undefined> {
  const db = await getDb();
  const tx = db.transaction(STORE_JOBS, 'readwrite');
  const job = await tx.store.get(id);
  if (!job) {
    await tx.done;
    return undefined;
  }
  job.status = status;
  job.updatedAt = todayISO();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      (job as unknown as Record<string, unknown>)[key] = value;
    }
  }
  await tx.store.put(job);
  await tx.done;
  return job;
}

export async function bulkPutJobs(jobs: Job[]): Promise<void> {
  if (jobs.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(STORE_JOBS, 'readwrite');
  await Promise.all(jobs.map((job) => tx.store.put(job)));
  await tx.done;
}

export async function clearJobs(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_JOBS);
}

// ---------- Profile ----------

export async function getProfile(): Promise<Profile | undefined> {
  const db = await getDb();
  return db.get(STORE_PROFILE, 'me');
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const db = await getDb();
  await db.put(STORE_PROFILE, profile);
  return profile;
}

export async function clearProfile(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_PROFILE, 'me');
}

// ---------- Documents ----------

export async function getAllDocuments(): Promise<JobDocument[]> {
  const db = await getDb();
  return db.getAll(STORE_DOCUMENTS);
}

export async function getDocument(id: string): Promise<JobDocument | undefined> {
  const db = await getDb();
  return db.get(STORE_DOCUMENTS, id);
}

export async function getDocumentsByCategory(category: DocCategory): Promise<JobDocument[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_DOCUMENTS, 'by-category', category);
}

export async function createDocument(
  doc: Omit<JobDocument, 'id' | 'uploadedAt' | 'updatedAt'> & Partial<Pick<JobDocument, 'id' | 'uploadedAt' | 'updatedAt'>>,
): Promise<JobDocument> {
  const db = await getDb();
  const now = todayISO();
  const document: JobDocument = {
    id: doc.id ?? createId('doc'),
    uploadedAt: doc.uploadedAt ?? now,
    updatedAt: doc.updatedAt ?? now,
    ...doc,
  };
  await db.put(STORE_DOCUMENTS, document);
  return document;
}

export async function updateDocument(document: JobDocument): Promise<JobDocument> {
  const db = await getDb();
  document.updatedAt = todayISO();
  await db.put(STORE_DOCUMENTS, document);
  return document;
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_DOCUMENTS, id);
}

export async function bulkPutDocuments(documents: JobDocument[]): Promise<void> {
  if (documents.length === 0) return;
  const db = await getDb();
  const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
  await Promise.all(documents.map((doc) => tx.store.put(doc)));
  await tx.done;
}

export async function clearDocuments(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_DOCUMENTS);
}

// ---------- Settings ----------

export async function getSettings(): Promise<AppSettings | undefined> {
  const db = await getDb();
  return db.get(STORE_SETTINGS, 'app');
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const db = await getDb();
  await db.put(STORE_SETTINGS, settings);
  return settings;
}

export async function clearSettings(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_SETTINGS, 'app');
}

// ---------- Backup ----------

export interface AllData {
  jobs: Job[];
  profile?: Profile;
  documents: JobDocument[];
  settings?: AppSettings;
}

export async function exportAllData(): Promise<AllData> {
  const [jobs, profile, documents, settings] = await Promise.all([
    getAllJobs(),
    getProfile(),
    getAllDocuments(),
    getSettings(),
  ]);
  return { jobs, profile, documents, settings };
}

export async function replaceAllData(data: AllData): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([STORE_JOBS, STORE_PROFILE, STORE_DOCUMENTS, STORE_SETTINGS], 'readwrite');
  await tx.objectStore(STORE_JOBS).clear();
  await tx.objectStore(STORE_PROFILE).clear();
  await tx.objectStore(STORE_DOCUMENTS).clear();
  await tx.objectStore(STORE_SETTINGS).clear();
  await Promise.all(data.jobs.map((job) => tx.objectStore(STORE_JOBS).put(job)));
  if (data.profile) await tx.objectStore(STORE_PROFILE).put(data.profile);
  await Promise.all(data.documents.map((doc) => tx.objectStore(STORE_DOCUMENTS).put(doc)));
  if (data.settings) await tx.objectStore(STORE_SETTINGS).put(data.settings);
  await tx.done;
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([STORE_JOBS, STORE_PROFILE, STORE_DOCUMENTS, STORE_SETTINGS], 'readwrite');
  await Promise.all([
    tx.objectStore(STORE_JOBS).clear(),
    tx.objectStore(STORE_PROFILE).clear(),
    tx.objectStore(STORE_DOCUMENTS).clear(),
    tx.objectStore(STORE_SETTINGS).clear(),
  ]);
  await tx.done;
}

// ---------- First-run demo seeding ----------

/**
 * Marker (kept outside IndexedDB) that records whether the demo seed set has
 * ever been loaded. "Clear all local data" wipes the IndexedDB stores but keeps
 * this marker, so an empty store after a deliberate clear is NOT mistaken for a
 * first run and re-seeded with demo jobs. Demo data can always be restored
 * explicitly from Settings → Data & Backup → Load sample data.
 */
const DEMO_SEEDED_KEY = 'career-pulse:demo-seeded';

export function hasDemoBeenSeeded(): boolean {
  return localStorage.getItem(DEMO_SEEDED_KEY) === '1';
}

export function markDemoSeeded(): void {
  localStorage.setItem(DEMO_SEEDED_KEY, '1');
}
