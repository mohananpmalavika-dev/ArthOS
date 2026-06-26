import { calculateDefaultProbability } from '../../src/engines/mlDefaultPredictionEngine.js';

export function predictLoanDefault(payload = {}) {
  const customer = payload.customer || payload.profile || {};
  const history = payload.history || {};

  return {
    contractVersion: 'loan-default.predict.v1',
    ...calculateDefaultProbability(customer, history)
  };
}

export default {
  predictLoanDefault
};
