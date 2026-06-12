export class ProviderMarketplace {
  constructor() {
    this.providers = [];
  }

  register(provider) {
    if (!provider || !provider.id || !provider.name || typeof provider.match !== 'function') {
      throw new Error('Provider must include id, name, and match()');
    }
    this.providers.push(provider);
    return provider;
  }

  recommend(userProfile = {}) {
    return this.providers.filter((provider) => provider.match(userProfile));
  }
}

export function createDefaultProviderMarketplace() {
  const marketplace = new ProviderMarketplace();

  marketplace.register({
    id: 'smart-savings',
    name: 'Smart Savings Advisor',
    match: (profile) => Number(profile.monthlyIncome || profile.annualIncome || 0) > 0,
  });

  marketplace.register({
    id: 'resilience-hub',
    name: 'Income Resilience Hub',
    match: (profile) => Number(profile.monthlyExpense || profile.monthlySpending || 0) > Number(profile.savings || profile.emergencySavings || 0),
  });

  marketplace.register({
    id: 'home-loan-optimizer',
    name: 'Home Loan Optimizer',
    match: (profile) => Boolean(profile.homeLoanEmi || profile.homeLoanIntent || profile.homeowner),
  });

  return marketplace;
}
