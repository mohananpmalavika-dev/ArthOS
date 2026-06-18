import React, { useState } from 'react';
import ScoreCard from './ScoreCard';
import { calculateFinancialHealthV2 } from '../lib/scoring-v2.js';
import { useScrollReveal } from '../hooks/useScrollReveal';

export default function DiscoverPhase({ handleNext, onComplete }) {
  const [step, setStep] = useState('welcome'); // welcome, quiz, score
  const [quizStep, setQuizStep] = useState(1); // 1=financial, 2=behavior, 3=awareness
  const [formData, setFormData] = useState({
    // Financial Snapshot
    monthlyIncome: '',
    monthlyExpenses: '',
    emergencyFund: '',
    totalDebt: '',
    // Behavior Questions
    emotionalMoneyLevel: 'somewhat_emotional',
    socialInfluenceLevel: 'sometimes',
    impulseBuyingFrequency: 'sometimes',
    spendWhenStressed: 'sometimes',
    plannedPurchases: 'occasionally',
    waitingRuleUsage: 'sometimes',
    // Awareness Questions
    tracksExpenses: 'sometimes',
    hasFinancialPlan: 'some_plan',
    knowsMonthlyExpenses: 'approximate',
    knowsTotalDebt: 'partially',
    financialLiteracy: 'moderate'
  });
  const [score, setScore] = useState(null);

  const heroRef = useScrollReveal();
  const benefitsRef = useScrollReveal({ threshold: 0.2 });
  const formRef = useScrollReveal({ threshold: 0.1 });
  const scoreRef = useScrollReveal({ threshold: 0.2 });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();

    try {
      // Create assessment object with v2 structure
      const income = parseFloat(formData.monthlyIncome) || 5000;
      const expenses = parseFloat(formData.monthlyExpenses) || 3000;
      const emergency = parseFloat(formData.emergencyFund) || 10000;
      const debt = parseFloat(formData.totalDebt) || 5000;

      const assessment = {
        mode: 'v2',
        profile: {
          monthlyIncome: income,
          monthlyExpenses: expenses,
          emergencySavingsFixed: emergency,
          emergencySavingsDiscretionary: emergency * 0.5,
          totalDebt: debt,
          monthlyLiabilities: expenses * 0.2,
          incomeStability: 'mostly_consistent',
          dependentsBucket: '0_1',
          debtRepaymentRatePctOfIncome: 0.12,
          averageInterestRatePct: 10
        },
        behaviour: {
          emotionalMoneyLevel: formData.emotionalMoneyLevel,
          socialInfluenceLevel: formData.socialInfluenceLevel,
          unplannedPurchaseFreq: formData.impulseBuyingFrequency,
          regretImpulseFreq: formData.impulseBuyingFrequency,
          presentFutureMindset: 'balance_both',
          avoidBalanceDuringStress: formData.spendWhenStressed,
          spendWhenBored: 'sometimes',
          spendWhenStressed: formData.spendWhenStressed,
          plannedPurchasesOnly: formData.plannedPurchases,
          cashflowAwareness: 'sometimes',
          subscriptionControl: 'occasionally',
          impulseWaitRule: formData.waitingRuleUsage
        },
        awareness: {
          comparesLifestyleFreq: 'occasionally',
          hasFinancialPlan: formData.hasFinancialPlan,
          tracksExpenses: formData.tracksExpenses,
          knowsTotalDebt: formData.knowsTotalDebt,
          knowsMonthlyExpenses: formData.knowsMonthlyExpenses,
          tracksSavingsRate: 'not_sure',
          budgetCycle: 'once_every_2_months',
          knowsTop3Expenses: 'some'
        },
        habits: {
          habitCheckInsPerWeek: '1',
          debtPaymentDiscipline: 'sometimes'
        }
      };

      const result = calculateFinancialHealthV2(assessment);

      // Format the result for display
      setScore({
        healthScore: Math.round(result.healthScore || 600),
        healthBand: result.categoryBand?.label || 'Developing',
        assessment: assessment,
        result: result
      });
      setStep('score');
    } catch (error) {
      console.error('Error calculating score:', error);
      // Fallback score if calculation fails
      setScore({
        healthScore: 600,
        healthBand: 'Developing',
        assessment: formData,
        result: {}
      });
      setStep('score');
    }
  };

  if (step === 'welcome') {
    return (
      <div className="discover-phase">
        <div className="discover-welcome">
          <div className="discover-hero scroll-reveal" ref={heroRef}>
            <h1 className="discover-title">Let's Check Your Financial Health</h1>
            <p className="discover-subtitle">
              Get a personalized score in just 2 minutes. No sign-up required.
            </p>
          </div>

          <div className="discover-benefits scroll-reveal-stagger" ref={benefitsRef}>
            <div className="benefit-item scroll-reveal-stagger">
              <span className="benefit-icon">⚡</span>
              <span className="benefit-text">2-minute quiz</span>
            </div>
            <div className="benefit-item scroll-reveal-stagger">
              <span className="benefit-icon">🔒</span>
              <span className="benefit-text">100% private</span>
            </div>
            <div className="benefit-item scroll-reveal-stagger">
              <span className="benefit-icon">📊</span>
              <span className="benefit-text">Instant results</span>
            </div>
          </div>

          <button
            className="discover-cta"
            onClick={() => setStep('quiz')}
          >
            <span>Start Assessment</span>
            <span className="arrow">→</span>
          </button>

          <p className="discover-privacy">
            Your data is never shared. See our <a href="#privacy">privacy policy</a>.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    return (
      <div className="discover-phase">
        <div className="discover-quiz scroll-reveal" ref={formRef}>
          <h2 className="discover-section-title">
            {quizStep === 1 && 'Financial Snapshot'}
            {quizStep === 2 && 'Your Spending Behavior'}
            {quizStep === 3 && 'Financial Awareness'}
          </h2>
          <p className="discover-quiz-subtitle">
            {quizStep === 1 && 'Answer these 4 questions about your finances.'}
            {quizStep === 2 && 'Tell us about your spending habits and decision-making.'}
            {quizStep === 3 && 'How well do you track and understand your finances?'}
          </p>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(0, 255, 255, 0.1)', borderRadius: '2px', margin: '1.5rem 0' }}>
            <div style={{ height: '100%', width: `${(quizStep / 3) * 100}%`, background: 'linear-gradient(90deg, var(--cyan), var(--purple))', borderRadius: '2px', transition: 'width 0.3s ease' }}></div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (quizStep < 3) {
              setQuizStep(quizStep + 1);
            } else {
              handleQuizSubmit(e);
            }
          }} className="discover-form">

            {/* Section 1: Financial Snapshot */}
            {quizStep === 1 && (
              <>
                <div className="form-group">
                  <label htmlFor="income">Monthly Income (₹)</label>
                  <input
                    id="income"
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.monthlyIncome}
                    onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expenses">Monthly Expenses (₹)</label>
                  <input
                    id="expenses"
                    type="number"
                    placeholder="e.g., 30000"
                    value={formData.monthlyExpenses}
                    onChange={(e) => handleInputChange('monthlyExpenses', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emergency">Emergency Fund (₹)</label>
                  <input
                    id="emergency"
                    type="number"
                    placeholder="e.g., 100000"
                    value={formData.emergencyFund}
                    onChange={(e) => handleInputChange('emergencyFund', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="debt">Total Debt (₹)</label>
                  <input
                    id="debt"
                    type="number"
                    placeholder="e.g., 50000"
                    value={formData.totalDebt}
                    onChange={(e) => handleInputChange('totalDebt', e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* Section 2: Behavior */}
            {quizStep === 2 && (
              <>
                <div className="form-group">
                  <label>How emotionally connected are you to money?</label>
                  <select
                    value={formData.emotionalMoneyLevel}
                    onChange={(e) => handleInputChange('emotionalMoneyLevel', e.target.value)}
                  >
                    <option value="extremely_emotional">Extremely emotional</option>
                    <option value="somewhat_emotional">Somewhat emotional</option>
                    <option value="mostly_practical">Mostly practical</option>
                    <option value="fully_logical">Fully logical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Do social environments influence your spending?</label>
                  <select
                    value={formData.socialInfluenceLevel}
                    onChange={(e) => handleInputChange('socialInfluenceLevel', e.target.value)}
                  >
                    <option value="heavily">Heavily</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="rarely">Rarely</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>How often do you make unplanned purchases?</label>
                  <select
                    value={formData.impulseBuyingFrequency}
                    onChange={(e) => handleInputChange('impulseBuyingFrequency', e.target.value)}
                  >
                    <option value="very_often">Very often</option>
                    <option value="often">Often</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="rarely">Rarely</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Do you tend to spend more when stressed?</label>
                  <select
                    value={formData.spendWhenStressed}
                    onChange={(e) => handleInputChange('spendWhenStressed', e.target.value)}
                  >
                    <option value="always">Always</option>
                    <option value="often">Often</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="rarely">Rarely</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Do you mostly buy from a pre-planned list?</label>
                  <select
                    value={formData.plannedPurchases}
                    onChange={(e) => handleInputChange('plannedPurchases', e.target.value)}
                  >
                    <option value="always">Always</option>
                    <option value="often">Often</option>
                    <option value="occasionally">Occasionally</option>
                    <option value="rarely">Rarely</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Do you use a waiting rule (e.g., 24 hours) for non-essential purchases?</label>
                  <select
                    value={formData.waitingRuleUsage}
                    onChange={(e) => handleInputChange('waitingRuleUsage', e.target.value)}
                  >
                    <option value="always">Always</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="rarely">Rarely</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </>
            )}

            {/* Section 3: Awareness */}
            {quizStep === 3 && (
              <>
                <div className="form-group">
                  <label>How often do you track your expenses?</label>
                  <select
                    value={formData.tracksExpenses}
                    onChange={(e) => handleInputChange('tracksExpenses', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="rarely">Rarely</option>
                    <option value="never">Never</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Do you have a financial plan or budget?</label>
                  <select
                    value={formData.hasFinancialPlan}
                    onChange={(e) => handleInputChange('hasFinancialPlan', e.target.value)}
                  >
                    <option value="detailed_plan">Detailed plan with goals</option>
                    <option value="some_plan">Some plan but not detailed</option>
                    <option value="vague_idea">Vague idea</option>
                    <option value="no_plan">No plan</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>How well do you know your monthly expenses?</label>
                  <select
                    value={formData.knowsMonthlyExpenses}
                    onChange={(e) => handleInputChange('knowsMonthlyExpenses', e.target.value)}
                  >
                    <option value="exact">Exact amount</option>
                    <option value="close">Close estimate</option>
                    <option value="approximate">Approximate</option>
                    <option value="unsure">Not sure</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Do you know your total debt?</label>
                  <select
                    value={formData.knowsTotalDebt}
                    onChange={(e) => handleInputChange('knowsTotalDebt', e.target.value)}
                  >
                    <option value="exactly">Exactly</option>
                    <option value="mostly">Mostly</option>
                    <option value="partially">Partially</option>
                    <option value="no_idea">No idea</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>How would you rate your financial literacy?</label>
                  <select
                    value={formData.financialLiteracy}
                    onChange={(e) => handleInputChange('financialLiteracy', e.target.value)}
                  >
                    <option value="expert">Expert level</option>
                    <option value="good">Good understanding</option>
                    <option value="moderate">Moderate</option>
                    <option value="basic">Basic</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="discover-next-cta" style={{ marginTop: '2rem' }}>
              <span>{quizStep < 3 ? 'Next' : 'Calculate Score'}</span>
              <span className="arrow">→</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'score' && score) {
    return (
      <div className="discover-phase">
        <div className="discover-score-reveal">
          <h2 className="discover-section-title">Your Financial Health Score</h2>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
            <div style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(128, 0, 128, 0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              border: '2px solid rgba(0, 255, 255, 0.3)'
            }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--cyan)' }}>
                {score.healthScore}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                Health Score
              </div>
            </div>
          </div>

          <div className="discover-score-explanation">
            <div className="score-band-explanation">
              <p className="explanation-label">Your Score Band:</p>
              <p className="explanation-value">{score.healthBand}</p>
            </div>

            <div className="score-band-meaning">
              {score.healthBand === 'Financially Critical' && (
                <p>Immediate action needed. Let's create a plan to strengthen your finances.</p>
              )}
              {score.healthBand === 'Financially Fragile' && (
                <p>Significant vulnerabilities detected. But there are clear quick wins ahead.</p>
              )}
              {score.healthBand === 'Financially Developing' && (
                <p>You're making progress. Let's accelerate your growth trajectory.</p>
              )}
              {score.healthBand === 'Financially Resilient' && (
                <p>Strong financial health. Let's optimize for long-term wealth building.</p>
              )}
              {score.healthBand === 'Financially Sovereign' && (
                <p>Exceptional financial mastery. You're in an elite group of disciplined savers.</p>
              )}
            </div>
          </div>

          <button
            className="discover-next-cta"
            onClick={() => {
              if (onComplete) onComplete(score);
              handleNext();
            }}
          >
            <span>Explore Your Profile</span>
            <span className="arrow">→</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}
