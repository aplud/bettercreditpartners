import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  FileCheck,
  CreditCard,
  Link as LinkIcon,
  UserPlus,
  Check,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface Partner {
  id: string;
  status: string;
  paymentMethod: string;
  paymentDetails: string;
  referralCode: string;
}

interface AgreementStatus {
  status: string;
  signed: boolean;
}

interface Lead {
  id: string;
}

interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  icon: React.ElementType;
  isComplete: boolean;
  isBlocking?: boolean;
  blockMessage?: string;
}

export function PartnerOnboarding() {
  const [, navigate] = useLocation();

  const { data: meData, isLoading: meLoading } = useQuery<{ partner: Partner }>({
    queryKey: ["/api/partners/me"],
  });

  const { data: agreementData, isLoading: agreementLoading } = useQuery<AgreementStatus>({
    queryKey: ["/api/partners/agreement-status"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/partners/leads"],
  });

  const partner = meData?.partner;
  const isLoading = meLoading || agreementLoading || leadsLoading;

  if (isLoading || !partner) return null;

  const agreementSigned = agreementData?.signed === true;
  const hasPaymentMethod = !!partner.paymentMethod && partner.paymentMethod.length > 0;
  const hasLeads = (leads?.length ?? 0) > 0;

  const steps: OnboardingStep[] = [
    {
      key: "agreement",
      title: "Sign Your Partner Agreement",
      description: "Required before you can earn commissions. Review and e-sign the referral agreement.",
      href: "/partner/agreement",
      ctaLabel: agreementSigned ? "View Agreement" : "Sign Agreement",
      icon: FileCheck,
      isComplete: agreementSigned,
      isBlocking: !agreementSigned,
      blockMessage: "You must sign the partner agreement before you can submit leads or earn commissions.",
    },
    {
      key: "payment",
      title: "Confirm Payment Info",
      description: "Make sure your payment method is set so you can receive your commission payouts.",
      href: "/partner/profile",
      ctaLabel: hasPaymentMethod ? "Update Payment Info" : "Set Up Payment",
      icon: CreditCard,
      isComplete: hasPaymentMethod,
    },
    {
      key: "referral",
      title: "Get Your Referral Link",
      description: "Copy your unique referral link to share with potential clients via email, social media, or your website.",
      href: "/partner/referral-link",
      ctaLabel: "Copy Referral Link",
      icon: LinkIcon,
      isComplete: agreementSigned && hasPaymentMethod,
    },
    {
      key: "lead",
      title: "Submit Your First Lead",
      description: "Submit a lead through the portal, or share your referral link and let clients come to you.",
      href: "/partner/submit-lead",
      ctaLabel: "Submit a Lead",
      icon: UserPlus,
      isComplete: hasLeads,
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const allComplete = completedCount === steps.length;

  // Don't show onboarding if all steps are complete
  if (allComplete) return null;

  // Find the current (first incomplete) step
  const currentStepIndex = steps.findIndex((s) => !s.isComplete);
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="rounded-xl border bg-card">
      {/* Header with progress */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#c0d353]/20 to-[#52ceff]/20">
            <Sparkles className="h-4 w-4 text-[#52ceff]" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Welcome to BCP Partners</h2>
            <p className="text-xs text-muted-foreground">
              Complete these steps to start earning commissions
            </p>
          </div>
          <div className="ml-auto text-right">
            <span className="text-sm font-medium">{completedCount}/{steps.length}</span>
            <p className="text-xs text-muted-foreground">complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#c0d353] to-[#52ceff] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Blocking alert */}
      {!agreementSigned && (
        <div className="mx-5 mb-3 flex items-start gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Your account is pending until you sign the partner agreement. You won't be able to submit leads or earn commissions until it's signed.
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="px-5 pb-5 space-y-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = index === currentStepIndex;
          const isPastBlocking = !agreementSigned && index > 0;

          return (
            <div
              key={step.key}
              className={`group flex items-center gap-3 rounded-lg border p-3 transition-all ${
                step.isComplete
                  ? "bg-muted/30 border-muted"
                  : isCurrent
                  ? "bg-card border-border shadow-sm"
                  : "bg-muted/10 border-transparent"
              }`}
            >
              {/* Status indicator */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                  step.isComplete
                    ? "bg-green-100 dark:bg-green-900/30"
                    : isCurrent
                    ? "bg-[#52ceff]/10"
                    : "bg-muted"
                }`}
              >
                {step.isComplete ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <Icon
                    className={`h-4 w-4 ${
                      isCurrent ? "text-[#52ceff]" : "text-muted-foreground"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    step.isComplete
                      ? "text-muted-foreground line-through"
                      : ""
                  }`}
                >
                  {step.title}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>

              {/* CTA */}
              {!step.isComplete && (
                <Button
                  size="sm"
                  variant={isCurrent ? "default" : "ghost"}
                  className={`shrink-0 ${
                    isCurrent
                      ? "bg-[#52ceff] hover:bg-[#52ceff]/90 text-[#060414] font-medium"
                      : "text-muted-foreground"
                  }`}
                  disabled={isPastBlocking && !agreementSigned}
                  onClick={() => navigate(step.href)}
                >
                  {isCurrent ? step.ctaLabel : ""}
                  {isCurrent && <ChevronRight className="ml-1 h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Program terms summary */}
      <div className="border-t px-5 py-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span>$50 per qualified referral</span>
          <span>91-day retention period</span>
          <span>Quarterly payouts</span>
          <span>ACH / PayPal / Venmo</span>
        </div>
      </div>
    </div>
  );
}
