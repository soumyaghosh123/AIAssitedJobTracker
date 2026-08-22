import { useCallback, useEffect, useState } from 'react';
import type { Profile, ProfileInput } from '../types';
import { getProfile, saveProfile } from '../features/profile/profileService';

export interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  update: (input: ProfileInput) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const next = await getProfile();
      setProfile(next);
    } catch (e) {
      setError('Could not load your profile.');
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const next = await getProfile();
        if (!cancelled) setProfile(next);
      } catch (e) {
        if (!cancelled) {
          setError('Could not load your profile.');
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (input: ProfileInput) => {
    try {
      const saved = await saveProfile(input);
      setProfile(saved);
      return true;
    } catch (e) {
      setError('Could not save your profile.');
      console.error(e);
      return false;
    }
  }, []);

  return { profile, loading, error, update, refresh };
}
