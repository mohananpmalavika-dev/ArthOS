import React from 'react';
import FlowNavigation from './FlowNavigation';

export default {
  title: 'Components/Flow Navigation',
  component: FlowNavigation,
};

export const DefaultNavigation = {
  render: () => (
    <FlowNavigation
      devMode={false}
      onNavigate={(target) => console.log('Navigate to', target)}
      onToggleDev={() => console.log('Toggle dev')}
    />
  ),
};

export const DeveloperMenuOpen = {
  render: () => (
    <FlowNavigation
      devMode={true}
      onNavigate={(target) => console.log('Navigate to', target)}
      onToggleDev={() => console.log('Toggle dev')}
    />
  ),
};
