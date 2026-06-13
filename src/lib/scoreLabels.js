export const healthBandThresholds = [
  { max: 19, label: "Financially Critical", tone: "critical" },
  { max: 39, label: "Financially Fragile", tone: "warning" },
  { max: 59, label: "Financially Developing", tone: "caution" },
  { max: 79, label: "Financially Resilient", tone: "steady" },
  { max: Infinity, label: "Financially Sovereign", tone: "strong" }
];

export function getHealthBand(score) {
  return (
    healthBandThresholds.find(band => score <= band.max) ||
    healthBandThresholds[healthBandThresholds.length - 1]
  );
}

export const survivalBandThresholds = [
  { max: 1, label: "Immediate risk", tone: "critical" },
  { max: 3, label: "Fragile cushion", tone: "warning" },
  { max: 6, label: "Improving stability", tone: "steady" },
  { max: 12, label: "Strong buffer", tone: "strong" },
  { max: Infinity, label: "Highly resilient", tone: "strong" }
];

export function getSurvivalBand(months) {
  return (
    survivalBandThresholds.find(band => months <= band.max) ||
    survivalBandThresholds[survivalBandThresholds.length - 1]
  );
}

export const behaviourBandThresholds = [
  { max: 13, label: "Critical behaviour risk" },
  { max: 26, label: "Needs behaviour correction" },
  { max: 34, label: "Mostly controlled" },
  { max: Infinity, label: "Strong financial discipline" }
];

export function getBehaviourBand(score) {
  return (
    behaviourBandThresholds.find(band => score <= band.max)?.label ||
    behaviourBandThresholds[behaviourBandThresholds.length - 1].label
  );
}

export const awarenessBandThresholds = [
  { max: 9, label: "Low visibility" },
  { max: 19, label: "Basic awareness" },
  { max: 24, label: "Solid tracking" },
  { max: Infinity, label: "High clarity" }
];

export function getAwarenessBand(score) {
  return (
    awarenessBandThresholds.find(band => score <= band.max)?.label ||
    awarenessBandThresholds[awarenessBandThresholds.length - 1].label
  );
}

export const stabilityBandThresholds = [
  { max: 9, label: "Fragile stability" },
  { max: 19, label: "Some cushion" },
  { max: 24, label: "Resilient" },
  { max: Infinity, label: "Very stable" }
];

export function getStabilityBand(score) {
  return (
    stabilityBandThresholds.find(band => score <= band.max)?.label ||
    stabilityBandThresholds[stabilityBandThresholds.length - 1].label
  );
}
