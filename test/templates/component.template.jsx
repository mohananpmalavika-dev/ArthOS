/**
 * test/templates/component.template.jsx
 * Template for writing React component tests
 * 
 * USAGE:
 * 1. Copy this file to src/components/__tests__/MyComponent.test.jsx
 * 2. Replace 'MyComponent' with actual component name
 * 3. Update props, selectors, and interactions
 * 4. Run: npm test -- MyComponent.test.jsx
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  const defaultProps = {
    title: 'Test Title',
    onAction: vi.fn(),
    data: { id: '123', value: 'test' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<MyComponent {...defaultProps} />);
      expect(container).toBeDefined();
    });

    it('should render with required props', () => {
      render(<MyComponent {...defaultProps} />);
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <MyComponent {...defaultProps} className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should apply default styles', () => {
      const { container } = render(<MyComponent {...defaultProps} />);
      const element = container.firstChild;
      expect(element).toHaveClass('my-component');
    });
  });

  // ============================================================================
  // PROP VALIDATION (PropTypes)
  // ============================================================================

  describe('PropTypes validation', () => {
    it('should accept valid props', () => {
      const { container } = render(<MyComponent {...defaultProps} />);
      expect(container).toBeDefined();
    });

    it('should work with required prop missing (check console.error)', () => {
      const { title, ...propsWithoutTitle } = defaultProps;
      const spy = vi.spyOn(console, 'error');
      
      render(<MyComponent {...propsWithoutTitle} />);
      
      // PropTypes should log a warning
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Failed prop type')
      );
      
      spy.mockRestore();
    });

    it('should use default props when not provided', () => {
      render(<MyComponent onAction={vi.fn()} />);
      // Check component renders with defaults
      expect(screen.getByRole('button', { name: /default label/i })).toBeInTheDocument();
    });
  });

  // ============================================================================
  // USER INTERACTIONS
  // ============================================================================

  describe('user interactions', () => {
    it('should handle button click', () => {
      const mockFn = vi.fn();
      render(<MyComponent {...defaultProps} onAction={mockFn} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle form input', async () => {
      render(<MyComponent {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'hello');

      expect(input.value).toBe('hello');
    });

    it('should handle form submission', async () => {
      const mockFn = vi.fn();
      render(<MyComponent {...defaultProps} onSubmit={mockFn} />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      expect(mockFn).toHaveBeenCalled();
    });

    it('should toggle visibility on click', () => {
      render(<MyComponent {...defaultProps} />);

      const toggleButton = screen.getByRole('button', { name: /toggle/i });
      
      // Initially hidden
      expect(screen.queryByText(/hidden content/i)).not.toBeInTheDocument();

      fireEvent.click(toggleButton);

      // Now visible
      expect(screen.getByText(/hidden content/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // STATE & BEHAVIOR
  // ============================================================================

  describe('state and behavior', () => {
    it('should update on prop change', () => {
      const { rerender } = render(
        <MyComponent {...defaultProps} title="Original" />
      );
      expect(screen.getByText('Original')).toBeInTheDocument();

      rerender(<MyComponent {...defaultProps} title="Updated" />);
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('should handle loading state', async () => {
      render(<MyComponent {...defaultProps} loading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      render(<MyComponent {...defaultProps} error="Something went wrong" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle empty state', () => {
      render(<MyComponent {...defaultProps} items={[]} />);

      expect(screen.getByText('No items')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ASYNC BEHAVIOR
  // ============================================================================

  describe('async behavior', () => {
    it('should handle async data loading', async () => {
      render(<MyComponent {...defaultProps} />);

      // Initially loading
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Data should now be displayed
      expect(screen.getByText(/data loaded/i)).toBeInTheDocument();
    });

    it('should handle API errors', async () => {
      render(<MyComponent {...defaultProps} apiError={true} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // CONDITIONAL RENDERING
  // ============================================================================

  describe('conditional rendering', () => {
    it('should render when condition is true', () => {
      render(<MyComponent {...defaultProps} visible={true} />);
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    });

    it('should not render when condition is false', () => {
      render(<MyComponent {...defaultProps} visible={false} />);
      expect(screen.queryByText(defaultProps.title)).not.toBeInTheDocument();
    });

    it('should show error boundary on error', () => {
      const { container } = render(
        <MyComponent {...defaultProps} shouldThrow={true} />
      );
      expect(container.querySelector('.error-boundary')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MyComponent {...defaultProps} />);
      const button = screen.getByRole('button', { name: /action/i });
      expect(button).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      render(<MyComponent {...defaultProps} />);
      const button = screen.getByRole('button');

      // Tab to button
      await userEvent.tab();
      expect(button).toHaveFocus();

      // Press Enter
      await userEvent.keyboard('{Enter}');
      expect(defaultProps.onAction).toHaveBeenCalled();
    });

    it('should have semantic HTML', () => {
      const { container } = render(<MyComponent {...defaultProps} />);
      const mainSection = container.querySelector('main');
      expect(mainSection).toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('integration', () => {
    it('should work with parent component', () => {
      const ParentComponent = () => (
        <div>
          <MyComponent {...defaultProps} />
        </div>
      );

      render(<ParentComponent />);
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    });

    it('should communicate with parent via callbacks', async () => {
      const mockFn = vi.fn();
      render(<MyComponent {...defaultProps} onAction={mockFn} />);

      const button = screen.getByRole('button');
      await userEvent.click(button);

      expect(mockFn).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SNAPSHOT TESTS
  // ============================================================================

  describe('snapshots', () => {
    it('should match snapshot with default props', () => {
      const { container } = render(<MyComponent {...defaultProps} />);
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should match snapshot with loading state', () => {
      const { container } = render(
        <MyComponent {...defaultProps} loading={true} />
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
