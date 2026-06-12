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

export class ProviderRegistry {
  constructor() {
    this.providers = [];
    this.providersByType = {};
  }

  register(provider) {
    if (!provider || !provider.type || !provider.id) {
      throw new Error('Provider must have type, id, and name');
    }
    this.providers.push(provider);
    if (!this.providersByType[provider.type]) {
      this.providersByType[provider.type] = [];
    }
    this.providersByType[provider.type].push(provider);
    return provider;
  }

  find(type) {
    return this.providersByType[type] || [];
  }

  findById(id) {
    return this.providers.find((p) => p.id === id);
  }

  findByName(name) {
    return this.providers.filter((p) => p.name?.includes(name));
  }

  getAll() {
    return this.providers;
  }

  getStats() {
    return {
      totalProviders: this.providers.length,
      byType: Object.entries(this.providersByType).reduce((acc, [type, providers]) => {
        acc[type] = providers.length;
        return acc;
      }, {}),
    };
  }
}

export class ArthMarketplace {
  providers = [];

  register(provider) {
    if (!provider || typeof provider.criteria !== 'function') {
      throw new Error('Provider must supply a criteria function');
    }
    this.providers.push(provider);
    return provider;
  }

  recommend(user) {
    return this.providers.filter((p) => p.criteria(user));
  }
}
