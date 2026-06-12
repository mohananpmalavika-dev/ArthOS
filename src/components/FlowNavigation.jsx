import React, { useMemo } from 'react';
import {
  Home,
  ClipboardList,
  BarChart3,
  Brain,
  Target,
  Users,
  Settings,
} from 'lucide-react';

export default function FlowNavigation({ activeHash, onNavigate }) {
  const navItems = useMemo(() => [
    {
      id: 'home',
      hash: '#home',
      label: 'Home',
      icon: Home,
      description: 'Dashboard & Overview',
    },
    {
      id: 'assessment',
      hash: '#assessment',
      label: 'Assessment',
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
      id: 'b2b',
      hash: '#b2b',
      label: 'Partners',
      icon: Users,
      description: 'B2B Portal',
    },
  ], []);

  const isActive = (hash) => {
    const currentHash = activeHash || '#home';
    return currentHash === hash;
  };

  const handleNavClick = (hash) => {
    if (onNavigate) {
      onNavigate(hash);
    } else {
      window.location.hash = hash;
    }
  };

  return (
    <div className="app-nav-tabs">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.hash);
        
        return (
          <button
            key={item.id}
            className={`app-nav-tab ${active ? 'active' : ''}`}
            onClick={() => handleNavClick(item.hash)}
            title={item.description}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
