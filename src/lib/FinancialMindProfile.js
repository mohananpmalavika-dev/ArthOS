export class FinancialMindProfile {
  constructor(user = {}) {
    this.beliefs = user.beliefs || [];
    this.biases = user.biases || {};
    this.emotionalTriggers = user.emotionalTriggers || {};
    this.decisionPatterns = user.decisionPatterns || [];
    this.goals = user.goals || [];
    this.riskProfile = user.riskProfile || {};
    this.metadata = {
      createdAt: new Date().toISOString(),
      userId: user.userId || "anonymous",
      version: "1.0"
    };
  }

  addBelief(belief) {
    if (belief && !this.beliefs.includes(belief)) {
      this.beliefs.push(belief);
    }
  }

  updateBiases(biases) {
    this.biases = { ...this.biases, ...biases };
  }

  updateEmotionalTriggers(triggers) {
    this.emotionalTriggers = { ...this.emotionalTriggers, ...triggers };
  }

  recordDecisionPattern(pattern) {
    if (pattern) {
      this.decisionPatterns.push({
        ...pattern,
        recordedAt: new Date().toISOString()
      });
    }
  }

  setGoals(goals) {
    this.goals = goals;
  }

  serialize() {
    return {
      beliefs: this.beliefs,
      biases: this.biases,
      emotionalTriggers: this.emotionalTriggers,
      decisionPatterns: this.decisionPatterns,
      goals: this.goals,
      riskProfile: this.riskProfile,
      metadata: this.metadata
    };
  }

  getSummary() {
    return {
      beliefCount: this.beliefs.length,
      biasCount: Object.keys(this.biases).length,
      triggerCount: Object.keys(this.emotionalTriggers).length,
      patternCount: this.decisionPatterns.length,
      dominantBeliefs: this.beliefs.slice(0, 3),
      highestBias: Object.entries(this.biases).sort((a, b) => b[1] - a[1])[0]?.[0],
      highestTrigger: Object.entries(this.emotionalTriggers).sort((a, b) => b[1] - a[1])[0]?.[0]
    };
  }
}
