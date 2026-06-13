import React, { useMemo } from 'react';
import {
  Home,
  ClipboardList,
  BarChart3,
  Brain,
  Target,
  Users,
  GitBranch,
  History,
  LineChart,
  ShieldCheck,
} from 'lucide-react';

export default function FlowNavigation({ activeHash, onNavigate }) {
  const navItems = useMemo(() => [
    {
      id: 'home',
      hash: '#home',
      label: 'Home',
      icon: Home,
      description: 'Dashboard & Overview',
      aliases: ['#intelligence'],
    },
    {
      id: 'assessment',
      hash: '#assessment',
      label: 'Assess',
      icon: ClipboardList,
      description: 'Financial Health Quiz',
    },
    {
      id: 'reports',
      hash: '#reports',
      label: 'Reports',
      icon: BarChart3,
      description: 'Analytics & Insights',
    },
    {
      id: 'cognition',
      hash: '#cognition',
      label: 'Cognition',
      icon: Brain,
      description: 'Decision Patterns',
    },
    {
      id: 'simulator',
      hash: '#simulator',
      label: 'Simulator',
      icon: Target,
      description: 'What-If Scenarios',
    },
    {
      id: 'decisions',
      hash: '#decisions',
      label: 'Decisions',
      icon: GitBranch,
      description: 'Decision Ledger',
    },
    {
      id: 'memory',
      hash: '#memory',
      label: 'Memory',
      icon: History,
      description: 'Timeline & History',
      aliases: ['#history'],
    },
    {
      id: 'b2b',
      hash: '#b2b',
      label: 'Partners',
      icon: Users,
      description: 'B2B Portal',
    },
    {
      id: 'predictions',
      hash: '#predictions',
      label: 'Predictions',
      icon: LineChart,
      description: 'Longitudinal Forecasting',
    },
    {
      id: 'admin',
      hash: '#admin',
      label: 'Admin',
      icon: ShieldCheck,
      description: 'Operations Console',
    },
  ], []);

  const isActive = (hash) => {
    const currentHash = activeHash || '#home';
    const item = navItems.find((navItem) => navItem.hash === hash);
    return currentHash === hash || item?.aliases?.includes(currentHash);
  };

  const handleNavClick = (hash) => {
    if (onNavigate) {
      onNavigate(hash);
    } else {
      window.location.hash = hash;
    }
  };

  return (
    <nav className="app-nav-tabs" aria-label="Product flow navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.hash);
        
        return (
          <button
            key={item.id}
            className={`app-nav-tab ${active ? 'active' : ''}`}
            onClick={() => handleNavClick(item.hash)}
            title={item.description}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="app-nav-tab-label">{item.label}</span>
            <small>{item.description}</small>
          </button>
        );
      })}
    </nav>
  );
}
