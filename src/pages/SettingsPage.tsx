import { useRef, useState } from 'react';
import { Download, Save, Sparkles, Trash2, Upload } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useJobs } from '../hooks/useJobs';
import { useProfile } from '../hooks/useProfile';
import { useDocuments } from '../hooks/useDocuments';
import { useBackup, type ImportMode } from '../hooks/useBackup';
import { useToast } from '../components/common/Toast';
import { PageHeader, Button } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { Field, SelectInput, TextInput } from '../components/common/Fields';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { DEFAULT_PAGE_SIZE } from '../constants/statuses';
import { SORT_OPTIONS as SORT_OPTIONS_QUERY } from '../features/jobs/jobQuery';
import { clearAllData } from '../features/jobs/jobRepository';

const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const PAGE_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'tracker', label: 'Tracker' },
  { value: 'jobs', label: 'Jobs' },
];

export function SettingsPage() {
  const { settings, loading, error, update } = useSettings();
  const { refresh: refreshJobs, seedDemoData } = useJobs();
  const { refresh: refreshProfile } = useProfile();
  const { refresh: refreshDocs } = useDocuments();
  const { exportBackup, importBackup } = useBackup();
  const { showToast } = useToast();

  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [importPreview, setImportPreview] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [seedOpen, setSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) return <Spinner label="Loading settings…" className="py-24" />;

  if (error || !settings) {
    return (
      <EmptyStateFallback error={error} />
    );
  }

  const handleTheme = async (theme: 'light' | 'dark' | 'system') => {
    const ok = await update({ ...settings, theme });
    if (ok) showToast('Appearance updated');
    else showToast('Could not save appearance.', 'error');
  };

  const handleSave = async () => {
    const ok = await update({
      defaultPage: settings.defaultPage,
      defaultSort: settings.defaultSort,
      itemsPerPage: settings.itemsPerPage,
      language: settings.language,
      theme: settings.theme,
      preferredRoles: settings.preferredRoles,
      preferredLocations: settings.preferredLocations,
      salaryRange: settings.salaryRange,
      experienceRange: settings.experienceRange,
    });
    if (ok) showToast('Settings saved successfully');
    else showToast('Could not save settings.', 'error');
  };

  const handleExportBackup = async () => {
    const result = await exportBackup();
    if (result.ok) showToast('Backup exported successfully');
    else showToast(result.message, 'error');
  };

  const confirmSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const result = await seedDemoData(true);
      if (result.ok) {
        showToast(result.message);
        setSeedOpen(false);
        await refreshJobs();
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('Could not load sample data.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    setImportPreview(text.slice(0, 5000));
    setImportOpen(true);
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    try {
      const result = await importBackup(importPreview, importMode, (msg) => showToast(msg, 'info'));
      if (result.ok) {
        showToast(result.message);
        setImportOpen(false);
        await Promise.all([refreshJobs(), refreshProfile(), refreshDocs()]);
      } else {
        showToast(result.message, 'error');
      }
    } catch {
      showToast('Import failed. Please try again.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const confirmClearAll = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      await clearAllData();
      setClearOpen(false);
      showToast('All local data cleared');
      await Promise.all([refreshJobs(), refreshProfile(), refreshDocs()]);
    } catch {
      showToast('Could not clear local data.', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Configure CareerPulse to work the way you do." />

      <div className="space-y-6">
        {/* Appearance */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Appearance</h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Choose how CareerPulse looks.</p>
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Appearance theme">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                role="radio"
                aria-checked={settings.theme === option.value}
                onClick={() => handleTheme(option.value)}
                className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  settings.theme === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {/* General */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">General</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Default page" id="defaultPage">
              <SelectInput
                id="defaultPage"
                value={settings.defaultPage}
                onChange={(e) => {
                  settings.defaultPage = e.target.value;
                  void update({ ...settings, defaultPage: e.target.value });
                }}
              >
                {PAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Default sort" id="defaultSort">
              <SelectInput
                id="defaultSort"
                value={settings.defaultSort}
                onChange={(e) => {
                  settings.defaultSort = e.target.value;
                  void update({ ...settings, defaultSort: e.target.value });
                }}
              >
                {SORT_OPTIONS_QUERY.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Items per page" id="itemsPerPage">
              <TextInput
                id="itemsPerPage"
                type="number"
                min={1}
                max={100}
                value={settings.itemsPerPage}
                onChange={(e) => {
                  settings.itemsPerPage = Number(e.target.value) || DEFAULT_PAGE_SIZE;
                  void update({ ...settings, itemsPerPage: settings.itemsPerPage });
                }}
              />
            </Field>
            <Field label="Language" id="language">
              <SelectInput
                id="language"
                value={settings.language}
                onChange={(e) => {
                  settings.language = e.target.value;
                  void update({ ...settings, language: e.target.value });
                }}
              >
                <option>English</option>
                <option>हिन्दी (Hindi)</option>
                <option>తెలుగు (Telugu)</option>
              </SelectInput>
            </Field>
          </div>
        </section>

        {/* Job preferences */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Job Preferences</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Preferred roles (comma separated)" id="preferredRoles">
              <TextInput
                id="preferredRoles"
                value={settings.preferredRoles.join(', ')}
                onChange={(e) => {
                  settings.preferredRoles = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                }}
                placeholder="QA Architect, SDET Lead"
              />
            </Field>
            <Field label="Preferred locations (comma separated)" id="preferredLocations">
              <TextInput
                id="preferredLocations"
                value={settings.preferredLocations.join(', ')}
                onChange={(e) => {
                  settings.preferredLocations = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                }}
                placeholder="Hyderabad, Remote"
              />
            </Field>
            <Field label="Target salary range" id="salaryRange">
              <TextInput
                id="salaryRange"
                value={settings.salaryRange}
                onChange={(e) => {
                  settings.salaryRange = e.target.value;
                }}
                placeholder="e.g. ₹30–40 LPA"
              />
            </Field>
            <Field label="Experience range" id="experienceRange">
              <TextInput
                id="experienceRange"
                value={settings.experienceRange}
                onChange={(e) => {
                  settings.experienceRange = e.target.value;
                }}
                placeholder="e.g. 6–10 years"
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={handleSave}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save preferences
            </Button>
          </div>
        </section>

        {/* Data & backup */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Data &amp; Backup</h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Your data lives in this browser's IndexedDB. Back it up regularly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportBackup}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export all data (JSON)
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import data
            </Button>
            <Button variant="outline" onClick={() => setSeedOpen(true)}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Load sample data
            </Button>
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleImportFile} aria-label="Import backup file" />
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400">Danger zone</h3>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Clear all locally stored jobs, profile, documents and settings. This cannot be undone.
            </p>
            <Button variant="danger" className="mt-3" onClick={() => setClearOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear all local data
            </Button>
          </div>
        </section>
      </div>

      {/* Import modal */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import data"
        description="Imported data is validated before anything is written to your local database."
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmImport} disabled={importing}>
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </>
        }
      >
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">
            How should the imported data be applied?
          </legend>
          {(
            [
              { value: 'replace', label: 'Replace existing data', desc: 'Clears current data, then imports. Safer for full restores.' },
              { value: 'merge', label: 'Merge with existing data', desc: 'Keeps current data and adds imported jobs (re-ID collisions).' },
            ] as { value: ImportMode; label: string; desc: string }[]
          ).map((option) => (
            <label
              key={option.value}
              className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:border-slate-600 dark:has-[:checked]:border-blue-500 dark:has-[:checked]:bg-blue-900/30"
            >
              <input
                type="radio"
                name="import-mode"
                value={option.value}
                checked={importMode === option.value}
                onChange={() => setImportMode(option.value)}
                className="mt-1 h-4 w-4 accent-blue-600"
              />
              <span>
                <span className="block font-medium text-slate-800 dark:text-slate-100">{option.label}</span>
                <span className="block text-xs text-slate-400 dark:text-slate-500">{option.desc}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          File preview (first 80 characters): <code className="rounded bg-slate-100 px-1 dark:bg-slate-700">{importPreview?.slice(0, 80) ?? ''}…</code>
        </p>
      </Modal>

      <ConfirmDialog
        open={clearOpen}
        title="Clear all local data"
        message="This permanently deletes all jobs, profile, documents and settings stored in this browser. Are you sure?"
        confirmLabel="Delete everything"
        onConfirm={confirmClearAll}
        onCancel={() => setClearOpen(false)}
      />

      <ConfirmDialog
        open={seedOpen}
        title="Load sample data"
        message="This replaces your current jobs with the 25 demo records so the tracker and dashboard graphs are fully populated. Your profile, documents and settings are kept. Continue?"
        confirmLabel="Load sample data"
        danger={false}
        onConfirm={confirmSeed}
        onCancel={() => setSeedOpen(false)}
      />
    </div>
  );
}

function EmptyStateFallback({ error }: { error: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {error ?? 'Could not load settings.'}
      </p>
    </div>
  );
}
