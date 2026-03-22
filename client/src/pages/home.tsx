import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Lock,
  Clock,
  MapPin,
  ChevronDown,
  Car,
  CreditCard,
  Home as HomeIcon,
  Shield,
} from "lucide-react";
import { LoanCalculator } from "@/components/loan-calculator";

const benefitItems = [
  {
    icon: Car,
    title: "Auto Loans",
    description:
      "Poor credit can mean paying 9-14% more in APR. That's thousands extra over a 5-year loan.",
  },
  {
    icon: CreditCard,
    title: "Credit Cards",
    description:
      "Subprime cards charge 26-36% APR vs. 16-20% for good credit. The gap adds up fast.",
  },
  {
    icon: HomeIcon,
    title: "Rental Applications",
    description:
      "Landlords check credit. Errors on your report can mean denied applications or higher deposits.",
  },
  {
    icon: Shield,
    title: "Insurance Rates",
    description:
      "Many insurers use credit-based scores. Inaccurate items can raise your premiums.",
  },
];

const steps = [
  {
    num: "1",
    title: "Sign Up in Minutes",
    description:
      "Enroll online and sign the required federal disclosure. No phone calls, no appointments.",
  },
  {
    num: "2",
    title: "We Analyze Your Reports",
    description:
      "We review all three bureau reports and identify inaccurate, unverifiable, or outdated items.",
  },
  {
    num: "3",
    title: "We Dispute on Your Behalf",
    description:
      "We prepare and send targeted dispute letters to bureaus and creditors.",
  },
  {
    num: "4",
    title: "Track Progress & Learn",
    description:
      "Monitor results through your portal, plus get personal credit education calls with our team.",
  },
];

const faqs = [
  {
    q: "How long does credit repair take?",
    a: "Most programs run 3-6 months depending on the number and type of items being disputed. Credit bureaus have 30 days to investigate each dispute under the FCRA. Multiple rounds may be needed.",
  },
  {
    q: "Is credit repair legal?",
    a: "Yes. The Credit Repair Organizations Act (CROA) regulates credit repair companies, and the Fair Credit Reporting Act (FCRA) gives every consumer the right to dispute inaccurate information on their reports. You can do this yourself for free, or hire a company like us to manage the process.",
  },
  {
    q: "What can actually be removed from my credit report?",
    a: "Items that are inaccurate, incomplete, unverifiable, or outdated can be disputed. If a bureau or creditor cannot verify the information within 30 days, it must be corrected or removed. We cannot remove accurate, verified information.",
  },
  {
    q: "Do you guarantee results?",
    a: "No. Federal law prohibits credit repair companies from guaranteeing specific outcomes. What we can tell you: we use proven dispute methods, handle all communications, and work your case until you decide to stop. Results depend on what's reporting and how bureaus respond.",
  },
  {
    q: "What does it cost?",
    a: "Enrollment is free. You'll need credit monitoring through IdentityIQ ($35/month) so we can access and track your reports. After your first month of service, it's $129/month for our dispute work. You can cancel anytime with no penalties.",
  },
  {
    q: "Which states do you serve?",
    a: "We currently serve clients in Alabama, Alaska, Florida, Kentucky, Montana, New Jersey, New Mexico, North Dakota, Rhode Island, South Dakota, Vermont, and Wyoming. We're expanding to more states soon.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.a
        }
      }))
    });
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="flex flex-col bg-[#060414]">
      <Helmet>
        <title>Better Credit Partners - Credit Report Dispute Assistance</title>
        <meta name="description" content="1 in 5 Americans have credit report errors. Better Credit Partners helps you identify and dispute inaccurate items across all three bureaus. Enroll online in minutes." />
      </Helmet>
      {/* Hero Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Main Hero Card */}
            <div className="lg:col-span-3 rounded-2xl bg-[#123f56]/30 border border-white/10 p-8 md:p-10 backdrop-blur-sm">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#52ceff] text-[#060414] font-bold text-sm"
                data-testid="badge-hero"
              >
                Credit Report Errors Cost You Money
              </span>

              <h1
                className="mt-6 text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
                data-testid="text-hero-title"
              >
                1 in 5 Americans have errors on their credit report. Are you one
                of them?
              </h1>

              <p
                className="mt-4 text-lg text-white/70 max-w-2xl"
                data-testid="text-hero-subtitle"
              >
                Credit report errors are the #1 consumer complaint at the CFPB.
                We analyze your reports, identify inaccurate items, and dispute
                them on your behalf, entirely online.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/enroll">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0"
                    data-testid="button-hero-enroll"
                  >
                    Start My Credit Repair
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white"
                    data-testid="button-hero-how"
                  >
                    See How It Works
                  </Button>
                </Link>
              </div>

              <p className="mt-6 text-sm text-white/50">
                No setup fee · $129/mo billed after first month · Cancel anytime
                · Results vary; no outcome is guaranteed.
              </p>
            </div>

            {/* Side Benefits Card */}
            <aside className="lg:col-span-2 rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 backdrop-blur-sm">
              <p
                className="font-bold text-white mb-4"
                data-testid="text-side-title"
              >
                When you enroll, you get
              </p>

              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="w-3 h-3 rounded-full bg-[#409645] mt-1.5 flex-shrink-0 shadow-[0_0_0_4px_rgba(64,150,69,0.2)]" />
                  <div>
                    <p className="font-semibold text-white">
                      3-Bureau Credit Analysis
                    </p>
                    <p className="text-sm text-white/60">
                      We review what's reporting across Equifax, Experian, and
                      TransUnion.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="w-3 h-3 rounded-full bg-[#c0d353] mt-1.5 flex-shrink-0 shadow-[0_0_0_4px_rgba(192,211,83,0.2)]" />
                  <div>
                    <p className="font-semibold text-white">
                      Expert Dispute Management
                    </p>
                    <p className="text-sm text-white/60">
                      We handle all dispute letters and communications with
                      bureaus and creditors.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="w-3 h-3 rounded-full bg-[#409645] mt-1.5 flex-shrink-0 shadow-[0_0_0_4px_rgba(64,150,69,0.2)]" />
                  <div>
                    <p className="font-semibold text-white">
                      Personal Credit Education
                    </p>
                    <p className="text-sm text-white/60">
                      Direct calls with our team to help you understand and
                      improve your credit habits.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#409645]" />
              CROA & FCRA Compliant
            </span>
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#52ceff]" />
              256-bit Encryption
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#c0d353]" />
              Cancel Anytime
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#52ceff]" />
              Serving 12 States
            </span>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <h2
              className="text-2xl md:text-3xl font-bold text-white"
              data-testid="text-benefits-title"
            >
              Bad credit costs you real money, every month
            </h2>
            <p className="text-white/60 mt-2">
              Higher interest rates, denied applications, and limited options.
              Here's what inaccurate reporting can affect.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefitItems.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-white/5 border border-white/10"
                  data-testid={`card-benefit-${index}`}
                >
                  <Icon className="h-6 w-6 text-[#52ceff] mb-3" />
                  <p className="font-semibold text-white mb-2">
                    {benefit.title}
                  </p>
                  <p className="text-sm text-white/60">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-white/40">
            APR data based on 2024 market rates. Sources: MyFICO, Federal
            Reserve G.19, Bankrate.
          </p>
        </div>
      </section>

      {/* Loan Savings Calculator Section */}
      <section id="calculator" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <LoanCalculator />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="easy" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <h2
              className="text-2xl md:text-3xl font-bold text-white"
              data-testid="text-steps-title"
            >
              Repairing your credit is easier than ever
            </h2>
            <p className="text-white/60 mt-2">
              We handle the process. You stay informed and in control.
            </p>
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

          {/* What to Expect */}
          <div className="mt-6 rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-bold text-white text-lg">What to expect</p>
              <p className="text-white/60 mt-2">
                Credit repair is a process, not a one-click fix. Timelines
                depend on what's reporting and how bureaus and creditors respond.
                Results vary and no specific outcome is guaranteed.
              </p>
            </div>
            <Link href="/enroll">
              <Button
                className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0 whitespace-nowrap"
                data-testid="button-expect-enroll"
              >
                ENROLL
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-white/60 mt-2">
              Common questions about credit repair and our service.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() =>
                    setOpenFaq(openFaq === index ? null : index)
                  }
                >
                  <span className="font-semibold text-white pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-white/50 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-white/60 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="mb-8">
            <h2
              className="text-2xl md:text-3xl font-bold text-white"
              data-testid="text-pricing-title"
            >
              Simple, transparent pricing
            </h2>
            <p className="text-white/60 mt-2">
              No setup fees. You only pay after we start working for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 text-center">
              <p className="font-bold text-white text-lg mb-1">Sign Up</p>
              <p className="text-3xl font-bold text-green-400 mb-2">Free</p>
              <p className="text-sm text-white/60">
                Enroll online and sign your disclosure. No payment to start.
              </p>
            </div>
            <div className="rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 text-center">
              <p className="font-bold text-white text-lg mb-1">
                Credit Monitoring
              </p>
              <p className="text-3xl font-bold text-white mb-2">$35<span className="text-base text-white/50">/mo</span></p>
              <p className="text-sm text-white/60">
                Monthly monitoring through IdentityIQ so we can track your
                reports and build your dispute strategy.
              </p>
            </div>
            <div className="rounded-2xl bg-[#123f56]/20 border border-[#52ceff]/30 p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#52ceff] text-[#060414] text-xs font-bold whitespace-nowrap">
                AFTER 1ST MONTH
              </div>
              <p className="font-bold text-white text-lg mb-1">
                Monthly Service
              </p>
              <p className="text-3xl font-bold text-white mb-2">
                $129<span className="text-base text-white/50">/mo</span>
              </p>
              <p className="text-sm text-white/60">
                We dispute items on your behalf. Cancel anytime.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-[#123f56]/20 border border-white/10 p-6">
            <div className="flex items-center gap-6 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#409645]" /> Priority support
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#409645]" /> Credit education
                calls
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#409645]" /> Unlimited disputes
              </span>
            </div>
            <Link href="/enroll">
              <Button
                className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0"
                data-testid="button-pricing-enroll"
              >
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
            <h2
              className="text-2xl md:text-3xl font-bold text-white mb-4"
              data-testid="text-cta-title"
            >
              Ready to take control of your credit?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              Enroll online in minutes. No phone calls, no appointments. Sign
              up, sign your agreement, and we'll get to work on your credit
              right away.
            </p>
            <Link href="/enroll">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0"
                data-testid="button-cta-enroll"
              >
                Start My Credit Repair
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-6 text-sm text-white/40">
              No setup fee · $129/mo billed after first month · Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
