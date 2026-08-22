import { useState, type FormEvent } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../components/common/Toast';
import { PageHeader, Button } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { Field, SelectInput, TextArea, TextInput } from '../components/common/Fields';

const SKILL_SUGGESTIONS = [
  'Selenium',
  'Java',
  'Cucumber',
  'TestNG',
  'Playwright',
  'API Testing',
  'AWS',
  'CI/CD',
  'Python',
  'JavaScript',
  'SQL',
  'JMeter',
  'Appium',
  'Git',
  'Docker',
];

const ROLE_SUGGESTIONS = [
  'QA Architect',
  'Automation Architect',
  'SDET Lead',
  'Test Automation Lead',
  'QA Engineer',
  'SDET Engineer',
];

export function ProfilePage() {
  const { profile, loading, error, update, refresh } = useProfile();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [, setDraftVersion] = useState(0);

  if (loading) return <Spinner label="Loading profile…" className="py-24" />;

  if (error) {
    return <PageHeader title="Profile" subtitle="Your professional career information" />;
  }
  if (!profile) return null;

  const setField = <K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) => {
    // Draft edits are held in local state and persisted on save.
    (profile as unknown as Record<string, unknown>)[key] = value;
    setDraftVersion((v) => v + 1);
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;
    if (profile.skills.includes(skill)) {
      showToast('Skill already added.', 'info');
      return;
    }
    setField('skills', [...profile.skills, skill]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setField(
      'skills',
      profile.skills.filter((s) => s !== skill),
    );
  };

  const addRole = () => {
    const role = roleInput.trim();
    if (!role) return;
    if (profile.preferredRoles.includes(role)) {
      showToast('Role already added.', 'info');
      return;
    }
    setField('preferredRoles', [...profile.preferredRoles, role]);
    setRoleInput('');
  };

  const removeRole = (role: string) => {
    setField(
      'preferredRoles',
      profile.preferredRoles.filter((r) => r !== role),
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const ok = await update({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        currentTitle: profile.currentTitle,
        experience: profile.experience,
        skills: profile.skills,
        preferredRoles: profile.preferredRoles,
        preferredLocation: profile.preferredLocation,
        remotePreference: profile.remotePreference,
        minimumSalary: profile.minimumSalary,
        experienceRange: profile.experienceRange,
        preferredEmploymentType: profile.preferredEmploymentType,
        summary: profile.summary,
      });
      if (ok) showToast('Profile saved successfully');
      else showToast('Could not save your profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your professional career information" />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Personal Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" id="name">
              <TextInput id="name" value={profile.name} onChange={(e) => setField('name', e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Email" id="email">
              <TextInput id="email" type="email" value={profile.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Phone" id="phone">
              <TextInput id="phone" value={profile.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 …" />
            </Field>
            <Field label="Current title" id="currentTitle">
              <TextInput id="currentTitle" value={profile.currentTitle} onChange={(e) => setField('currentTitle', e.target.value)} placeholder="e.g. Senior QA Engineer" />
            </Field>
            <Field label="Experience (years)" id="experience">
              <TextInput id="experience" value={profile.experience} onChange={(e) => setField('experience', e.target.value)} placeholder="e.g. 8" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Summary" id="summary">
                <TextArea
                  id="summary"
                  rows={3}
                  value={profile.summary}
                  onChange={(e) => setField('summary', e.target.value)}
                  placeholder="A short professional summary…"
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Skills</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded-full p-0.5 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-blue-800"
                  aria-label={`Remove skill ${skill}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <TextInput
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Add a skill"
                aria-label="Add a skill"
                className="w-40"
              />
              <Button type="button" variant="secondary" size="md" onClick={addSkill} aria-label="Add skill">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SKILL_SUGGESTIONS.filter((s) => !profile.skills.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setField('skills', [...profile.skills, s]);
                }}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-blue-400 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:text-blue-300"
              >
                + {s}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Preferred Roles</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {profile.preferredRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
              >
                {role}
                <button
                  type="button"
                  onClick={() => removeRole(role)}
                  className="rounded-full p-0.5 hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-indigo-800"
                  aria-label={`Remove role ${role}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <TextInput
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRole();
                  }
                }}
                placeholder="Add a preferred role"
                aria-label="Add a preferred role"
                className="w-48"
              />
              <Button type="button" variant="secondary" size="md" onClick={addRole} aria-label="Add role">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ROLE_SUGGESTIONS.filter((r) => !profile.preferredRoles.includes(r)).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setField('preferredRoles', [...profile.preferredRoles, r]);
                }}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
              >
                + {r}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Job Preferences</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Preferred location" id="preferredLocation">
              <TextInput id="preferredLocation" value={profile.preferredLocation} onChange={(e) => setField('preferredLocation', e.target.value)} placeholder="e.g. Hyderabad, Bengaluru" />
            </Field>
            <Field label="Remote preference" id="remotePreference">
              <SelectInput id="remotePreference" value={profile.remotePreference} onChange={(e) => setField('remotePreference', e.target.value)}>
                <option>Remote</option>
                <option>Hybrid</option>
                <option>On-site</option>
                <option>Flexible</option>
              </SelectInput>
            </Field>
            <Field label="Minimum salary" id="minimumSalary">
              <TextInput id="minimumSalary" value={profile.minimumSalary} onChange={(e) => setField('minimumSalary', e.target.value)} placeholder="e.g. ₹25 LPA" />
            </Field>
            <Field label="Experience range" id="experienceRange">
              <TextInput id="experienceRange" value={profile.experienceRange} onChange={(e) => setField('experienceRange', e.target.value)} placeholder="e.g. 6–10 years" />
            </Field>
            <Field label="Preferred employment type" id="preferredEmploymentType">
              <SelectInput id="preferredEmploymentType" value={profile.preferredEmploymentType} onChange={(e) => setField('preferredEmploymentType', e.target.value)}>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </SelectInput>
            </Field>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => refresh()}>
            Discard changes
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
