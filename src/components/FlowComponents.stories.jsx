import React from 'react';
import { Activity, Sparkles, ShieldCheck } from 'lucide-react';
import {
  FlowSection,
  FlowCard,
  FlowCardsGrid,
  FlowHighlightCard,
  FlowProgressTracker,
} from './FlowComponents';

export default {
  title: 'Components/Flow Components',
  component: FlowSection,
};

const flowCards = (
    <FlowCardsGrid>
    <FlowCard
      title="Confidence Score"
      description="Your current financial confidence in one clear snapshot."
      meta="+12% this month"
      icon={Activity}
      onClick={() => console.log('Navigate to confidence (story)')}
    />
    <FlowCard
      title="Behavior Signals"
      description="Track the actions that changed your outlook."
      meta="3 active signals"
      icon={Sparkles}
      onClick={() => {
        console.log('Behavior card clicked');
      }}
    />
    <FlowCard
      title="Resilience Plan"
      description="A recommended next step to strengthen your runway."
      meta="Next review: today"
      icon={ShieldCheck}
    />
  </FlowCardsGrid>
);

export const SectionWithCards = {
  render: () => (
    <FlowSection
      id="flow-overview"
      active
      title="Financial Flow"
      description="A guided snapshot of your current health, habit signals, and opportunities."
      badge="Live"
    >
      {flowCards}
    </FlowSection>
  ),
};

export const HighlightedFlow = {
  render: () => (
    <FlowHighlightCard
      title="Actionable Insight"
      description="See the one change that most improves your next money move."
      ctaLabel="Review plan"
      onCta={() => console.log('Review plan clicked')}
      visual={<div style={{ width: 120, height: 120, background: '#0f172a', borderRadius: 20 }} />}
    >
      <p>Automated insights connect your spending, saving, and goals in one card.</p>
    </FlowHighlightCard>
  ),
};

export const ProgressTrackerExample = {
  render: () => (
    <FlowProgressTracker
      items={[
        { label: 'Collect data', description: 'Connect your accounts and review habits.' },
        { label: 'Score health', description: 'See your financial resilience score.' },
        { label: 'Start plan', description: 'Take action on the highest impact change.' },
      ]}
      currentIndex={1}
    />
  ),
};
