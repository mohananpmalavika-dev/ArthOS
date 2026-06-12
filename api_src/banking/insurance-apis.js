/**
 * Insurance APIs Integration
 * 
 * Connects with insurance providers for policy management and claims
 * - Policy data aggregation
 * - Premium tracking and reminders
 * - Claims management integration
 * - Coverage analysis
 * - Insurance recommendations based on financial profile
 * 
 * Blueprint §23: Insurance provider integration
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Insurance Provider Configuration
 */
const INSURANCE_PROVIDERS = {
  'DIGIT_INSURANCE': {
    apiEndpoint: 'https://api.digitinsurance.com/v1',
    apiKey: process.env.DIGIT_API_KEY,
    supportedPolicies: ['health', 'auto', 'travel', 'property']
  },
  'BAJAJ_ALLIANZ': {
    apiEndpoint: 'https://api.bajajallianz.com/v1',
    apiKey: process.env.BAJAJ_API_KEY,
    supportedPolicies: ['health', 'life', 'auto', 'investment']
  },
  'HDFC_ERGO': {
    apiEndpoint: 'https://api.hdfcergo.com/v1',
    apiKey: process.env.HDFC_ERGO_API_KEY,
    supportedPolicies: ['health', 'auto', 'travel', 'home']
  },
  'ICICI_LOMBARD': {
    apiEndpoint: 'https://api.icicilombard.com/v1',
    apiKey: process.env.ICICI_LOMBARD_API_KEY,
    supportedPolicies: ['health', 'auto', 'travel', 'home']
  },
  'MAX_BUPA': {
    apiEndpoint: 'https://api.maxbupa.com/v1',
    apiKey: process.env.MAX_BUPA_API_KEY,
    supportedPolicies: ['health']
  },
  'ADITYA_BIRLA': {
    apiEndpoint: 'https://api.adityabirlacapital.com/v1',
    apiKey: process.env.ADITYA_BIRLA_API_KEY,
    supportedPolicies: ['health', 'life', 'general']
  }
};

/**
 * Fetch User Insurance Policies
 * Aggregates policies from all connected insurance providers
 */
async function fetchUserInsurancePolicies(userId) {
  try {
    const allPolicies = [];

    // Iterate through all providers
    for (const [providerKey, providerConfig] of Object.entries(INSURANCE_PROVIDERS)) {
      try {
        const policies = await fetchProviderPolicies(userId, providerKey, providerConfig);
        allPolicies.push(...policies);
      } catch (error) {
        console.warn(`Failed to fetch policies from ${providerKey}:`, error.message);
      }
    }

    // Store policies in database
    for (const policy of allPolicies) {
      await supabase.from('insurance_policies').upsert({
        user_id: userId,
        policy_number: policy.policyNumber,
        provider_name: policy.provider,
        policy_type: policy.type,
        coverage_amount: parseFloat(policy.coverageAmount),
        premium_amount: parseFloat(policy.premiumAmount),
        premium_frequency: policy.premiumFrequency,
        policy_start_date: new Date(policy.startDate).toISOString().split('T')[0],
        policy_end_date: new Date(policy.endDate).toISOString().split('T')[0],
        renewal_date: policy.renewalDate ? new Date(policy.renewalDate).toISOString().split('T')[0] : null,
        last_premium_paid_date: policy.lastPremiumPaidDate ? new Date(policy.lastPremiumPaidDate).toISOString().split('T')[0] : null,
        next_premium_due_date: policy.nextPremiumDueDate ? new Date(policy.nextPremiumDueDate).toISOString().split('T')[0] : null,
        coverage_details: policy.coverageDetails,
        status: policy.status?.toLowerCase() || 'active'
      }, { onConflict: 'policy_number' });
    }

    // Update sync status
    await supabase
      .from('banking_sync_status')
      .update({
        insurance_last_synced: new Date().toISOString()
      })
      .eq('user_id', userId);

    return {
      success: true,
      policyCount: allPolicies.length,
      policies: allPolicies
    };
  } catch (error) {
    console.error('Insurance policy fetch failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch Policies from Single Provider
 */
async function fetchProviderPolicies(userId, providerKey, providerConfig) {
  try {
    if (!providerConfig.apiKey) {
      return []; // Provider not configured
    }

    // Call provider API
    const response = await fetch(`${providerConfig.apiEndpoint}/policies`, {
      headers: {
        'Authorization': `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error(`Provider API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return (data.policies || []).map(policy => ({
      provider: providerKey,
      policyNumber: policy.policyNumber,
      type: normalizeInsuranceType(policy.type),
      coverageAmount: policy.coverageAmount,
      premiumAmount: policy.premiumAmount,
      premiumFrequency: policy.premiumFrequency || 'annual',
      startDate: policy.startDate,
      endDate: policy.endDate,
      renewalDate: policy.renewalDate,
      lastPremiumPaidDate: policy.lastPremiumPaidDate,
      nextPremiumDueDate: policy.nextPremiumDueDate,
      coverageDetails: policy.coverageDetails || {},
      status: policy.status
    }));
  } catch (error) {
    console.error(`Error fetching from ${providerKey}:`, error);
    throw error;
  }
}

/**
 * Fetch Insurance Claims
 */
async function fetchInsuranceClaims(userId, policyId = null) {
  try {
    let query = supabase
      .from('insurance_claims')
      .select('*')
      .eq('user_id', userId);

    if (policyId) {
      query = query.eq('policy_id', policyId);
    }

    const { data: claims, error } = await query;

    if (error) throw error;

    // Enrich claims with policy details
    const enrichedClaims = await Promise.all(
      claims.map(async (claim) => {
        const { data: policy } = await supabase
          .from('insurance_policies')
          .select('provider_name, policy_type')
          .eq('id', claim.policy_id)
          .single();

        return { ...claim, policy };
      })
    );

    return {
      success: true,
      claimCount: enrichedClaims.length,
      claims: enrichedClaims
    };
  } catch (error) {
    console.error('Claims fetch failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * File Insurance Claim
 */
async function fileInsuranceClaim(userId, policyId, claimData) {
  try {
    // Get policy details
    const { data: policy, error: policyError } = await supabase
      .from('insurance_policies')
      .select('*')
      .eq('id', policyId)
      .eq('user_id', userId)
      .single();

    if (policyError || !policy) {
      throw new Error('Policy not found');
    }

    // Generate claim number
    const claimNumber = `CLM_${userId}_${Date.now()}`;

    // Insert claim record
    const { data: claim, error } = await supabase
      .from('insurance_claims')
      .insert({
        policy_id: policyId,
        user_id: userId,
        claim_number: claimNumber,
        claim_date: new Date().toISOString().split('T')[0],
        claim_amount: claimData.amount,
        claim_reason: claimData.reason,
        status: 'filed'
      })
      .select()
      .single();

    if (error) throw error;

    // Notify insurance provider
    const providerConfig = INSURANCE_PROVIDERS[policy.provider_name];
    if (providerConfig) {
      await notifyProviderClaim(providerConfig, policy, claim);
    }

    return {
      success: true,
      claimNumber,
      claim
    };
  } catch (error) {
    console.error('Claim filing failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify Insurance Provider of New Claim
 */
async function notifyProviderClaim(providerConfig, policy, claim) {
  try {
    const response = await fetch(`${providerConfig.apiEndpoint}/claims`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        claimNumber: claim.claim_number,
        policyNumber: policy.policy_number,
        claimDate: claim.claim_date,
        claimAmount: claim.claim_amount,
        claimReason: claim.claim_reason
      })
    });

    if (!response.ok) {
      console.warn(`Provider notification failed: ${response.statusText}`);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error('Provider notification failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Insurance Recommendations
 * Based on financial profile and existing coverage
 */
async function getInsuranceRecommendations(userId) {
  try {
    // Fetch user's financial profile
    const { data: assessment } = await supabase
      .from('assessments')
      .select('*')
      .eq('participant_email', (await supabase.auth.getUser()).user?.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch existing policies
    const { data: existingPolicies } = await supabase
      .from('insurance_policies')
      .select('policy_type')
      .eq('user_id', userId)
      .eq('status', 'active');

    const existingTypes = new Set(
      (existingPolicies || []).map(p => p.policy_type)
    );

    const recommendations = [];

    // Parse financial profile
    const profile = assessment?.result || {};
    const income = parseFloat(assessment?.profile_monthlyIncome || 0);
    const dependents = assessment?.profile_dependentsBucket || 0;
    const debt = parseFloat(assessment?.profile_totalDebt || 0);

    // Health Insurance Recommendation
    if (!existingTypes.has('health')) {
      recommendations.push({
        type: 'health',
        priority: 'critical',
        reason: 'Health insurance is essential for any individual',
        recommendedCoverage: income * 10, // 10x annual income
        estimatedPremium: (income * 10) * 0.05 / 12, // ~5% annual
        coverage: {
          individual: income * 5,
          familyFloater: income * 10,
          criticalIllness: income * 2
        }
      });
    }

    // Life Insurance Recommendation
    if (dependents > 0 && !existingTypes.has('life')) {
      recommendations.push({
        type: 'life',
        priority: 'high',
        reason: `You have ${dependents} dependents who need financial protection`,
        recommendedCoverage: income * 12 * 5, // 5 years of income
        estimatedPremium: (income * 12 * 5) * 0.02 / 12, // ~2% annual,
        coverage: {
          term: income * 12 * 5,
          endowment: income * 12 * 3
        }
      });
    }

    // Auto Insurance Recommendation
    if (income > 50000 && !existingTypes.has('auto')) {
      recommendations.push({
        type: 'auto',
        priority: 'medium',
        reason: 'Mandatory auto insurance for vehicle owners',
        recommendedCoverage: income * 2,
        estimatedPremium: (income * 2) * 0.08 / 12, // ~8% annual
        coverage: {
          thirdPartyLiability: income * 2,
          ownDamage: income * 1.5,
          personal: 500000
        }
      });
    }

    // Home Insurance Recommendation
    if (income > 100000 && !existingTypes.has('property')) {
      recommendations.push({
        type: 'property',
        priority: 'medium',
        reason: 'Protect your home and belongings from unforeseen risks',
        recommendedCoverage: income * 5,
        estimatedPremium: (income * 5) * 0.05 / 12,
        coverage: {
          structure: income * 3,
          contents: income * 2,
          liabilities: income * 1
        }
      });
    }

    return {
      success: true,
      recommendations,
      totalEstimatedPremium: recommendations.reduce((sum, r) => sum + r.estimatedPremium, 0)
    };
  } catch (error) {
    console.error('Recommendation generation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Track Premium Reminders
 */
async function getPremiumReminders(userId) {
  try {
    const { data: policies } = await supabase
      .from('insurance_policies')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (!policies) return { success: true, reminders: [] };

    const reminders = [];
    const today = new Date();

    for (const policy of policies) {
      const nextDueDate = new Date(policy.next_premium_due_date);
      const daysUntilDue = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 30 && daysUntilDue > 0) {
        reminders.push({
          policyNumber: policy.policy_number,
          policyType: policy.policy_type,
          providerName: policy.provider_name,
          premiumAmount: policy.premium_amount,
          dueDate: policy.next_premium_due_date,
          daysUntilDue,
          urgency: daysUntilDue <= 7 ? 'urgent' : 'normal'
        });
      } else if (daysUntilDue <= 0) {
        reminders.push({
          policyNumber: policy.policy_number,
          policyType: policy.policy_type,
          providerName: policy.provider_name,
          premiumAmount: policy.premium_amount,
          dueDate: policy.next_premium_due_date,
          daysUntilDue,
          urgency: 'overdue'
        });
      }
    }

    return {
      success: true,
      reminderCount: reminders.length,
      reminders: reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    };
  } catch (error) {
    console.error('Reminder generation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Utility: Normalize Insurance Type
 */
function normalizeInsuranceType(type) {
  const typeMap = {
    'HEALTH': 'health',
    'LIFE': 'life',
    'AUTO': 'auto',
    'MOTOR': 'auto',
    'HOME': 'property',
    'PROPERTY': 'property',
    'TRAVEL': 'travel',
    'INVESTMENT': 'investment'
  };
  return typeMap[type?.toUpperCase()] || 'general';
}

export default {
  fetchUserInsurancePolicies,
  fetchInsuranceClaims,
  fileInsuranceClaim,
  getInsuranceRecommendations,
  getPremiumReminders
};
