export const integrations = {
  banks: [],
  lenders: [],
  insurers: [],
  investments: [],
};

export function registerProvider(type, provider) {
  if (!integrations[type]) {
    throw new Error(`Unknown provider type: ${type}`);
  }
  integrations[type].push(provider);
  return provider;
}
