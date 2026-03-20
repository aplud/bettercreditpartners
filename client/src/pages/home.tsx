import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
} from "lucide-react";
import { LoanCalculator } from "@/components/loan-calculator";

const benefitItems = [
  {
    title: "Improve Financial Flexibility",
    description: "Open up more options for the financial products you need.",
  },
  {
    title: "Lower Your Borrowing Costs",
    description: "Better rates can save you real money over time.",
  },
  {
    title: "Get Approved With Confidence",
    description: "Make everyday approvals easier, from rentals to credit lines.",
  },
  {
    title: "Build Long-Term Credit Strength",
    description: "Learn habits that keep your credit profile healthy.",
  },
];

const serviceItems = [
  "Collections", "Charge-offs", "Late payments", "Repossessions", 
  "Foreclosures", "Judgments", "Tax liens", "Inquiries", 
  "Personal info errors", "Bankruptcy", "And more"
];

const steps = [
  {
    num: "1",
    title: "Review & Strategy",
    description: "We analyze all 3 bureaus and identify the biggest score blockers.",
  },
  {
    num: "2",
    title: "Dispute Preparation",
    description: "We prepare and send targeted dispute letters and documentation.",
  },
  {
    num: "3",
    title: "Track & Respond",
    description: "We monitor results and respond as bureaus update your file.",
  },
  {
    num: "4",
    title: "Credit-Build Coaching",
    description: "Advice on utilization, balances, and credit mix while disputes run.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col bg-[#060414]">
      {/* Hero Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main Hero Card */}
            <div className="lg:col-span-3 rounded-2xl bg-[#123f56]/30 border border-white/10 p-8 md:p-10 backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#52ceff] text-[#060414] font-bold text-sm" data-testid="badge-hero">
                Start Your Credit Repair Online
              </span>

              <h1 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight" data-testid="text-hero-title">
                Fix what's hurting your credit and start moving your score up.
              </h1>

              <p className="mt-4 text-lg text-white/70 max-w-2xl" data-testid="text-hero-subtitle">
                Sign up in minutes, entirely online. We'll analyze your credit reports, identify what's holding your score back, and start disputing inaccurate items on your behalf.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/enroll">
                  <Button size="lg" className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0" data-testid="button-hero-enroll">
                    Start My Credit Repair
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button size="lg" variant="outline" className="bg-white/5 border-white/20 text-white" data-testid="button-hero-how">
                    See How It Works
                  </Button>
                </Link>
              </div>
              
              <p className="mt-6 text-sm text-white/50">
                No setup fee • $129/mo billed after first month • Cancel anytime • Results vary; no outcome is guaranteed.
              </p>
            </div>

            {/* Side Benefits Card */}
            <aside className="lg:col-span-2 rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 backdrop-blur-sm">
              <p className="font-bold text-white mb-4" data-testid="text-side-title">When you enroll, you get</p>

              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="w-3 h-3 rounded-full bg-[#409645] mt-1.5 flex-shrink-0 shadow-[0_0_0_4px_rgba(64,150,69,0.2)]" />
                  <div>
                    <p className="font-semibold text-white">Full Credit Report Review</p>
                    <p className="text-sm text-white/60">We analyze what's reporting across all three bureaus.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="w-3 h-3 rounded-full bg-[#c0d353] mt-1.5 flex-shrink-0 shadow-[0_0_0_4px_rgba(192,211,83,0.2)]" />
                  <div>
                    <p className="font-semibold text-white">Expert-Managed Disputes</p>
                    <p className="text-sm text-white/60">We handle all dispute letters and bureau communications.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="w-3 h-3 rounded-full bg-[#409645] mt-1.5 flex-shrink-0 shadow-[0_0_0_4px_rgba(64,150,69,0.2)]" />
                  <div>
                    <p className="font-semibold text-white">Priority Support & Education</p>
                    <p className="text-sm text-white/60">Direct support and credit education calls with our team.</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-benefits-title">
              Don't let credit slow down your goals
            </h2>
            <p className="text-white/60 mt-2">Better credit can help you qualify more easily and pay less over time.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefitItems.map((benefit, index) => (
              <div 
                key={index} 
                className="p-5 rounded-xl bg-white/5 border border-white/10"
                data-testid={`card-benefit-${index}`}
              >
                <p className="font-semibold text-white mb-2">{benefit.title}</p>
                <p className="text-sm text-white/60">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section id="services" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-services-title">
                We help you dispute inaccurate, incomplete, or unverifiable credit reporting
              </h2>
              <p className="text-white/60 mt-2">
                If something on your report is wrong (or can't be verified), we help you challenge it through the proper process.
              </p>
            </div>
            <Link href="/enroll">
              <Button className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0 whitespace-nowrap" data-testid="button-services-enroll">
                ENROLL NOW
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl bg-[#123f56]/20 border border-white/10 p-6">
            <div className="flex flex-wrap gap-3">
              {serviceItems.map((item, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm"
                  data-testid={`pill-service-${index}`}
                >
                  {item}
                </span>
              ))}
            </div>
            
            <p className="mt-4 text-sm text-white/50">
              We can't promise removals. Accurate, current, and verifiable information may remain on your report.
              Our focus is on correcting errors and improving your overall credit profile.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="easy" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-steps-title">
              Repairing your credit is easier than ever
            </h2>
            <p className="text-white/60 mt-2">We handle the process. You stay informed and in control.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="p-5 rounded-xl bg-white/5 border border-white/10"
                data-testid={`card-step-${index}`}
              >
                <div className="w-10 h-10 rounded-xl bg-[#52ceff]/20 border border-[#52ceff]/30 flex items-center justify-center font-bold text-[#52ceff] mb-4">
                  {step.num}
                </div>
                <p className="font-semibold text-white mb-2">{step.title}</p>
                <p className="text-sm text-white/60">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-bold text-white text-lg">What to expect</p>
              <p className="text-white/60 mt-2">
                Credit repair is a process, not a one-click fix. Timelines depend on what's reporting and how
                bureaus and creditors respond. Results vary and no specific outcome is guaranteed.
              </p>
            </div>
            <Link href="/enroll">
              <Button className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0 whitespace-nowrap" data-testid="button-expect-enroll">
                ENROLL
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Loan Savings Calculator Section */}
      <section id="calculator" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <LoanCalculator />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-pricing-title">
              Simple, transparent pricing
            </h2>
            <p className="text-white/60 mt-2">No setup fees. You only pay after we start working for you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 text-center">
              <p className="font-bold text-white text-lg mb-1">Sign Up</p>
              <p className="text-3xl font-bold text-green-400 mb-2">Free</p>
              <p className="text-sm text-white/60">Enroll online and sign your disclosure. No payment to start.</p>
            </div>
            <div className="rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 text-center">
              <p className="font-bold text-white text-lg mb-1">Credit Report</p>
              <p className="text-3xl font-bold text-white mb-2">$35</p>
              <p className="text-sm text-white/60">IdentityIQ credit report so we can review and educate you on your scores.</p>
            </div>
            <div className="rounded-2xl bg-[#123f56]/20 border border-[#52ceff]/30 p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#52ceff] text-[#060414] text-xs font-bold whitespace-nowrap">
                AFTER 1ST MONTH
              </div>
              <p className="font-bold text-white text-lg mb-1">Monthly Service</p>
              <p className="text-3xl font-bold text-white mb-2">$129<span className="text-base text-white/50">/mo</span></p>
              <p className="text-sm text-white/60">We dispute items on your behalf. Cancel anytime.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-[#123f56]/20 border border-white/10 p-6">
            <div className="flex items-center gap-6 text-sm text-white/70">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#409645]" /> Priority support</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#409645]" /> Credit education calls</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#409645]" /> Unlimited disputes</span>
            </div>
            <Link href="/enroll">
              <Button className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0" data-testid="button-pricing-enroll">
                ENROLL NOW
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Ready to Start Section */}
      <section id="get-started" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-[#123f56]/40 to-[#123f56]/20 border border-white/10 p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" data-testid="text-cta-title">
              Ready to take control of your credit?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              Enroll online in minutes. No phone calls, no appointments. Sign up, sign your agreement, and we'll get to work on your credit right away.
            </p>
            <Link href="/enroll">
              <Button size="lg" className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0" data-testid="button-cta-enroll">
                Start My Credit Repair
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-6 text-sm text-white/40">
              No setup fee • $129/mo billed after first month • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
