import { useCallback, useMemo } from "react";
import { useSettings } from "../context/SettingsContext.jsx";
import { VIEW_MODES, isSimpleViewMode } from "../lib/viewMode.js";

export function useViewMode() {
  const { settings, saveSetting } = useSettings();

  const viewMode = useMemo(() => {
    const stored = settings?.ui?.viewMode;
    // Support all view modes: simple, phase_flow, story_flow, or default to classic
    if (stored === VIEW_MODES.simple || stored === VIEW_MODES.phase_flow || stored === VIEW_MODES.story_flow) {
      return stored;
    }
    return VIEW_MODES.classic;
  }, [settings?.ui?.viewMode]);

  const isSimpleView = isSimpleViewMode(viewMode);

  const setViewMode = useCallback(
    async nextMode => {
      // Save the mode as-is if it's a valid mode
      const valid = [VIEW_MODES.classic, VIEW_MODES.simple, VIEW_MODES.phase_flow, VIEW_MODES.story_flow];
      const normalized = valid.includes(nextMode) ? nextMode : VIEW_MODES.classic;
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
