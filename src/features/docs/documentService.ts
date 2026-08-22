import type { DocCategory, JobDocument } from '../../types';
import * as repo from '../../features/jobs/jobRepository';
import { createId } from '../../utils/format';

export const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5 MB per file
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/zip',
  'image/png',
  'image/jpeg',
  'application/octet-stream',
];

export function isAcceptedFileType(file: File): boolean {
  if (!file.type) return true; // let extension validation handle unknown types
  return ACCEPTED_TYPES.includes(file.type) || file.type.startsWith('image/');
}

export function sanitizeDocName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'document';
}

export async function addDocument(file: File, category: DocCategory): Promise<JobDocument> {
  if (file.size > MAX_DOC_SIZE) {
    throw new Error('File is too large. Maximum size is 5 MB.');
  }
  const dataUrl = await readFileAsDataUrl(file);
  const doc: Omit<JobDocument, 'id' | 'uploadedAt' | 'updatedAt'> & { id?: string } = {
    id: createId('doc'),
    name: sanitizeDocName(file.name),
    category,
    fileType: file.type || 'application/octet-stream',
    size: file.size,
    dataUrl,
  };
  return repo.createDocument(doc);
}

export async function renameDocument(id: string, name: string): Promise<JobDocument> {
  const doc = await repo.getDocument(id);
  if (!doc) throw new Error('Document not found.');
  const updated = { ...doc, name: sanitizeDocName(name) };
  return repo.updateDocument(updated);
}

export async function removeDocument(id: string): Promise<void> {
  await repo.deleteDocument(id);
}

export function downloadDocument(doc: JobDocument): void {
  const link = document.createElement('a');
  link.href = doc.dataUrl;
  link.download = doc.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}
