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
import { isBrowser } from "../lib/app-utils.jsx";

export function useUIState() {
  const [activeHash, setActiveHash] = useState(() =>
    isBrowser() ? window.location.hash || "#" : "#"
  );
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (!isBrowser()) {
      return false;
    }
    return window.localStorage.getItem("arth-os-onboarding-complete") !== "true";
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [paywallFeature, setPaywallFeature] = useState(null);
  const [smsEnrichment, setSmsEnrichment] = useState(null);
  const [showSmsForm, setShowSmsForm] = useState(false);

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
  }, []);

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
    if (isBrowser()) {
      window.localStorage.setItem("arth-os-onboarding-complete", "true");
    }
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    if (isBrowser()) {
      window.localStorage.removeItem("arth-os-onboarding-complete");
    }
    setShowOnboarding(true);
  }, []);

  const toggleSmsForm = useCallback(() => {
    setShowSmsForm(prev => !prev);
  }, []);

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
    toggleSmsForm
  };
}
