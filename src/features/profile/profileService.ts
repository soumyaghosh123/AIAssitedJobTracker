import type { Profile, ProfileInput } from '../../types';
import * as repo from '../../features/jobs/jobRepository';
import { todayISO } from '../../utils/format';

export const EMPTY_PROFILE: Profile = {
  id: 'me',
  name: '',
  email: '',
  phone: '',
  currentTitle: '',
  experience: '',
  skills: [],
  preferredRoles: [],
  preferredLocation: '',
  remotePreference: 'Flexible',
  minimumSalary: '',
  experienceRange: '',
  preferredEmploymentType: 'Full-time',
  summary: '',
  updatedAt: todayISO(),
};

export async function getProfile(): Promise<Profile> {
  const profile = await repo.getProfile();
  return profile ?? EMPTY_PROFILE;
}

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const existing = await repo.getProfile();
  const profile: Profile = {
    id: 'me',
    ...input,
    updatedAt: todayISO(),
    ...(existing ? { updatedAt: todayISO() } : {}),
  };
  return repo.saveProfile(profile);
}
