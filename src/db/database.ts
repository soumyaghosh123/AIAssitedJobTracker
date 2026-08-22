import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { AppSettings, DocCategory, Job, JobDocument, Profile } from '../types';

export const DB_NAME = 'career-pulse-db';
export const DB_VERSION = 1;

export const STORE_JOBS = 'jobs';
export const STORE_PROFILE = 'profile';
export const STORE_DOCUMENTS = 'documents';
export const STORE_SETTINGS = 'settings';

export interface CareerPulseDB extends DBSchema {
  jobs: {
    key: string;
    value: Job;
    indexes: {
      'by-status': string;
      'by-updatedAt': string;
      'by-company': string;
    };
  };
  profile: {
    key: string;
    value: Profile;
  };
  documents: {
    key: string;
    value: JobDocument;
    indexes: {
      'by-category': DocCategory;
      'by-uploadedAt': string;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

/** Opens the database and runs schema migrations. Migrations preserve existing user data. */
export async function openDatabase(): Promise<IDBPDatabase<CareerPulseDB>> {
  return openDB<CareerPulseDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      // Version 1: initial schema
      if (oldVersion < 1) {
        const jobs = db.createObjectStore(STORE_JOBS, { keyPath: 'id' });
        jobs.createIndex('by-status', 'status');
        jobs.createIndex('by-updatedAt', 'updatedAt');
        jobs.createIndex('by-company', 'companyName');

        db.createObjectStore(STORE_PROFILE, { keyPath: 'id' });

        const documents = db.createObjectStore(STORE_DOCUMENTS, { keyPath: 'id' });
        documents.createIndex('by-category', 'category');
        documents.createIndex('by-uploadedAt', 'uploadedAt');

        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
      // Future versions: add `if (oldVersion < 2) { ... }` blocks here.
      void transaction;
    },
  });
}

export type Database = IDBPDatabase<CareerPulseDB>;
