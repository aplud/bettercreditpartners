import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  DollarSign,
  Users,
  Clock,
  BarChart3,
  Link as LinkIcon,
  FileText,
  Handshake,
} from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "$50 Per Conversion",
    description: "Earn a flat $50 commission for every qualified referral who enrolls and stays active through the 91-day retention period.",
  },
  {
    icon: LinkIcon,
    title: "Unique Referral Link",
    description: "Get a personal referral link with a 5-business-day attribution window. Share it anywhere — your leads are automatically tracked.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description: "Track your leads, conversions, and commissions in real time through your partner portal.",
  },
  {
    icon: Clock,
    title: "Quarterly Payouts",
    description: "Commissions are paid quarterly (fiscal quarters) via ACH, PayPal, or Venmo.",
  },
  {
    icon: FileText,
    title: "Simple Agreement",
    description: "Sign your partner agreement electronically. No paperwork, no hassle.",
  },
  {
    icon: Users,
    title: "Free to Join",
    description: "No fees, no minimums, no obligations. Refer as many or as few clients as you want.",
  },
];

const steps = [
  { num: "1", title: "Sign Up", description: "Create your partner account — it's free with no minimums." },
  { num: "2", title: "Sign Agreement", description: "Review and e-sign your partner agreement." },
  { num: "3", title: "Share & Refer", description: "Use your referral link or submit leads through the portal." },
  { num: "4", title: "Get Paid", description: "Earn commissions when your referrals convert and stay active." },
];

export default function PartnerProgram() {
  return (
    <div className="flex flex-col bg-[#060414]">
      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c0d353]/20 text-[#c0d353] font-semibold text-sm mb-6">
            <Handshake className="h-4 w-4" />
            Partner Referral Program
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight">
            Earn money helping people fix their credit
          </h1>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Join our referral partner program. Refer clients to Better Credit Partners
            and earn $50 for every conversion. Free to join, no minimums.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#c0d353] to-[#52ceff] text-[#060414] font-bold border-0"
              >
                Become a Partner
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/5 border-white/20 text-white"
              >
                Partner Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Why partner with us?</h2>
          <p className="text-white/60 mb-8">Everything you need to earn commissions with zero overhead.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <Icon className="h-8 w-8 text-[#52ceff] mb-4" />
                  <p className="font-semibold text-white mb-2">{benefit.title}</p>
                  <p className="text-sm text-white/60">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">How it works</h2>
          <p className="text-white/60 mb-8">Four simple steps to start earning.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-[#c0d353]/20 border border-[#c0d353]/30 flex items-center justify-center font-bold text-[#c0d353] mb-4">
                  {step.num}
                </div>
                <p className="font-semibold text-white mb-2">{step.title}</p>
                <p className="text-sm text-white/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Details */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="rounded-2xl bg-[#123f56]/20 border border-white/10 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-white mb-6">Commission Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#409645] mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">$50 flat commission per qualified referral</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#409645] mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">91-day retention period before commission is earned</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#409645] mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Quarterly payouts via ACH, PayPal, or Venmo</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#409645] mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">5-business-day attribution window on referral links</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#409645] mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Submit leads via form or share your unique link</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-[#409645] mt-0.5 flex-shrink-0" />
                  <p className="text-white/80">Your commission terms are locked in at signup</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-[#123f56]/40 to-[#123f56]/20 border border-white/10 p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to start earning?
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              Sign up in minutes. No fees, no commitments. Start referring clients
              and earning commissions today.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#c0d353] to-[#52ceff] text-[#060414] font-bold border-0"
              >
                Become a Partner
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
