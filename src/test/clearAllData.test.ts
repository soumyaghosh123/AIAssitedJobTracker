import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockState = vi.hoisted(() => {
  const STORES = ['jobs', 'profile', 'documents', 'settings'];
  const stores = new Map<string, { clear: ReturnType<typeof vi.fn> }>();
  const db = {
    transaction: vi.fn(() => db),
    objectStore: vi.fn((name: string) => stores.get(name)),
    done: Promise.resolve(),
  };
  return { db, stores, STORES };
});

vi.mock('../db/database', () => ({
  openDatabase: vi.fn(async () => mockState.db),
  STORE_JOBS: 'jobs',
  STORE_PROFILE: 'profile',
  STORE_DOCUMENTS: 'documents',
  STORE_SETTINGS: 'settings',
}));

import { clearAllData, hasDemoBeenSeeded, markDemoSeeded } from '../features/jobs/jobRepository';

describe('clearAllData', () => {
  beforeEach(() => {
    localStorage.clear();
    mockState.stores.clear();
    for (const name of mockState.STORES) {
      mockState.stores.set(name, { clear: vi.fn() });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('clears every object store', async () => {
    const clearSpies = new Map<string, ReturnType<typeof vi.fn>>();
    for (const name of mockState.STORES) {
      const store = mockState.stores.get(name)!;
      store.clear = vi.fn();
      clearSpies.set(name, store.clear);
    }
    await clearAllData();
    for (const spy of clearSpies.values()) {
      expect(spy).toHaveBeenCalled();
    }
  });

  it('keeps the demo-seeded marker so an empty store is not re-seeded', () => {
    expect(hasDemoBeenSeeded()).toBe(false);
    markDemoSeeded();
    expect(hasDemoBeenSeeded()).toBe(true);
  });
});
