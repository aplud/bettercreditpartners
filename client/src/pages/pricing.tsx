import { Link } from "wouter";
import {
  Check,
  ArrowRight,
  Info,
  Headphones,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const serviceFeatures = [
  "Full credit report review across all three bureaus",
  "Identification and dispute of inaccurate items",
  "Unlimited credit bureau disputes",
  "Unlimited creditor disputes",
  "Personalized dispute letters",
  "Priority customer support",
  "Credit education calls with our team",
  "Ongoing monitoring of dispute results",
];

export default function Pricing() {
  return (
    <div className="flex flex-col">
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#060414] via-[#123f56] to-[#060414]">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="text-page-title">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-white/70">
              No setup fees. No hidden costs. You only pay after we start working for you.
            </p>
          </div>

          {/* Pricing Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Step 1: Sign Up */}
            <div className="rounded-2xl bg-[#123f56]/30 border border-white/10 p-8 flex flex-col items-center text-center backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-[#52ceff]/20 flex items-center justify-center mb-4">
                <span className="text-[#52ceff] font-bold text-lg">1</span>
              </div>
              <p className="font-bold text-white text-xl mb-2">Sign Up</p>
              <p className="text-4xl font-bold text-green-400 mb-2">Free</p>
              <p className="text-white/60 text-sm">
                Enroll online, sign the disclosure, and set up your account. No payment required to get started.
              </p>
            </div>

            {/* Step 2: Credit Report */}
            <div className="rounded-2xl bg-[#123f56]/30 border border-white/10 p-8 flex flex-col items-center text-center backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-[#52ceff]/20 flex items-center justify-center mb-4">
                <span className="text-[#52ceff] font-bold text-lg">2</span>
              </div>
              <p className="font-bold text-white text-xl mb-2">Credit Report</p>
              <p className="text-4xl font-bold text-white mb-2">$35</p>
              <p className="text-white/60 text-sm">
                Sign up for IdentityIQ so we can pull your credit report, review it with you, and provide credit education.
              </p>
            </div>

            {/* Step 3: Monthly Service */}
            <div className="rounded-2xl bg-[#123f56]/30 border border-[#52ceff]/30 p-8 flex flex-col items-center text-center backdrop-blur-sm relative">
              <div className="absolute -top-3 px-4 py-1 rounded-full bg-[#52ceff] text-[#060414] text-xs font-bold">
                BILLED AFTER 1ST MONTH
              </div>
              <div className="w-12 h-12 rounded-full bg-[#52ceff]/20 flex items-center justify-center mb-4">
                <span className="text-[#52ceff] font-bold text-lg">3</span>
              </div>
              <p className="font-bold text-white text-xl mb-2">Monthly Service</p>
              <p className="text-4xl font-bold text-white mb-2">$129<span className="text-lg text-white/50">/mo</span></p>
              <p className="text-white/60 text-sm">
                We dispute items on your behalf. You're only billed after the first month of work is complete. Cancel anytime.
              </p>
            </div>
          </div>

          {/* What's Included */}
          <div className="rounded-2xl bg-[#123f56]/30 border border-white/10 p-8 backdrop-blur-sm mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              What's Included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {serviceFeatures.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/90 py-3">
                  <Check className="h-5 w-5 text-[#409645] flex-shrink-0" />
                  <span data-testid={`text-feature-${i}`}>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
                <Headphones className="h-5 w-5 text-[#52ceff] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Priority Support</p>
                  <p className="text-sm text-white/60">
                    Direct access to our team throughout your program
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
                <BookOpen className="h-5 w-5 text-[#52ceff] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Credit Education Calls</p>
                  <p className="text-sm text-white/60">
                    Personalized sessions to help you understand and improve your scores
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link href="/enroll">
                <Button size="lg" className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0 px-10" data-testid="button-enroll">
                  ENROLL NOW
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="mt-3 text-sm text-white/50">
                You can dispute items yourself for free — we're here if you want expert help managing the process.
              </p>
            </div>
          </div>

          {/* Disclosures */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="flex gap-4">
                <Info className="h-6 w-6 text-[#52ceff] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2" data-testid="text-disclosure-title">
                    Mandatory Federal Disclosure
                  </h3>
                  <p className="text-white/70 leading-relaxed" data-testid="text-disclosure-content">
                    "Federal law prohibits credit repair companies from charging fees before services are fully performed unless permitted by state law and properly bonded. You are not charged for services that have not yet been performed."
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <div className="flex gap-4">
                <Info className="h-5 w-5 text-[#52ceff] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-2" data-testid="text-states-title">States We Serve</h4>
                  <p className="text-sm text-white/70 leading-relaxed" data-testid="text-states-served">
                    We serve clients in <span className="font-medium text-white">AL, AK, FL, KY, MT, NJ, NM, ND, RI, SD, VT, WY</span>. We comply with all applicable federal and state regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-[#060414]">
        <div className="max-w-3xl mx-auto px-6 md:px-8">
          <div className="text-center space-y-4">
            <h3 className="font-semibold text-white" data-testid="text-cancellation-title">
              Your Cancellation Rights
            </h3>
            <p className="text-sm text-white/60" data-testid="text-cancellation-content">
              You have the right to cancel your contract with us within 3 business days of signing without any penalty or obligation. After the cancellation period, you may cancel at any time, though fees for services already performed are non-refundable.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-r from-[#123f56] to-[#52ceff]/30">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6" data-testid="text-cta-title">
            Questions About Pricing?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Reach out and we'll walk you through how it works.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0 px-8"
              data-testid="button-cta-contact"
            >
              Contact Us
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
