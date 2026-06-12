/**
 * Cognition Graph Engine
 * 
 * Core intelligence for building and querying the financial knowledge graph.
 * Implements Belief → Decision → Outcome mapping and relationship analysis.
 * 
 * Key Functions:
 * - extractBeliefs() - Extract beliefs from responses and behaviors
 * - detectBiases() - Identify cognitive biases
 * - buildBeliefGraph() - Create graph structure
 * - mapDecisionToOutcome() - Track decision execution and outcomes
 * - getBeliefsInfluencingDecision() - Trace causal chain
 * - getBeliefNetwork() - Return full cognition graph
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class CognitionGraphEngine {
  /**
   * Extract financial beliefs from assessment responses and transaction patterns
   * Analyzes: assessments, transactions, behavioral patterns, self-reported values
   */
  static async extractBeliefs(userId) {
    try {
      const beliefs = [];

      // Fetch assessment responses
      const { data: assessments } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (assessments && assessments.length > 0) {
        // Extract explicit beliefs from assessment responses
        const explicitBeliefs = await this.extractBeliefsfromAssessments(userId, assessments);
        beliefs.push(...explicitBeliefs);
      }

      // Extract implicit beliefs from transaction patterns
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(500);

      if (transactions && transactions.length > 0) {
        const implicitBeliefs = await this.extractBeliefsFromTransactions(userId, transactions);
        beliefs.push(...implicitBeliefs);
      }

      // Deduplicate and merge similar beliefs
      const mergedBeliefs = this.mergeSimilarBeliefs(beliefs);

      // Store beliefs in database
      for (const belief of mergedBeliefs) {
        await supabase
          .from('money_beliefs')
          .upsert({
            user_id: userId,
            belief_statement: belief.statement,
            belief_category: belief.category,
            belief_type: belief.type,
            belief_strength: belief.strength,
            confidence_score: belief.confidence,
            belief_origin: belief.origin,
            supporting_evidence: belief.evidence,
            emotional_valence: belief.valence,
            is_limiting_belief: belief.isLimiting,
            is_core_belief: belief.isCore,
            first_detected_date: new Date().toISOString().split('T')[0]
          }, {
            onConflict: 'user_id,belief_statement,belief_category'
          });
      }

      return {
        success: true,
        beliefsExtracted: mergedBeliefs.length,
        beliefs: mergedBeliefs
      };
    } catch (error) {
      console.error('Error extracting beliefs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract beliefs explicitly stated in assessments
   */
  static async extractBeliefsfromAssessments(userId, assessments) {
    const beliefs = [];
    const beliefPatterns = {
      scarcity: [
        { regex: /money is (hard|difficult|scarce)/i, category: 'scarcity' },
        { regex: /never have (enough|enough money)/i, category: 'scarcity' },
        { regex: /worried about (running out|money)/i, category: 'scarcity' }
      ],
      abundance: [
        { regex: /money is abundant|plenty of opportunities/i, category: 'abundance' },
        { regex: /confident in earning|income grows/i, category: 'abundance' }
      ],
      security: [
        { regex: /security is important|need stability/i, category: 'security' },
        { regex: /prefer safe|avoid risk/i, category: 'security' }
      ],
      growth: [
        { regex: /want to grow|build wealth/i, category: 'growth' },
        { regex: /invest|multiply money/i, category: 'growth' }
      ],
      control: [
        { regex: /want to be in control|manage money|stay organized/i, category: 'control' },
        { regex: /dislike (debt|losing control)/i, category: 'control' }
      ]
    };

    for (const assessment of assessments) {
      const responses = assessment.response_data || {};

      Object.entries(responses).forEach(([question, response]) => {
        const responseText = String(response).toLowerCase();

        for (const [category, patterns] of Object.entries(beliefPatterns)) {
          for (const pattern of patterns) {
            if (pattern.regex.test(responseText)) {
              const belief = {
                statement: `User values ${category.replace(/_/g, ' ')}`,
                category: pattern.category,
                type: 'core_belief',
                strength: 75,
                confidence: 70,
                origin: 'assessment_response',
                evidence: [{ type: 'assessment', question, response }],
                valence: category === 'scarcity' || category === 'control' ? 'negative' : 'positive',
                isLimiting: ['scarcity'].includes(category),
                isCore: true
              };
              beliefs.push(belief);
            }
          }
        }
      });
    }

    return beliefs;
  }

  /**
   * Extract implicit beliefs from transaction patterns
   * Analyzes spending behavior to infer underlying beliefs
   */
  static async extractBeliefsFromTransactions(userId, transactions) {
    const beliefs = [];

    // Calculate behavior metrics
    const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // High spending on discretionary items → abundance or impulsivity belief
    const discretionaryCategories = ['entertainment', 'dining', 'shopping', 'travel'];
    const discretionarySpent = transactions
      .filter(t => discretionaryCategories.includes(t.category?.toLowerCase()))
      .reduce((sum, t) => sum + t.amount, 0);
    const discretionaryRatio = totalExpense > 0 ? (discretionarySpent / totalExpense) * 100 : 0;

    if (discretionaryRatio > 30) {
      beliefs.push({
        statement: 'Prioritize experiences and enjoyment over strict saving',
        category: 'abundance',
        type: 'money_script',
        strength: Math.min(100, discretionaryRatio),
        confidence: 65,
        origin: 'behavioral_signal',
        evidence: [{ type: 'spending_pattern', discretionaryRatio }],
        valence: 'positive',
        isLimiting: false,
        isCore: false
      });
    }

    // Low savings rate → scarcity belief or present bias
    if (savingsRate < 10) {
      beliefs.push({
        statement: 'Money is difficult to save, consumed by immediate needs',
        category: 'scarcity',
        type: 'core_belief',
        strength: Math.min(100, Math.abs(savingsRate - 50)),
        confidence: 70,
        origin: 'behavioral_signal',
        evidence: [{ type: 'savings_pattern', savingsRate }],
        valence: 'negative',
        isLimiting: true,
        isCore: true
      });
    }

    // Analyze payment behavior
    const latePayments = transactions.filter(t => t.status === 'late').length;
    if (latePayments > 0) {
      beliefs.push({
        statement: 'Struggle with payment discipline and financial organization',
        category: 'control',
        type: 'limiting_belief',
        strength: Math.min(100, latePayments * 15),
        confidence: 75,
        origin: 'behavioral_signal',
        evidence: [{ type: 'payment_pattern', latePayments }],
        valence: 'negative',
        isLimiting: true,
        isCore: false
      });
    }

    // Investment behavior
    const investmentTransactions = transactions.filter(t => t.category?.toLowerCase() === 'investment');
    if (investmentTransactions.length > 0) {
      beliefs.push({
        statement: 'Believe in growing wealth through investment',
        category: 'growth',
        type: 'core_belief',
        strength: Math.min(100, investmentTransactions.length * 10),
        confidence: 75,
        origin: 'behavioral_signal',
        evidence: [{ type: 'investment_pattern', count: investmentTransactions.length }],
        valence: 'positive',
        isLimiting: false,
        isCore: true
      });
    }

    return beliefs;
  }

  /**
   * Merge similar beliefs and deduplicate
   */
  static mergeSimilarBeliefs(beliefs) {
    const merged = [];
    const seen = new Set();

    for (const belief of beliefs) {
      const key = `${belief.category}:${belief.statement.substring(0, 30)}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(belief);
      }
    }

    return merged;
  }

  /**
   * Detect cognitive biases from user behavior and responses
   */
  static async detectBiases(userId) {
    try {
      const biases = [];

      // Fetch user data
      const { data: decisions } = await supabase
        .from('financial_decisions')
        .select('*')
        .eq('user_id', userId)
        .order('decision_date', { ascending: false })
        .limit(50);

      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('transaction_date', { ascending: false })
        .limit(300);

      // Detect Loss Aversion
      if (decisions && decisions.length > 0) {
        const lossAversion = this.detectLossAversion(decisions);
        if (lossAversion) biases.push(lossAversion);

        const presentBias = this.detectPresentBias(decisions);
        if (presentBias) biases.push(presentBias);

        const optimismBias = this.detectOptimismBias(decisions);
        if (optimismBias) biases.push(optimismBias);
      }

      // Detect Status Quo Bias
      if (transactions && transactions.length > 0) {
        const statusQuoBias = this.detectStatusQuoBias(userId, transactions);
        if (statusQuoBias) biases.push(statusQuoBias);

        const availabilityBias = this.detectAvailabilityBias(transactions);
        if (availabilityBias) biases.push(availabilityBias);
      }

      // Store detected biases
      for (const bias of biases) {
        await supabase
          .from('cognitive_biases')
          .upsert({
            user_id: userId,
            bias_type: bias.type,
            bias_name: bias.name,
            bias_description: bias.description,
            bias_intensity_score: bias.intensity,
            confidence_score: bias.confidence,
            detected_instances: bias.instances,
            example_incidents: bias.examples,
            estimated_annual_impact: bias.impact,
            first_detected_date: new Date().toISOString().split('T')[0],
            trend: 'stable'
          }, {
            onConflict: 'user_id,bias_type'
          });
      }

      return {
        success: true,
        biasesDetected: biases.length,
        biases
      };
    } catch (error) {
      console.error('Error detecting biases:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect loss aversion - avoiding losses more than pursuing gains
   */
  static detectLossAversion(decisions) {
    const rejectedRisks = decisions.filter(d =>
      d.decision_status === 'abandoned' &&
      d.decision_reasoning?.includes('risk')
    );

    if (rejectedRisks.length > 0) {
      return {
        type: 'loss_aversion',
        name: 'Loss Aversion',
        description: 'Avoiding potential losses more strongly than pursuing equivalent gains',
        intensity: Math.min(100, rejectedRisks.length * 15),
        confidence: 70,
        instances: rejectedRisks.length,
        examples: rejectedRisks.slice(0, 3),
        impact: rejectedRisks.reduce((sum, d) => sum + (d.decision_amount || 0), 0) * 0.1
      };
    }
    return null;
  }

  /**
   * Detect present bias - preferring immediate rewards over future gains
   */
  static detectPresentBias(decisions) {
    const shortTermFocused = decisions.filter(d =>
      d.time_horizon === 'immediate' &&
      d.decision_quality_score < 50
    );

    if (shortTermFocused.length / decisions.length > 0.3) {
      return {
        type: 'present_bias',
        name: 'Present Bias',
        description: 'Over-weighting immediate costs/rewards and under-weighting future consequences',
        intensity: Math.min(100, (shortTermFocused.length / decisions.length) * 100),
        confidence: 75,
        instances: shortTermFocused.length,
        examples: shortTermFocused.slice(0, 3),
        impact: shortTermFocused.reduce((sum, d) => sum + (d.decision_amount || 0), 0) * 0.15
      };
    }
    return null;
  }

  /**
   * Detect optimism bias - overestimating positive outcomes
   */
  static detectOptimismBias(decisions) {
    const optimisticDecisions = decisions.filter(d => {
      const expectedFit = (d.decision_confidence || 50) - (d.actual_outcome ? 20 : 0);
      return expectedFit > d.decision_quality_score;
    });

    if (optimisticDecisions.length > 0) {
      return {
        type: 'optimism_bias',
        name: 'Optimism Bias',
        description: 'Over-estimating positive outcomes and under-estimating risks',
        intensity: Math.min(100, (optimisticDecisions.length / decisions.length) * 100),
        confidence: 65,
        instances: optimisticDecisions.length,
        examples: optimisticDecisions.slice(0, 3),
        impact: optimisticDecisions.reduce((sum, d) => sum + Math.abs(d.decision_amount || 0) * 0.2, 0)
      };
    }
    return null;
  }

  /**
   * Detect status quo bias - resisting change
   */
  static detectStatusQuoBias(userId, transactions) {
    // Analyze if spending patterns remain static
    const recentTxns = transactions.slice(0, 100);
    const olderTxns = transactions.slice(100, 200);

    if (recentTxns.length > 0 && olderTxns.length > 0) {
      const recentAvg = recentTxns.reduce((sum, t) => sum + t.amount, 0) / recentTxns.length;
      const olderAvg = olderTxns.reduce((sum, t) => sum + t.amount, 0) / olderTxns.length;
      const changePercent = Math.abs((recentAvg - olderAvg) / olderAvg) * 100;

      if (changePercent < 5) {
        return {
          type: 'status_quo',
          name: 'Status Quo Bias',
          description: 'Tendency to resist change and maintain current spending patterns',
          intensity: Math.max(50, 100 - changePercent * 10),
          confidence: 70,
          instances: 1,
          examples: [{ type: 'no_pattern_change', periods: 2 }],
          impact: 0
        };
      }
    }
    return null;
  }

  /**
   * Detect availability bias - recent/memorable events influence decisions
   */
  static detectAvailabilityBias(transactions) {
    // Spike in certain categories following news events
    const lastMonth = transactions.slice(0, 30);
    const categorySpikes = {};

    lastMonth.forEach(t => {
      const cat = t.category || 'other';
      categorySpikes[cat] = (categorySpikes[cat] || 0) + 1;
    });

    const spikedCategories = Object.entries(categorySpikes).filter(([_, count]) => count > 10);

    if (spikedCategories.length > 0) {
      return {
        type: 'availability',
        name: 'Availability Bias',
        description: 'Recent or memorable events disproportionately influence decisions',
        intensity: Math.min(100, spikedCategories.length * 25),
        confidence: 60,
        instances: spikedCategories.length,
        examples: spikedCategories.map(([cat]) => ({ category: cat })),
        impact: 0
      };
    }
    return null;
  }

  /**
   * Build the complete belief → decision → outcome relationship graph
   */
  static async buildBeliefGraph(userId) {
    try {
      const nodes = [];
      const edges = [];
      const nodeMap = new Map();

      // Fetch all beliefs
      const { data: beliefs } = await supabase
        .from('money_beliefs')
        .select('*')
        .eq('user_id', userId)
        .order('belief_strength', { ascending: false });

      // Create belief nodes
      if (beliefs) {
        beliefs.forEach(belief => {
          const nodeId = `belief_${belief.id}`;
          nodeMap.set(`belief_${belief.id}`, belief);
          nodes.push({
            id: nodeId,
            type: 'belief',
            label: belief.belief_statement,
            data: {
              strength: belief.belief_strength,
              category: belief.belief_category,
              isLimiting: belief.is_limiting_belief,
              isCore: belief.is_core_belief
            }
          });
        });
      }

      // Fetch all biases
      const { data: biases } = await supabase
        .from('cognitive_biases')
        .select('*')
        .eq('user_id', userId)
        .order('bias_intensity_score', { ascending: false });

      // Create bias nodes and edges to beliefs
      if (biases) {
        biases.forEach(bias => {
          const nodeId = `bias_${bias.id}`;
          nodeMap.set(`bias_${bias.id}`, bias);
          nodes.push({
            id: nodeId,
            type: 'bias',
            label: bias.bias_name,
            data: {
              intensity: bias.bias_intensity_score,
              type: bias.bias_type
            }
          });

          // Connect bias to parent belief
          if (bias.parent_belief_id) {
            edges.push({
              source: `bias_${bias.id}`,
              target: `belief_${bias.parent_belief_id}`,
              type: 'stems_from',
              weight: bias.confidence_score / 100
            });
          }
        });
      }

      // Fetch decisions
      const { data: decisions } = await supabase
        .from('financial_decisions')
        .select('*')
        .eq('user_id', userId)
        .order('decision_date', { ascending: false })
        .limit(100);

      // Create decision nodes and link to beliefs/biases
      if (decisions) {
        decisions.forEach(decision => {
          const nodeId = `decision_${decision.id}`;
          nodeMap.set(`decision_${decision.id}`, decision);
          nodes.push({
            id: nodeId,
            type: 'decision',
            label: decision.decision_title,
            data: {
              amount: decision.decision_amount,
              quality: decision.decision_quality_score,
              status: decision.decision_status
            }
          });

          // Connect beliefs to decision
          if (decision.influencing_beliefs) {
            decision.influencing_beliefs.forEach(beliefId => {
              edges.push({
                source: `belief_${beliefId}`,
                target: nodeId,
                type: 'influences',
                weight: 0.8
              });
            });
          }

          // Connect biases to decision
          if (decision.relevant_biases) {
            decision.relevant_biases.forEach(biasId => {
              edges.push({
                source: `bias_${biasId}`,
                target: nodeId,
                type: 'influences',
                weight: 0.6
              });
            });
          }
        });
      }

      // Fetch outcomes
      const { data: outcomes } = await supabase
        .from('decision_outcomes')
        .select('*')
        .eq('user_id', userId);

      // Create outcome nodes
      if (outcomes) {
        outcomes.forEach(outcome => {
          const nodeId = `outcome_${outcome.id}`;
          nodeMap.set(`outcome_${outcome.id}`, outcome);
          nodes.push({
            id: nodeId,
            type: 'outcome',
            label: outcome.outcome_status,
            data: {
              impact: outcome.financial_impact,
              satisfaction: outcome.satisfaction_score
            }
          });

          // Connect decision to outcome
          edges.push({
            source: `decision_${outcome.decision_id}`,
            target: nodeId,
            type: 'resulted_in',
            weight: 1.0
          });
        });
      }

      // Calculate graph metrics
      const density = edges.length / (nodes.length * (nodes.length - 1));
      const centralityScores = this.calculateCentrality(nodes, edges);

      // Cache the graph
      await supabase
        .from('cognition_graph_cache')
        .upsert({
          user_id: userId,
          nodes,
          edges,
          node_count: nodes.length,
          edge_count: edges.length,
          top_beliefs: beliefs ? beliefs.slice(0, 3).map(b => b.belief_statement) : [],
          major_biases: biases ? biases.slice(0, 3).map(b => b.bias_name) : [],
          belief_network_density: density,
          centrality_scores: centralityScores,
          last_updated: new Date().toISOString().split('T')[0],
          cache_valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }, {
          onConflict: 'user_id'
        });

      return {
        success: true,
        graph: { nodes, edges },
        metrics: { density, centrality: centralityScores }
      };
    } catch (error) {
      console.error('Error building belief graph:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate centrality scores for graph nodes
   */
  static calculateCentrality(nodes, edges) {
    const centrality = {};

    nodes.forEach(node => {
      const incoming = edges.filter(e => e.target === node.id).length;
      const outgoing = edges.filter(e => e.source === node.id).length;
      centrality[node.id] = (incoming + outgoing) / edges.length;
    });

    return centrality;
  }

  /**
   * Get beliefs that influenced a specific decision
   */
  static async getBeliefsInfluencingDecision(userId, decisionId) {
    try {
      const { data: decision } = await supabase
        .from('financial_decisions')
        .select('*')
        .eq('id', decisionId)
        .eq('user_id', userId)
        .single();

      if (!decision) {
        return { success: false, error: 'Decision not found' };
      }

      const influencingBeliefs = [];
      const influencingBiases = [];

      // Fetch beliefs
      if (decision.influencing_beliefs && decision.influencing_beliefs.length > 0) {
        const { data: beliefs } = await supabase
          .from('money_beliefs')
          .select('*')
          .in('id', decision.influencing_beliefs);
        influencingBeliefs.push(...(beliefs || []));
      }

      // Fetch biases
      if (decision.relevant_biases && decision.relevant_biases.length > 0) {
        const { data: biases } = await supabase
          .from('cognitive_biases')
          .select('*')
          .in('id', decision.relevant_biases);
        influencingBiases.push(...(biases || []));
      }

      return {
        success: true,
        decision,
        influencingBeliefs,
        influencingBiases
      };
    } catch (error) {
      console.error('Error getting influencing beliefs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get full belief network for a user
   */
  static async getBeliefNetwork(userId) {
    try {
      // Try to get cached version
      const { data: cache } = await supabase
        .from('cognition_graph_cache')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (cache && new Date(cache.cache_valid_until) > new Date()) {
        return {
          success: true,
          graph: cache,
          cached: true
        };
      }

      // Rebuild if cache invalid
      return await this.buildBeliefGraph(userId);
    } catch (error) {
      console.error('Error getting belief network:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = CognitionGraphEngine;
