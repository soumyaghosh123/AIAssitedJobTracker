/**
 * Database migrations.
 *
 * The schema is versioned in database.ts (DB_VERSION). Migrations run inside the
 * `upgrade` callback and must preserve existing user data — never delete a store
 * or its contents when bumping the version.
 *
 * Each migration is a pure description of the changes applied for a version bump.
 * The actual IndexedDB work happens in the `upgrade` handler; this module documents
 * the migration history and provides a changelog for debugging and future work.
 */

export interface Migration {
  version: number;
  description: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description:
      'Initial schema: jobs, profile, documents and settings object stores with indexes on status, updatedAt, company, category and uploadedAt.',
  },
];

export function getMigrationChangelog(): Migration[] {
  return [...MIGRATIONS];
}
