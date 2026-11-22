import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  type ActivityCardMode,
  loadExtendedSettings,
  saveExtendedSettings,
} from '@/services/settings.service';
import { AppEvents } from '@/services/storage';

export function useActivityCardMode() {
  const { user } = useAuth();
  const [mode, setModeState] = useState<ActivityCardMode>('full');

  const reload = useCallback(() => {
    loadExtendedSettings(user?.id)
      .then((settings) => {
        setModeState(settings.activityCardMode || 'full');
      })
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    reload();
    const unsub = AppEvents.on('musicpostr:settings-updated', reload);
    return unsub;
  }, [reload]);

  const setMode = useCallback(
    async (next: ActivityCardMode) => {
      setModeState(next);
      const current = await loadExtendedSettings(user?.id);
      await saveExtendedSettings({ ...current, activityCardMode: next }, user?.id);
    },
    [user?.id]
  );

  const toggleMode = useCallback(() => {
    void setMode(mode === 'full' ? 'compact' : 'full');
  }, [mode, setMode]);

  return { mode, setMode, toggleMode };
}
