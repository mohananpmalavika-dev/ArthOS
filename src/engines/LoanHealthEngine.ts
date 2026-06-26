
interface CustomerProfile {
  salaryDelay?: number;
  gamblingExpense?: boolean;
  emergencySavings?: number;
  emi?: number;
  stressLevel?: number;
  loanShopping?: boolean;
}

interface LoanHealth {
  score: number;
  risk: 'Low' | 'Medium' | 'High';
}

export function calculateLoanHealth(customer: CustomerProfile): LoanHealth {
  let score = 100;
  if (customer.salaryDelay && customer.salaryDelay > 2) score -= 20;
  if (customer.gamblingExpense) score -= 30;
  if (customer.emergencySavings && customer.emi && customer.emergencySavings < customer.emi) score -= 15;
  if (customer.stressLevel && customer.stressLevel > 80) score -= 10;
  if (customer.loanShopping) score -= 10;
  
  let risk: 'Low' | 'Medium' | 'High';
  if (score > 80) {
    risk = 'Low';
  } else if (score > 60) {
    risk = 'Medium';
  } else {
    risk = 'High';
  }

  return { score, risk };
}