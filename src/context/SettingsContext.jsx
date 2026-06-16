import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useUserPreferences } from "../hooks/useUserInputData.js";
import {
  loadUnifiedSettings,
  saveUnifiedSettings,
  flattenSettings,
  setUnifiedSetting,
  mergeDeep
} from "../lib/settingsManager.js";

function flattenPreferencePayload(path, value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [[path, value]];
  }

  const entries = [];
  for (const key of Object.keys(value)) {
    const nextPath = path ? `${path}.${key}` : key;
    entries.push(...flattenPreferencePayload(nextPath, value[key]));
  }
  return entries;
}


const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const { savePreference } = useUserPreferences();
  const [settings, setSettingsState] = useState(() => loadUnifiedSettings(user?.id));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [didInitialSync, setDidInitialSync] = useState(false);

  useEffect(() => {
    setSettingsState(loadUnifiedSettings(user?.id));
    setLoading(false);
  }, [user?.id]);

  const persistSettings = useCallback(
    (nextSettings) => {
      saveUnifiedSettings(nextSettings, user?.id);
      setSettingsState(nextSettings);
      return nextSettings;
    },
    [user?.id]
  );

  const setSetting = useCallback(
    (path, value) => {
      const next = setUnifiedSetting(path, value, user?.id);
      setSettingsState(next);
      return next;
    },
    [user?.id]
  );

  const updateSettings = useCallback(
    (patch) => {
      if (!patch || typeof patch !== "object") {
        return settings;
      }
      const next = mergeDeep(settings, patch);
      persistSettings(next);
      return next;
    },
    [settings, persistSettings]
  );

  const saveSetting = useCallback(
    async (path, value, options = {}) => {
      const next = setSetting(path, value);
      if (options.syncRemote !== false && isAuthenticated && token) {
        try {
          const preferences = flattenPreferencePayload(path, value);
          await Promise.all(
            preferences.map(([key, leafValue]) => savePreference(key, leafValue))
          );
        } catch (err) {
          setError(err?.message || "Failed to sync setting");
        }
      }
      return next;
    },
    [isAuthenticated, savePreference, setSetting, token]
  );

  const syncSettings = useCallback(
    async () => {
      if (!isAuthenticated || !token) {
        return false;
      }
      const items = flattenSettings(settings);
      try {
        await Promise.all(
          items.map(([key, value]) => savePreference(key, value))
        );
        return true;
      } catch (err) {
        setError(err?.message || "Failed to sync settings");
        return false;
      }
    },
    [isAuthenticated, savePreference, settings, token]
  );

  useEffect(() => {
    if (!isAuthenticated || authLoading || didInitialSync || !token) {
      return;
    }
    syncSettings()
      .catch(() => {})
      .finally(() => setDidInitialSync(true));
  }, [authLoading, didInitialSync, isAuthenticated, syncSettings, token]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      setSetting,
      updateSettings,
      saveSetting,
      syncSettings,
      persistSettings
    }),
    [settings, loading, error, setSetting, updateSettings, saveSetting, syncSettings, persistSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}

export default SettingsContext;
