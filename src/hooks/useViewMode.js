import { useCallback, useMemo } from "react";
import { useSettings } from "../context/SettingsContext.jsx";
import { VIEW_MODES, isSimpleViewMode } from "../lib/viewMode.js";

export function useViewMode() {
  const { settings, saveSetting } = useSettings();

  const viewMode = useMemo(() => {
    const stored = settings?.ui?.viewMode;
    return stored === VIEW_MODES.simple ? VIEW_MODES.simple : VIEW_MODES.classic;
  }, [settings?.ui?.viewMode]);

  const isSimpleView = isSimpleViewMode(viewMode);

  const setViewMode = useCallback(
    async nextMode => {
      const normalized =
        nextMode === VIEW_MODES.simple ? VIEW_MODES.simple : VIEW_MODES.classic;
      await saveSetting("ui.viewMode", normalized);
      return normalized;
    },
    [saveSetting]
  );

  return {
    viewMode,
    isSimpleView,
    isClassicView: !isSimpleView,
    setViewMode
  };
}
