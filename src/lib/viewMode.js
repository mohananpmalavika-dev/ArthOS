import {
  Home,
  ClipboardList,
  History,
  MessageCircle,
  Settings,
  LayoutGrid,
  Sparkles,
  Compass,
  BookOpen
} from "lucide-react";

export const VIEW_MODES = {
  classic: "classic",
  simple: "simple",
  phase_flow: "phase_flow",
  story_flow: "story_flow"
};

export const VIEW_MODE_LABELS = {
  [VIEW_MODES.classic]: "Full Experience",
  [VIEW_MODES.simple]: "Simple Guide",
  [VIEW_MODES.phase_flow]: "4-Phase Journey",
  [VIEW_MODES.story_flow]: "Story Flow"
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

export const STORY_FLOW_SHELL_ROUTES = [
  {
    id: "reality",
    path: "/reality",
    label: "Reality Check",
    icon: BookOpen,
    description: "Where you stand right now"
  },
  {
    id: "why",
    path: "/why",
    label: "Your Money Habits",
    icon: MessageCircle,
    description: "How and why you spend money"
  },
  {
    id: "future",
    path: "/future",
    label: "What Could Happen",
    icon: Compass,
    description: "Your money possibilities"
  },
  {
    id: "future-you",
    path: "/future-you",
    label: "Better Version of You",
    icon: Sparkles,
    description: "A stronger money future"
  },
  {
    id: "action",
    path: "/action",
    label: "Next Best Move",
    icon: ClipboardList,
    description: "One recommended action"
  },
  {
    id: "coach",
    path: "/coach",
    label: "Coach",
    icon: MessageCircle,
    description: "Your financial coach"
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
  },
  {
    id: VIEW_MODES.story_flow,
    title: "Story Flow",
    subtitle: "Narrative experience",
    icon: BookOpen,
    description:
      "Experience your financial story: Reality → Why → Future → Forecast → Action → Coach. A narrative journey through insights and guidance.",
    highlights: ["6-step story arc", "Behavior insights", "Personal coach integration"]
  }
];

export function isSimpleViewMode(viewMode) {
  return viewMode === VIEW_MODES.simple;
}

export function isPhaseFlowMode(viewMode) {
  return viewMode === VIEW_MODES.phase_flow;
}

export function isStoryFlowMode(viewMode) {
  return viewMode === VIEW_MODES.story_flow;
}

export function getNavRoutesForViewMode(viewMode, { isDashboardContext = true } = {}) {
  if (isSimpleViewMode(viewMode)) {
    return SIMPLE_SHELL_ROUTES;
  }
  if (isPhaseFlowMode(viewMode)) {
    return PHASE_FLOW_SHELL_ROUTES;
  }
  if (isStoryFlowMode(viewMode)) {
    return STORY_FLOW_SHELL_ROUTES;
  }
  if (!isDashboardContext) {
    return null;
  }
  return null;
}
