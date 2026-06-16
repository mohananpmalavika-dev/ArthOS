import React from 'react';
import FlowNavigation from './FlowNavigation';

export default {
  title: 'Components/Flow Navigation',
  component: FlowNavigation,
};

export const DefaultNavigation = {
  render: () => (
    <FlowNavigation
      activeHash="#assessment"
      devMode={false}
      onNavigate={(target) => console.log('Navigate to', target)}
      onToggleDev={() => console.log('Toggle dev')}
    />
  ),
};

export const DeveloperMenuOpen = {
  render: () => (
    <FlowNavigation
      activeHash="#admin"
      devMode={true}
      onNavigate={(target) => console.log('Navigate to', target)}
      onToggleDev={() => console.log('Toggle dev')}
    />
  ),
};
