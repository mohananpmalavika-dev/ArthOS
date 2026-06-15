import {
  Home,
  LineChart,
  CalendarDays,
  Users,
  GitBranch,
  Brain,
  ShieldCheck,
  Target,
  ClipboardList,
  Wallet,
  History,
  Bell,
  Settings,
  Sparkles,
  MessageCircle
} from "lucide-react";

export const OS_SHELL_ROUTES = [
  {
    id: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    icon: Home,
    description: "Your OS home base"
  },
  {
    id: "insights",
    path: "/dashboard/insights",
    label: "Insights",
    icon: LineChart,
    description: "Analytics and behavior trends"
  },
  {
    id: "forecast",
    path: "/dashboard/forecast",
    label: "Forecast",
    icon: CalendarDays,
    description: "Weather and scenario forecasting"
  },
  {
    id: "cohorts",
    path: "/dashboard/cohorts",
    label: "Peer cohorts",
    icon: Users,
    description: "Retention and peer comparison"
  },
  {
    id: "decisions",
    path: "/dashboard/decisions",
    label: "Decision quality",
    icon: GitBranch,
    description: "Decision history and simulation"
  },
  {
    id: "learning",
    path: "/dashboard/learning",
    label: "Learning",
    icon: Brain,
    description: "Longitudinal learning journey"
  },
  {
    id: "twin",
    path: "/dashboard/twin",
    label: "Digital Twin",
    icon: ShieldCheck,
    description: "Your future financial twin"
  },
  {
    id: "future-you",
    path: "/future-you",
    label: "Future You",
    icon: Target,
    description: "Future self preview"
  },
  {
    id: "plan",
    path: "/dashboard/plan",
    label: "Plan",
    icon: ClipboardList,
    description: "Action planning and coaching"
  },
  {
    id: "accounts",
    path: "/dashboard/accounts",
    label: "Accounts",
    icon: Wallet,
    description: "Banking connections and feeds"
  },
  {
    id: "history",
    path: "/dashboard/history",
    label: "History",
    icon: History,
    description: "Score and timeline history"
  },
  {
    id: "notifications",
    path: "/dashboard/notifications",
    label: "Notifications",
    icon: Bell,
    description: "Alerts and milestone updates"
  },
  {
    id: "settings",
    path: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
    description: "Preferences and account settings"
  },
  {
    id: "advanced",
    path: "/advanced",
    label: "Advanced Analytics",
    icon: Sparkles,
    description: "Deep analytics hub"
  }
];

export const STORY_NAV_ITEMS = [
  {
    id: "assessment",
    path: "/dashboard",
    hash: "#assessment",
    label: "Assessment",
    icon: ClipboardList,
    description: "Financial health quiz"
  },
  {
    id: "big-reveal",
    path: "/big-reveal",
    label: "Big Reveal",
    icon: Sparkles,
    description: "Cinematic score reveal"
  },
  {
    id: "reality",
    hash: "#reality",
    label: "Reality",
    icon: Home,
    description: "Where am I?"
  },
  {
    id: "mind",
    hash: "#mind",
    label: "Why",
    icon: Brain,
    description: "Why am I here?"
  },
  {
    id: "future",
    hash: "#future",
    label: "Future",
    icon: Target,
    description: "What happens next?"
  },
  {
    id: "future-you",
    path: "/future-you",
    label: "Future You",
    icon: Target,
    description: "Future You preview"
  },
  {
    id: "action",
    hash: "#action",
    label: "Actions",
    icon: GitBranch,
    description: "What should I do?"
  },
  {
    id: "coach",
    hash: "#coach",
    label: "Coach",
    icon: MessageCircle,
    description: "Help me execute"
  }
];

export const DEV_NAV_ITEMS = [
  {
    id: "b2b",
    hash: "#b2b",
    label: "Partners",
    icon: Users,
    description: "B2B portal"
  },
  {
    id: "developer-intelligence",
    hash: "#intelligence",
    aliases: ["#predictions"],
    label: "Advanced Intelligence",
    icon: LineChart,
    description: "Understand your financial engines"
  },
  {
    id: "admin",
    hash: "#admin",
    label: "Admin",
    icon: ShieldCheck,
    description: "Operations console"
  }
];
