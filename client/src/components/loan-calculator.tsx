import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LoanType = "mortgage" | "auto" | "personal" | "creditCard";

interface TierInfo {
  label: string;
  range: string;
  min: number;
  max: number;
}

const FICO_TIERS: TierInfo[] = [
  { label: "300-499", range: "300-499", min: 300, max: 499 },
  { label: "500-579", range: "500-579", min: 500, max: 579 },
  { label: "580-669", range: "580-669", min: 580, max: 669 },
  { label: "670-739", range: "670-739", min: 670, max: 739 },
  { label: "740-850", range: "740-850", min: 740, max: 850 },
];

const APR_TABLES: Record<LoanType, Record<string, number>> = {
  mortgage: {
    "300-499": 10.67,
    "500-579": 9.36,
    "580-669": 8.16,
    "670-739": 7.39,
    "740-850": 7.01,
  },
  auto: {
    "300-499": 20.99,
    "500-579": 17.78,
    "580-669": 13.90,
    "670-739": 9.73,
    "740-850": 6.84,
  },
  personal: {
    "300-499": 32.00,
    "500-579": 28.00,
    "580-669": 21.00,
    "670-739": 15.00,
    "740-850": 10.50,
  },
  creditCard: {
    "300-499": 29.99,
    "500-579": 26.99,
    "580-669": 22.99,
    "670-739": 18.99,
    "740-850": 15.99,
  },
};

const LOAN_DEFAULTS: Record<LoanType, { amount: number; term: number }> = {
  mortgage: { amount: 250000, term: 360 },
  auto: { amount: 40000, term: 60 },
  personal: { amount: 20000, term: 60 },
  creditCard: { amount: 5000, term: 60 },
};

const LOAN_LABELS: Record<LoanType, string> = {
  mortgage: "Mortgage",
  auto: "Auto",
  personal: "Personal Loan",
  creditCard: "Credit Card",
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

function getTierForScore(score: number): TierInfo {
  for (const tier of FICO_TIERS) {
    if (score >= tier.min && score <= tier.max) {
      return tier;
    }
  }
  return FICO_TIERS[0];
}

function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const monthlyRate = annualRate / 100 / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
}

function calculateTotalInterest(principal: number, annualRate: number, termMonths: number): number {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  return monthlyPayment * termMonths - principal;
}

export function LoanCalculator() {
  const [loanType, setLoanType] = useState<LoanType>("auto");
  const [score, setScore] = useState(661);

  const handleLoanTypeChange = (type: LoanType) => {
    setLoanType(type);
  };

  const userTier = useMemo(() => getTierForScore(score), [score]);
  const defaults = LOAN_DEFAULTS[loanType];

  const userAPR = APR_TABLES[loanType][userTier.label];
  const worstAPR = APR_TABLES[loanType]["300-499"];
  
  const userMonthlyPayment = calculateMonthlyPayment(defaults.amount, userAPR, defaults.term);
  const worstMonthlyPayment = calculateMonthlyPayment(defaults.amount, worstAPR, defaults.term);
  
  const userTotalInterest = calculateTotalInterest(defaults.amount, userAPR, defaults.term);
  const worstTotalInterest = calculateTotalInterest(defaults.amount, worstAPR, defaults.term);
  
  const lifetimeSavings = Math.round(worstTotalInterest - userTotalInterest);

  const sliderMarks = [
    { value: 300, label: "300+" },
    { value: 501, label: "501+" },
    { value: 601, label: "601+" },
    { value: 661, label: "661+" },
    { value: 781, label: "781+" },
  ];

  return (
    <div className="rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 md:p-8 backdrop-blur-sm">
      <div className="mb-6 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2" data-testid="text-calculator-title">
          See How Much You Could Save
        </h3>
        <p className="text-white/60 text-sm max-w-xl mx-auto">
          You could be spending thousands of dollars more on interest over the lifetime of a loan with 
          undesirable credit. Explore how much you could save with our interest savings calculator.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-white font-semibold text-sm uppercase tracking-wide">
              Select Your Loan Type
            </label>
            <Select value={loanType} onValueChange={(v) => handleLoanTypeChange(v as LoanType)}>
              <SelectTrigger 
                className="bg-white/5 border-white/20 text-white w-full"
                data-testid="select-loan-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LOAN_LABELS) as LoanType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {LOAN_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <label className="text-white font-semibold text-sm uppercase tracking-wide">
              Adjust Your Credit Range
            </label>
            <div className="pt-4 pb-2">
              <Slider
                value={[score]}
                onValueChange={(value) => setScore(value[0])}
                min={300}
                max={850}
                step={1}
                className="w-full"
                data-testid="slider-fico-score"
              />
              <div className="flex justify-between text-xs text-white/50 mt-3 px-1">
                {sliderMarks.map((mark) => (
                  <span key={mark.value}>{mark.label}</span>
                ))}
              </div>
            </div>
          </div>

          <Button 
            className="w-full bg-[#52ceff] hover:bg-[#52ceff]/90 text-[#060414] font-bold py-6"
            data-testid="button-calculate"
          >
            Calculate my monthly payment
          </Button>
        </div>

        <div className="rounded-xl border-2 border-[#123f56] bg-white/5 p-6">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70">Average loan amount:</span>
              <span className="text-white font-semibold" data-testid="text-loan-amount">
                {formatCurrency(defaults.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-white/70">Monthly payment:</span>
              <span className="text-white font-semibold" data-testid="text-monthly-payment">
                {formatCurrency(Math.round(userMonthlyPayment))}
              </span>
            </div>
          </div>

          <div className="text-center py-6">
            <p className="text-[#123f56] font-bold text-sm uppercase tracking-wide mb-3" style={{ color: '#52ceff' }}>
              A Score of {score} Could Save You
            </p>
            <p 
              className="text-5xl md:text-6xl font-bold text-[#123f56] mb-2"
              style={{ color: '#123f56' }}
              data-testid="text-lifetime-savings"
            >
              {formatCurrency(Math.max(0, lifetimeSavings))}
            </p>
            <div className="w-32 h-1 bg-[#c0d353] mx-auto mb-3"></div>
            <p className="text-white/80 font-semibold uppercase tracking-wide text-sm">
              Over The Life Of Your Loan
            </p>
          </div>

          <p className="text-xs text-white/40 mt-4">
            *Disclaimer: Average APR & Calculations (as of 2024):{" "}
            <a 
              href="https://www.myfico.com/credit-education/calculators/loan-savings-calculator" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-white/60"
            >
              https://www.myfico.com/credit-education/calculators/loan-savings-calculator/
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
