import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary.jsx';

/**
 * withErrorBoundary - Higher-order component to wrap any section with error handling
 * @param {React.Component} Component - Component to wrap
 * @param {string} componentName - Name for error reporting
 */
export function withErrorBoundary(Component, componentName) {
  return (props) => (
    <ErrorBoundary componentName={componentName}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

/**
 * ErrorSection - Component wrapper for major sections with error handling
 */
export function ErrorSection({ children, name }) {
  return (
    <ErrorBoundary componentName={name}>
      <div>{children}</div>
    </ErrorBoundary>
  );
}

export default ErrorSection;
