import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Activity, Sparkles, ShieldCheck } from 'lucide-react';
import {
  FlowSection,
  FlowCard,
  FlowCardsGrid,
  FlowHighlightCard,
  FlowProgressTracker,
} from '../../src/components/FlowComponents';

describe('FlowComponents', () => {
  it('renders a flow section with title, description, and badge', () => {
    const { container } = render(
      <FlowSection
        id="flow-overview"
        active
        title="Financial Flow"
        description="A guided snapshot of your current health."
        badge="Live"
      >
        <div>Child content</div>
      </FlowSection>
    );

    expect(screen.getByText('Financial Flow')).toBeInTheDocument();
    expect(screen.getByText('A guided snapshot of your current health.')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders flow cards grid with interactive and linked cards', () => {
    const { container } = render(
      <MemoryRouter>
        <FlowCardsGrid>
          <FlowCard
            title="Confidence Score"
            description="Your current financial confidence in one clear snapshot."
            meta="+12% this month"
            icon={Activity}
            href="#confidence"
          />
          <FlowCard
            title="Behavior Signals"
            description="Track the actions that changed your outlook."
            meta="3 active signals"
            icon={Sparkles}
            onClick={() => {}}
          />
          <FlowCard
            title="Resilience Plan"
            description="A recommended next step to strengthen your runway."
            meta="Next review: today"
            icon={ShieldCheck}
          />
        </FlowCardsGrid>
      </MemoryRouter>
    );

    expect(screen.getByText('Confidence Score')).toBeInTheDocument();
    expect(screen.getByText('Behavior Signals')).toBeInTheDocument();
    expect(screen.getByText('Resilience Plan')).toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders a highlight card with CTA and visual', () => {
    const visual = <div style={{ width: 80, height: 80, background: '#0f172a' }} />;
    const { container } = render(
      <FlowHighlightCard
        title="Actionable Insight"
        description="See the one change that most improves your next money move."
        ctaLabel="Review plan"
        onCta={() => {}}
        visual={visual}
      >
        <p>Automated insights connect your spending, saving, and goals.</p>
      </FlowHighlightCard>
    );

    expect(screen.getByText('Actionable Insight')).toBeInTheDocument();
    expect(screen.getByText('Review plan')).toBeInTheDocument();
    expect(screen.getByText(/Automated insights connect your spending/i)).toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders progress tracker with active and completed items', () => {
    const items = [
      { label: 'Collect data', description: 'Connect your accounts and review habits.' },
      { label: 'Score health', description: 'See your financial resilience score.' },
      { label: 'Start plan', description: 'Take action on the highest impact change.' },
    ];
    const { container } = render(<FlowProgressTracker items={items} currentIndex={1} />);

    expect(screen.getByText('Collect data')).toBeInTheDocument();
    expect(screen.getByText('Score health')).toBeInTheDocument();
    expect(screen.getByText('Start plan')).toBeInTheDocument();
    expect(container.firstChild).toMatchSnapshot();
  });
});
