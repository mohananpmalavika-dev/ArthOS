export const healthBandThresholds = [
  { max: 19, label: "In Crisis", tone: "critical" },
  { max: 39, label: "Unstable", tone: "warning" },
  { max: 59, label: "Improving", tone: "caution" },
  { max: 79, label: "Resilient", tone: "steady" },
  { max: Infinity, label: "Strong", tone: "strong" }
];

export function getHealthBand(score) {
  return (
    healthBandThresholds.find(band => score <= band.max) ||
    healthBandThresholds[healthBandThresholds.length - 1]
  );
}

export const survivalBandThresholds = [
  { max: 1, label: "Urgent", tone: "critical" },
  { max: 3, label: "Tight", tone: "warning" },
  { max: 6, label: "Getting Better", tone: "steady" },
  { max: 12, label: "Strong", tone: "strong" },
  { max: Infinity, label: "Very Strong", tone: "strong" }
];

export function getSurvivalBand(months) {
  return (
    survivalBandThresholds.find(band => months <= band.max) ||
    survivalBandThresholds[survivalBandThresholds.length - 1]
  );
}

export const behaviourBandThresholds = [
  { max: 13, label: "Big Issues" },
  { max: 26, label: "Needs Changes" },
  { max: 34, label: "Mostly Okay" },
  { max: Infinity, label: "Very Good" }
];

export function getBehaviourBand(score) {
  return (
    behaviourBandThresholds.find(band => score <= band.max)?.label ||
    behaviourBandThresholds[behaviourBandThresholds.length - 1].label
  );
}

export const awarenessBandThresholds = [
  { max: 9, label: "Low" },
  { max: 19, label: "Basic" },
  { max: 24, label: "Good" },
  { max: Infinity, label: "High" }
];

export function getAwarenessBand(score) {
  return (
    awarenessBandThresholds.find(band => score <= band.max)?.label ||
    awarenessBandThresholds[awarenessBandThresholds.length - 1].label
  );
}

export const stabilityBandThresholds = [
  { max: 9, label: "Shaky" },
  { max: 19, label: "Some Safety" },
  { max: 24, label: "Resilient" },
  { max: Infinity, label: "Very Stable" }
];

export function getStabilityBand(score) {
  return (
    stabilityBandThresholds.find(band => score <= band.max)?.label ||
    stabilityBandThresholds[stabilityBandThresholds.length - 1].label
  );
}
