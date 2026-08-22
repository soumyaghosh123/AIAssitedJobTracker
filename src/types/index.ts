export type JobStatus =
  | 'wishlist'
  | 'applied'
  | 'follow_up'
  | 'interview'
  | 'offer'
  | 'rejected';

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export interface Job {
  id: string;
  companyName: string;
  jobTitle: string;
  linkedinUrl?: string;
  resumeUsed?: string;
  dateApplied?: string;
  salaryRange?: string;
  notes?: string;
  status: JobStatus;
  location?: string;
  experience?: string;
  jobType?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  followUpDate?: string;
  interviewDate?: string;
  interviewRound?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobInput {
  companyName: string;
  jobTitle: string;
  linkedinUrl?: string;
  resumeUsed?: string;
  dateApplied?: string;
  salaryRange?: string;
  notes?: string;
  status?: JobStatus;
  location?: string;
  experience?: string;
  jobType?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  followUpDate?: string;
  interviewDate?: string;
  interviewRound?: string;
  rejectionReason?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  currentTitle: string;
  experience: string;
  skills: string[];
  preferredRoles: string[];
  preferredLocation: string;
  remotePreference: string;
  minimumSalary: string;
  experienceRange: string;
  preferredEmploymentType: string;
  summary: string;
  updatedAt: string;
}

export interface ProfileInput {
  name: string;
  email: string;
  phone: string;
  currentTitle: string;
  experience: string;
  skills: string[];
  preferredRoles: string[];
  preferredLocation: string;
  remotePreference: string;
  minimumSalary: string;
  experienceRange: string;
  preferredEmploymentType: string;
  summary: string;
}

export interface JobDocument {
  id: string;
  name: string;
  category: DocCategory;
  fileType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
  updatedAt: string;
}

export type DocCategory = 'Resumes' | 'Cover Letters' | 'Certifications' | 'Other';

export interface AppSettings {
  id: string;
  defaultPage: string;
  defaultSort: string;
  itemsPerPage: number;
  language: string;
  theme: 'light' | 'dark' | 'system';
  preferredRoles: string[];
  preferredLocations: string[];
  salaryRange: string;
  experienceRange: string;
  updatedAt: string;
}

export interface SettingsInput {
  defaultPage: string;
  defaultSort: string;
  itemsPerPage: number;
  language: string;
  theme: 'light' | 'dark' | 'system';
  preferredRoles: string[];
  preferredLocations: string[];
  salaryRange: string;
  experienceRange: string;
}

export interface BackupFile {
  app: 'CareerPulse';
  version: number;
  exportedAt: string;
  jobs: Job[];
  profile?: Profile;
  documents?: JobDocument[];
  settings?: AppSettings;
}
