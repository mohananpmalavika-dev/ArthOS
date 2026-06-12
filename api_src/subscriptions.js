/**
 * Stripe Subscription Management API
 * Handles subscription creation, upgrades, downgrades, and status checks
 * 
 * Phase 1: Free tier + Plus tier ($12.99/mo)
 */

import Stripe from 'stripe';
import { query } from './dbClient.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Product/Price IDs (to be created in Stripe dashboard)
const PLANS = {
  free: {
    id: 'price_free', // No price for free tier
    name: 'Free',
    price: 0,
    assessmentsPerMonth: 1,
    features: ['basic_assessment', 'basic_score'],
  },
  plus: {
    id: process.env.STRIPE_PRICE_PLUS_ID || 'price_plus_monthly', // Will be set from Stripe
    name: 'Plus',
    price: 1299, // $12.99 in cents
    assessmentsPerMonth: null, // Unlimited
    features: [
      'unlimited_assessments',
      'full_bas_breakdown',
      'emotional_triggers',
      'money_beliefs',
      'bias_analysis',
      'score_history',
      'basic_digital_twin',
      'action_follow_ups',
      'weekly_checkins',
      'pdf_export',
    ],
  },
};

/**
 * Create or retrieve Stripe customer for user
 */
export async function getOrCreateStripeCustomer(userId, email, name) {
  try {
    // Check if user already has a Stripe customer ID
    const result = await query(
      'SELECT stripe_customer_id FROM users WHERE id = ?',
      [userId]
    );

    let customerId;
    if (result.length > 0 && result[0].stripe_customer_id) {
      customerId = result[0].stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });
      customerId = customer.id;

      // Save Stripe customer ID to database
      await query(
        'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
        [customerId, userId]
      );
    }

    return customerId;
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    throw error;
  }
}

/**
 * Create subscription for user
 */
export async function createSubscription(userId, email, name, planId = 'plus') {
  try {
    const plan = PLANS[planId];
    if (!plan) {
      throw new Error(`Invalid plan: ${planId}`);
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(userId, email, name);

    // For free tier, just update database without Stripe
    if (planId === 'free') {
      await query(
        'UPDATE users SET subscription_tier = ?, subscription_status = ? WHERE id = ?',
        ['free', 'active', userId]
      );

      return {
        success: true,
        tier: 'free',
        status: 'active',
        message: 'Free tier activated',
      };
    }

    // For Plus tier, create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: plan.id,
        },
      ],
      metadata: {
        userId,
        tier: planId,
      },
      trial_period_days: 7, // 7-day free trial
    });

    // Save subscription to database
    await query(
      `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, tier, status, current_period_start, current_period_end)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        subscription.id,
        customerId,
        planId,
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
      ]
    );

    return {
      success: true,
      subscriptionId: subscription.id,
      tier: planId,
      status: subscription.status,
      trialEndsAt: new Date(subscription.trial_end * 1000),
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Get active subscription for user
 */
export async function getActiveSubscription(userId) {
  try {
    const result = await query(
      `SELECT tier, status, stripe_subscription_id, current_period_start, current_period_end, created_at
       FROM subscriptions 
       WHERE user_id = ? AND status IN ('active', 'trialing')
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.length === 0) {
      // User has no active subscription, return free tier
      return {
        tier: 'free',
        status: 'active',
        features: PLANS.free.features,
        assessmentsRemaining: 1, // Will be decremented based on usage
      };
    }

    const sub = result[0];
    const plan = PLANS[sub.tier];

    return {
      tier: sub.tier,
      status: sub.status,
      subscriptionId: sub.stripe_subscription_id,
      features: plan.features,
      assessmentsRemaining: plan.assessmentsPerMonth === null ? null : plan.assessmentsPerMonth,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    // Return free tier on error
    return {
      tier: 'free',
      status: 'active',
      features: PLANS.free.features,
    };
  }
}

/**
 * Upgrade subscription to different plan
 */
export async function upgradeSubscription(userId, newPlanId) {
  try {
    const current = await getActiveSubscription(userId);

    if (current.tier === newPlanId) {
      return {
        success: false,
        message: 'Already on this plan',
      };
    }

    if (!PLANS[newPlanId]) {
      throw new Error(`Invalid plan: ${newPlanId}`);
    }

    const newPlan = PLANS[newPlanId];

    // If upgrading from free to plus
    if (current.tier === 'free' && newPlanId === 'plus') {
      const customerId = await query(
        'SELECT stripe_customer_id FROM users WHERE id = ?',
        [userId]
      );

      const subscription = await stripe.subscriptions.create({
        customer: customerId[0].stripe_customer_id,
        items: [
          {
            price: newPlan.id,
          },
        ],
        metadata: {
          userId,
          tier: newPlanId,
        },
      });

      await query(
        `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, tier, status, current_period_start, current_period_end)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          subscription.id,
          customerId[0].stripe_customer_id,
          newPlanId,
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
        ]
      );

      return {
        success: true,
        tier: newPlanId,
        status: subscription.status,
      };
    }

    // If modifying existing Stripe subscription
    if (current.subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(current.subscriptionId);

      await stripe.subscriptions.update(current.subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPlan.id,
          },
        ],
      });

      await query(
        'UPDATE subscriptions SET tier = ? WHERE stripe_subscription_id = ?',
        [newPlanId, current.subscriptionId]
      );

      return {
        success: true,
        tier: newPlanId,
        status: 'active',
      };
    }

    return {
      success: false,
      message: 'Could not upgrade subscription',
    };
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId) {
  try {
    const current = await getActiveSubscription(userId);

    if (current.tier === 'free') {
      return {
        success: true,
        message: 'Already on free tier',
      };
    }

    if (current.subscriptionId) {
      await stripe.subscriptions.del(current.subscriptionId);

      await query(
        'UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?',
        ['canceled', current.subscriptionId]
      );

      return {
        success: true,
        message: 'Subscription canceled',
      };
    }

    return {
      success: false,
      message: 'No active subscription to cancel',
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Stripe webhook handler - MUST be called AFTER signature verification
 * 
 * Handles all Stripe webhook events:
 * - customer.subscription.updated: subscription plan/status changes
 * - customer.subscription.deleted: subscription canceled
 * - invoice.payment_succeeded: payment successful
 * - invoice.payment_failed: payment failed, retry scheduled
 * - customer.deleted: customer account deleted
 */
export async function handleStripeWebhook(event) {
  try {
    console.log(`\n📬 Received Stripe webhook: ${event.type} (ID: ${event.id})`);

    switch (event.type) {
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object);
        break;

      default:
        console.log(`ℹ️ Unhandled Stripe event type: ${event.type}`);
    }

    console.log(`✅ Webhook processed successfully\n`);
    return { success: true, eventId: event.id };
  } catch (error) {
    console.error(`❌ Error handling Stripe webhook: ${error.message}\n`);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log(`📝 Subscription updated: ${subscription.id}, status: ${subscription.status}`);

    // Verify subscription exists in database
    const result = await query(
      'SELECT user_id, status FROM subscriptions WHERE stripe_subscription_id = ?',
      [subscription.id]
    );

    if (!result || result.length === 0) {
      console.warn(`⚠️ Subscription ${subscription.id} not found in database, skipping update`);
      return;
    }

    const { user_id, status: oldStatus } = result[0];

    // Update subscription details in database
    await query(
      `UPDATE subscriptions 
       SET status = ?, 
           current_period_start = ?, 
           current_period_end = ?,
           updated_at = NOW()
       WHERE stripe_subscription_id = ?`,
      [
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.id,
      ]
    );

    console.log(`✅ Updated subscription ${subscription.id}: ${oldStatus} → ${subscription.status}`);

    // Handle status transitions
    if (subscription.status === 'active' && oldStatus !== 'active') {
      console.log(`🎉 User ${user_id}: subscription activated`);
      // TODO: Send "Welcome to Plus tier!" email
    } else if (subscription.status === 'past_due' && oldStatus !== 'past_due') {
      console.log(`⚠️ User ${user_id}: subscription past due, payment retry needed`);
      // TODO: Send "Payment failed, please update payment method" email
    } else if (subscription.status === 'canceled' && oldStatus !== 'canceled') {
      console.log(`😞 User ${user_id}: subscription canceled`);
      // TODO: Send "Sorry to see you go" email with retention offer
    }
  } catch (error) {
    console.error(`❌ Error handling subscription updated: ${error.message}`);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  try {
    console.log(`🗑️ Subscription deleted: ${subscription.id}`);

    // Soft delete: mark as canceled and set end date to now
    const result = await query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
      [subscription.id]
    );

    if (!result || result.length === 0) {
      console.warn(`⚠️ Subscription ${subscription.id} not found in database`);
      return;
    }

    const { user_id } = result[0];

    await query(
      `UPDATE subscriptions 
       SET status = 'canceled', 
           current_period_end = NOW(),
           updated_at = NOW()
       WHERE stripe_subscription_id = ?`,
      [subscription.id]
    );

    console.log(`✅ Marked subscription ${subscription.id} as canceled for user ${user_id}`);
  } catch (error) {
    console.error(`❌ Error handling subscription deleted: ${error.message}`);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    console.log(`💰 Payment succeeded: invoice ${invoice.id}`);

    if (!invoice.subscription) {
      console.log(`ℹ️ Invoice ${invoice.id} has no subscription (one-time payment)`);
      return;
    }

    // Update subscription status to active (in case it was past_due)
    const subResult = await query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
      [invoice.subscription]
    );

    if (!subResult || subResult.length === 0) {
      console.warn(`⚠️ Subscription ${invoice.subscription} not found for invoice ${invoice.id}`);
      return;
    }

    const { user_id } = subResult[0];

    await query(
      `UPDATE subscriptions 
       SET status = 'active',
           updated_at = NOW()
       WHERE stripe_subscription_id = ?`,
      [invoice.subscription]
    );

    console.log(`✅ Subscription ${invoice.subscription} reactivated due to successful payment`);
    console.log(`📧 User ${user_id}: payment successful, invoice ${invoice.id} ($${(invoice.amount_paid / 100).toFixed(2)})`);
    
    // TODO: Send payment receipt email with features/benefits
  } catch (error) {
    console.error(`❌ Error handling payment succeeded: ${error.message}`);
    throw error;
  }
}

async function handlePaymentFailed(invoice) {
  try {
    console.log(`❌ Payment failed: invoice ${invoice.id}`);

    if (!invoice.subscription) {
      console.log(`ℹ️ Invoice ${invoice.id} has no subscription`);
      return;
    }

    // Update subscription status to past_due
    const subResult = await query(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
      [invoice.subscription]
    );

    if (!subResult || subResult.length === 0) {
      console.warn(`⚠️ Subscription ${invoice.subscription} not found for invoice ${invoice.id}`);
      return;
    }

    const { user_id } = subResult[0];

    await query(
      `UPDATE subscriptions 
       SET status = 'past_due',
           updated_at = NOW()
       WHERE stripe_subscription_id = ?`,
      [invoice.subscription]
    );

    console.log(`⚠️ Subscription ${invoice.subscription} marked as past_due`);
    console.log(`📧 User ${user_id}: payment failed on invoice ${invoice.id}, retry scheduled`);
    
    // TODO: Send payment failure email with retry instructions or payment update link
  } catch (error) {
    console.error(`❌ Error handling payment failed: ${error.message}`);
    throw error;
  }
}

async function handleCustomerDeleted(customer) {
  try {
    console.log(`🗑️ Customer deleted from Stripe: ${customer.id}`);

    // Find all subscriptions for this customer and mark as canceled
    const subscriptions = await query(
      'SELECT id, stripe_subscription_id FROM subscriptions WHERE stripe_customer_id = ?',
      [customer.id]
    );

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`ℹ️ No subscriptions found for deleted customer ${customer.id}`);
      return;
    }

    for (const sub of subscriptions) {
      await query(
        `UPDATE subscriptions 
         SET status = 'canceled', 
             updated_at = NOW()
         WHERE id = ?`,
        [sub.id]
      );
      console.log(`✅ Canceled subscription ${sub.stripe_subscription_id} (local ID ${sub.id})`);
    }
  } catch (error) {
    console.error(`❌ Error handling customer deleted: ${error.message}`);
    throw error;
  }
}

/**
 * Get plan details
 */
export function getPlanDetails(planId = 'free') {
  return PLANS[planId] || PLANS.free;
}

/**
 * Get all available plans
 */
export function getAllPlans() {
  return PLANS;
}

export default {
  createSubscription,
  getActiveSubscription,
  upgradeSubscription,
  cancelSubscription,
  handleStripeWebhook,
  getPlanDetails,
  getAllPlans,
};
