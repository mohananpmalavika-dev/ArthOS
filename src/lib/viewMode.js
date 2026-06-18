import {
  Home,
  ClipboardList,
  History,
  MessageCircle,
  Settings,
  LayoutGrid,
  Sparkles,
  Compass
} from "lucide-react";

export const VIEW_MODES = {
  classic: "classic",
  simple: "simple",
  phase_flow: "phase_flow"
};

export const VIEW_MODE_LABELS = {
  [VIEW_MODES.classic]: "Full Experience",
  [VIEW_MODES.simple]: "Simple Guide",
  [VIEW_MODES.phase_flow]: "4-Phase Journey"
};

export const SIMPLE_SHELL_ROUTES = [
  {
    id: "home",
    path: "/dashboard/home",
    label: "My Score",
    icon: Home,
    description: "Your money health at a glance"
  },
  {
    id: "plan",
    path: "/dashboard/plan",
    label: "My Plan",
    icon: ClipboardList,
    description: "Your next step to improve"
  },
  {
    id: "history",
    path: "/dashboard/history",
    label: "Progress",
    icon: History,
    description: "See how you are doing over time"
  },
  {
    id: "coach",
    path: "/coach",
    label: "Help",
    icon: MessageCircle,
    description: "Ask your money coach"
  },
  {
    id: "settings",
    path: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    description: "Account and view preferences"
  }
];

export const PHASE_FLOW_SHELL_ROUTES = [
  {
    id: "discover",
    path: "/dashboard/phase-flow",
    label: "Your Journey",
    icon: Compass,
    description: "4-phase guided experience"
  }
];

export const VIEW_MODE_OPTIONS = [
  {
    id: VIEW_MODES.classic,
    title: "Full Experience",
    subtitle: "All features",
    icon: LayoutGrid,
    description:
      "All dashboards, analytics, digital twin, forecasts, and advanced tools. Best if you like exploring every feature.",
    highlights: ["14+ tools and dashboards", "Digital twin & forecasts", "Advanced analytics"]
  },
  {
    id: VIEW_MODES.simple,
    title: "Simple Guide",
    subtitle: "Streamlined",
    icon: Sparkles,
    description:
      "Just your score, plain explanations, and one clear action. Best for everyday users who want answers fast.",
    highlights: ["4 simple menu items", "Plain language", "One recommended action"]
  },
  {
    id: VIEW_MODES.phase_flow,
    title: "4-Phase Journey",
    subtitle: "Guided path",
    icon: Compass,
    description:
      "Discover → Understand → Optimize → Execute. A clear step-by-step journey from financial snapshot to action plan.",
    highlights: ["Guided 4-phase flow", "Personalized insights", "Clear action steps"]
  }
];

export function isSimpleViewMode(viewMode) {
  return viewMode === VIEW_MODES.simple;
}

export function isPhaseFlowMode(viewMode) {
  return viewMode === VIEW_MODES.phase_flow;
}

export function getNavRoutesForViewMode(viewMode, { isDashboardContext = true } = {}) {
  if (isSimpleViewMode(viewMode)) {
    return SIMPLE_SHELL_ROUTES;
  }
  if (isPhaseFlowMode(viewMode)) {
    return PHASE_FLOW_SHELL_ROUTES;
  }
  if (!isDashboardContext) {
    return null;
  }
  return null;
}
