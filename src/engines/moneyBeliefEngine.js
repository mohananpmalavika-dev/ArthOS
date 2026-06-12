/**
 * L07: Money Belief Engine — Consolidated into cognitionEngine
 *
 * This module is now a thin re-export of the production-grade implementation
 * in cognitionEngine.js. The weighted multi-factor model, temporal drift tracking,
 * and calibration history live in cognitionEngine.
 *
 * Blueprint spec: "Models money beliefs, cognitive biases, behavioural patterns"
 * Full implementation: ./cognitionEngine.js
 */
import { analyzeMoneyBeliefs } from "./cognitionEngine.js";
export { analyzeMoneyBeliefs };
export const deriveMoneyBeliefs = analyzeMoneyBeliefs;
