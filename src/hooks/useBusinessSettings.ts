import { useCallback, useEffect, useState } from 'react';
import { businessSettingsService } from '../services/businessSettingsService';
import { publicProfileService } from '../services/publicProfileService';
import type { BusinessSettings } from '../types';

export function useBusinessSettings(autoLoad = true) {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await businessSettingsService.getSettings();
      setSettings(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading settings');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (partial: Partial<BusinessSettings>) => {
    const saved = await businessSettingsService.saveSettings(partial);
    setSettings(saved);
    return saved;
  }, []);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  return { settings, setSettings, loading, error, load, save };
}

export async function loadPublicBusinessSettings(token: string) {
  return publicProfileService.getByToken(token);
}
