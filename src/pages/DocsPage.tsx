import { useRef, useState } from 'react';
import { Download, FileText, Pencil, Trash2, Upload } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { useToast } from '../components/common/Toast';
import { PageHeader, Button } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { Field, TextInput } from '../components/common/Fields';
import { DOC_CATEGORIES, type DocCategory } from '../constants/statuses';
import type { JobDocument } from '../types';
import { formatDate, formatFileSize } from '../utils/format';
import { isAcceptedFileType, MAX_DOC_SIZE } from '../features/docs/documentService';

export function DocsPage() {
  const { documents, loading, error, refresh, upload, rename, remove, download } = useDocuments();
  const { showToast } = useToast();
  const [category, setCategory] = useState<DocCategory>('Resumes');
  const [uploading, setUploading] = useState(false);
  const [renamingDoc, setRenamingDoc] = useState<JobDocument | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingDoc, setDeletingDoc] = useState<JobDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_DOC_SIZE) {
      showToast('File is too large. Maximum size is 5 MB.', 'error');
      return;
    }
    if (!isAcceptedFileType(file)) {
      showToast('This file type is not supported.', 'error');
      return;
    }
    setUploading(true);
    try {
      const doc = await upload(file, category);
      showToast(`"${doc.name}" uploaded successfully`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const openRename = (doc: JobDocument) => {
    setRenamingDoc(doc);
    setRenameValue(doc.name);
  };

  const confirmRename = async () => {
    if (!renamingDoc || !renameValue.trim()) return;
    try {
      await rename(renamingDoc.id, renameValue.trim());
      showToast('Document renamed successfully');
      setRenamingDoc(null);
    } catch {
      showToast('Could not rename the document.', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deletingDoc) return;
    try {
      await remove(deletingDoc.id);
      showToast('Document deleted');
      setDeletingDoc(null);
    } catch {
      showToast('Could not delete the document.', 'error');
    }
  };

  const docsByCategory = (cat: DocCategory) =>
    documents.filter((d) => d.category === cat).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  if (loading) return <Spinner label="Loading documents…" className="py-24" />;

  if (error) {
    return (
      <EmptyState
        title="Could not load documents"
        description={error}
        action={<Button onClick={() => refresh()}>Try again</Button>}
      />
    );
  }

  const totalSize = documents.reduce((sum, d) => sum + d.size, 0);

  return (
    <div>
      <PageHeader
        title="Docs"
        subtitle="Your professional document library — resumes, cover letters and certifications."
        actions={
          <div className="flex items-center gap-2">
            <select
              aria-label="Document category"
              value={category}
              onChange={(e) => setCategory(e.target.value as DocCategory)}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              {DOC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Button variant="primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              aria-label="Upload a document"
            />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
        <span>
          {documents.length} document{documents.length === 1 ? '' : 's'}
        </span>
        <span>{formatFileSize(totalSize)} total</span>
        <span>Files are stored locally in your browser — never uploaded anywhere.</span>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title="No documents added yet."
          description="Upload your first resume. Files stay in your browser's local storage."
          action={
            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload a document
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {DOC_CATEGORIES.map((cat) => {
            const docs = docsByCategory(cat);
            if (docs.length === 0) return null;
            return (
              <section key={cat}>
                <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                  {cat}
                  <span className="ml-2 text-xs font-normal text-slate-400">{docs.length}</span>
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {docs.map((doc) => (
                    <article
                      key={doc.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-800"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{doc.name}</h3>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {doc.fileType.replace('application/', '')} · {formatFileSize(doc.size)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Uploaded {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => download(doc)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700 dark:hover:text-blue-300"
                          aria-label={`Download ${doc.name}`}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openRename(doc)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                          aria-label={`Rename ${doc.name}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingDoc(doc)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"
                          aria-label={`Delete ${doc.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Modal
        open={!!renamingDoc}
        onClose={() => setRenamingDoc(null)}
        title="Rename document"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRenamingDoc(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </>
        }
      >
        <Field label="Document name" id="rename-doc">
          <TextInput
            id="rename-doc"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmRename();
            }}
          />
        </Field>
      </Modal>

      <ConfirmDialog
        open={!!deletingDoc}
        title="Delete document"
        message={deletingDoc ? `Delete "${deletingDoc.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingDoc(null)}
      />
    </div>
  );
}
