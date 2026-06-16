import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import FlowNavigation from '../../src/components/FlowNavigation';

describe('FlowNavigation', () => {
  it('renders the main navigation tabs and developer toggle', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <FlowNavigation
          activeHash="#assessment"
          devMode={false}
          onNavigate={vi.fn()}
          onToggleDev={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('navigation', { name: /financial cognition journey/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dev/i })).toBeInTheDocument();
  });

  it('opens the developer menu when dev toggle is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <FlowNavigation
          activeHash="#admin"
          devMode={true}
          onNavigate={vi.fn()}
          onToggleDev={vi.fn()}
        />
      </MemoryRouter>
    );

    const devToggle = screen.getByRole('button', { name: /dev/i });
    await userEvent.click(devToggle);

    expect(screen.getByText(/intelligence & administration/i)).toBeInTheDocument();
    expect(screen.getByText(/advanced intelligence/i)).toBeInTheDocument();
  });

  it('matches snapshot with default navigation state', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <FlowNavigation
          activeHash="#assessment"
          devMode={false}
          onNavigate={vi.fn()}
          onToggleDev={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
