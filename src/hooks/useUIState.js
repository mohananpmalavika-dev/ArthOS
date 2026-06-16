/**
 * useUIState Hook
 * Centralizes UI-related state for navigation and authentication UI
 * - Active route/hash
 * - Onboarding status
 * - Auth modal
 * - Feature gating (paywall)
 * - SMS enrichment UI
 */

import { useState, useEffect, useCallback, startTransition } from "react";
import { useSettings } from "../context/SettingsContext.jsx";
import { isBrowser } from "../lib/app-utils.jsx";

export function useUIState() {
  const { settings, saveSetting } = useSettings();
  const [activeHash, setActiveHash] = useState(() =>
    isBrowser() ? window.location.hash || "#" : "#"
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [paywallFeature, setPaywallFeature] = useState(null);
  const [smsEnrichment, setSmsEnrichment] = useState(null);
  const [showSmsForm, setShowSmsForm] = useState(false);
  const [devMode, setDevMode] = useState(() => settings?.ui?.devMode ?? false);
  const [showOnboarding, setShowOnboarding] = useState(() =>
    settings?.onboarding?.complete === true ? false : true
  );

  useEffect(() => {
    if (settings?.ui?.devMode !== undefined) {
      setDevMode(settings.ui.devMode);
    }
    if (settings?.onboarding?.complete !== undefined) {
      setShowOnboarding(settings.onboarding.complete === true ? false : true);
    }
  }, [settings]);

  // Listen to hash changes
  useEffect(() => {
    const handleHashChange = () => {
      startTransition(() => {
        setActiveHash(window.location.hash || "#");
      });
    };

    if (isBrowser()) {
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, [settings]);

  const navigateTo = useCallback(hash => {
    if (isBrowser()) {
      window.location.hash = hash;
    }
    setActiveHash(hash);
  }, []);

  const openAuthModal = useCallback((mode = "login") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    saveSetting("onboarding.complete", true);
    setShowOnboarding(false);
  }, [saveSetting]);

  const resetOnboarding = useCallback(() => {
    saveSetting("onboarding.complete", false);
    setShowOnboarding(true);
  }, [saveSetting]);

  const toggleSmsForm = useCallback(() => {
    setShowSmsForm(prev => !prev);
  }, []);

  const toggleDevMode = useCallback(() => {
    setDevMode(prev => {
      const next = !prev;
      saveSetting("ui.devMode", next);
      return next;
    });
  }, [saveSetting]);

  return {
    // State
    activeHash,
    setActiveHash,
    showOnboarding,
    setShowOnboarding,
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    paywallFeature,
    setPaywallFeature,
    smsEnrichment,
    setSmsEnrichment,
    showSmsForm,
    setShowSmsForm,
    // Methods
    navigateTo,
    openAuthModal,
    closeAuthModal,
    completeOnboarding,
    resetOnboarding,
    toggleSmsForm,
    devMode,
    toggleDevMode
  };
}
