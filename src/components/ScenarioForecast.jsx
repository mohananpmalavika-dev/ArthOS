import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { forecastScenarios, simulateDecisionImpact, estimateCashflowBreakdown } from '../engines/scenarioForecast';

export function ScenarioForecast({ profile, assessmentResult }) {
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [decisionAmount, setDecisionAmount] = useState(5000);
  const [decisionType, setDecisionType] = useState('savings_increase');

  if (!profile || !assessmentResult) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-600">Complete your assessment to see financial forecasts.</p>
      </div>
    );
  }

  const forecast = forecastScenarios(profile);
  const cashflow = estimateCashflowBreakdown(profile);
  const decisionImpact = selectedDecision ? simulateDecisionImpact(profile, selectedDecision) : null;

  if (!forecast) return null;

  const getStatusIcon = (status) => {
    if (status === 'improving') return <TrendingUp className="text-green-600" size={20} />;
    if (status === 'deteriorating') return <TrendingDown className="text-red-600" size={20} />;
    return <CheckCircle className="text-gray-600" size={20} />;
  };

  const getStatusColor = (status) => {
    if (status === 'improving') return 'bg-green-50 border-green-200';
    if (status === 'deteriorating') return 'bg-red-50 border-red-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Current State */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Your Current Financial Position</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-gray-600 text-sm">Emergency Savings</div>
            <div className="text-3xl font-bold text-gray-900">₹{Math.round(forecast.baseline.currentSavings / 1000)}K</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-gray-600 text-sm">Survival Window</div>
            <div className="text-3xl font-bold text-gray-900">{Math.round(forecast.baseline.currentRunway * 10) / 10}</div>
            <div className="text-xs text-gray-600">months</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-gray-600 text-sm">Monthly Net</div>
            <div className={`text-3xl font-bold ${forecast.baseline.monthlyNetIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.round(forecast.baseline.monthlyNetIncome / 1000)}K
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Cashflow Breakdown */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-4">Monthly Cashflow Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
            <span className="font-semibold text-green-900">Income</span>
            <span className="font-bold text-green-600">₹{Math.round(cashflow.income / 1000)}K</span>
          </div>
          <div className="flex justify-between p-3 bg-red-50 rounded border border-red-200">
            <span className="font-semibold text-red-900">Essential Expenses</span>
            <span className="font-bold text-red-600">₹{Math.round(cashflow.essentials / 1000)}K</span>
          </div>
          <div className="flex justify-between p-3 bg-orange-50 rounded border border-orange-200">
            <span className="font-semibold text-orange-900">Discretionary Spending</span>
            <span className="font-bold text-orange-600">₹{Math.round(cashflow.discretionary / 1000)}K</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded border border-gray-200">
            <span className="font-semibold text-gray-900">Debt Repayment</span>
            <span className="font-bold text-gray-600">₹{Math.round(cashflow.debtRepayment / 1000)}K</span>
          </div>
          <div className="flex justify-between p-3 bg-blue-50 rounded border-2 border-blue-400">
            <span className="font-bold text-blue-900">Available for Savings</span>
            <span className="font-bold text-blue-600">₹{Math.round(cashflow.savingsOpportunity / 1000)}K ({cashflow.savingsPercentage}%)</span>
          </div>
        </div>
      </div>

      {/* Scenario Forecasts */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">30/90/180-Day Forecasts</h3>
        {forecast.scenarios.map((scenario) => (
          <div key={scenario.days} className={`p-6 rounded-lg border-2 ${getStatusColor(scenario.status)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(scenario.status)}
                <div>
                  <h4 className="font-bold text-lg">{scenario.timeframe} From Now</h4>
                  <p className="text-sm text-gray-600 capitalize">{scenario.status} trajectory</p>
                </div>
              </div>
              <Calendar size={24} className="text-gray-400" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white bg-opacity-60 rounded">
                <div className="text-gray-600 text-xs uppercase font-semibold">Projected Savings</div>
                <div className="text-2xl font-bold text-gray-900">₹{Math.round(scenario.projectedSavings / 1000)}K</div>
                <div className="text-xs text-gray-600 mt-1">
                  {scenario.projectedSavings >= forecast.baseline.currentSavings ? '+' : ''}₹
                  {Math.round((scenario.projectedSavings - forecast.baseline.currentSavings) / 1000)}K
                </div>
              </div>

              <div className="p-4 bg-white bg-opacity-60 rounded">
                <div className="text-gray-600 text-xs uppercase font-semibold">Runway</div>
                <div className="text-2xl font-bold text-gray-900">{Math.round(scenario.projectedRunway * 10) / 10}</div>
                <div className="text-xs text-gray-600 mt-1">months remaining</div>
              </div>

              <div className="p-4 bg-white bg-opacity-60 rounded">
                <div className="text-gray-600 text-xs uppercase font-semibold">Debt Remaining</div>
                <div className="text-2xl font-bold text-gray-900">₹{Math.round(scenario.projectedDebt / 1000)}K</div>
                <div className="text-xs text-gray-600 mt-1">
                  {scenario.projectedDebt <= forecast.baseline.currentRunway * 12 ? '✓ Paid down' : 'Still owing'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Scenarios */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-orange-600" /> Stress Test: What Could Go Wrong?
        </h3>
        <div className="space-y-3">
          {forecast.risks.map((risk) => (
            <div key={risk.name} className="p-4 bg-orange-50 rounded border border-orange-200">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-orange-900">{risk.name}</span>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                  risk.impact === 'high' ? 'bg-red-200 text-red-900' :
                  risk.impact === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                  'bg-green-200 text-green-900'
                }`}>
                  {risk.impact.toUpperCase()} IMPACT
                </span>
              </div>
              <p className="text-sm text-gray-700">{risk.probability} probability</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className={`p-6 rounded-lg border-2 ${
        forecast.recommendation.severity === 'critical' ? 'bg-red-50 border-red-300' :
        forecast.recommendation.severity === 'high' ? 'bg-orange-50 border-orange-300' :
        forecast.recommendation.severity === 'medium' ? 'bg-yellow-50 border-yellow-300' :
        'bg-green-50 border-green-300'
      }`}>
        <h3 className="font-bold text-lg mb-2">Recommended Action</h3>
        <p className="text-gray-800 mb-3">{forecast.recommendation.text}</p>
        {forecast.recommendation.action && (
          <button className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700">
            {forecast.recommendation.action}
          </button>
        )}
      </div>

      {/* What-If Decision Simulator */}
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="font-bold text-lg mb-4">What-If Simulator: Test Your Decisions</h3>
        
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Decision Type</label>
            <select
              value={decisionType}
              onChange={(e) => {
                setDecisionType(e.target.value);
                setSelectedDecision(null);
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="savings_increase">Increase Savings (monthly)</option>
              <option value="expense">One-time Expense</option>
              <option value="income_change">Income Increase (monthly)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount: ₹{decisionAmount.toLocaleString()}
            </label>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={decisionAmount}
              onChange={(e) => setDecisionAmount(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={() => setSelectedDecision({
              type: decisionType,
              amount: decisionAmount,
              duration: decisionType === 'expense' ? 'one_time' : 'recurring',
            })}
            className="w-full p-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
          >
            Simulate Decision
          </button>
        </div>

        {decisionImpact && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-gray-600 text-xs uppercase font-semibold">Current Runway</div>
                <div className="text-3xl font-bold text-gray-900">{Math.round(decisionImpact.currentState.runway * 10) / 10}</div>
                <div className="text-xs text-gray-600">months</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-400">
                <div className="text-blue-600 text-xs uppercase font-semibold">New Runway</div>
                <div className="text-3xl font-bold text-blue-600">{Math.round(decisionImpact.projectedState.runway * 10) / 10}</div>
                <div className="text-xs text-blue-600">
                  {decisionImpact.impact.runwayDelta > 0 ? '+' : ''}{Math.round(decisionImpact.impact.runwayDelta * 10) / 10} months
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 ${
              decisionImpact.impact.recommendation.includes('critical') ? 'bg-red-50 border-red-300' :
              'bg-green-50 border-green-300'
            }`}>
              <p className="font-semibold text-gray-900">{decisionImpact.impact.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
