import { useState, useRef, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Loader2,
  FileSignature,
  ShieldCheck,
  Zap,
  AlertTriangle,
  RefreshCw,
  UserCircle,
  Info,
  ChevronDown,
} from "lucide-react";

// ------- Constants -------

const ELIGIBLE_STATES = new Set([
  "AL", "AK", "FL", "KY", "MT", "NJ", "NM", "ND", "RI", "SD", "VT", "WY",
]);

const ALL_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

const CHECKOUT_URL =
  "https://bettercreditpartners.getcredithelpnow.com/checkout-CreditRepairServices";

const STEPS = [
  { label: "Confirm State", icon: MapPin },
  { label: "Your Info", icon: UserCircle },
  { label: "Review Rights", icon: FileSignature },
  { label: "Start Repair", icon: Zap },
];

// ------- Progress Bar -------

function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-10">
      {/* Desktop progress */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Connecting line behind circles */}
        <div className="absolute top-5 left-0 right-0 h-[2px] mx-12">
          <div className="relative w-full h-full bg-white/8 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#52ceff] to-[#c0d353] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {STEPS.map((step, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          const Icon = step.icon;

          return (
            <div key={i} className="flex flex-col items-center z-10 relative">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                  ${isComplete
                    ? "bg-gradient-to-br from-[#52ceff] to-[#c0d353] shadow-[0_0_20px_rgba(82,206,255,0.3)]"
                    : isCurrent
                      ? "bg-[#52ceff]/20 border-2 border-[#52ceff] shadow-[0_0_24px_rgba(82,206,255,0.2)]"
                      : "bg-white/5 border border-white/10"
                  }
                `}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-[#060414]" />
                ) : (
                  <Icon className={`h-5 w-5 ${isCurrent ? "text-[#52ceff]" : "text-white/25"}`} />
                )}
              </div>
              <span
                className={`
                  text-xs mt-2.5 font-medium tracking-wide transition-colors duration-300
                  ${isComplete ? "text-[#c0d353]" : isCurrent ? "text-[#52ceff]" : "text-white/25"}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile progress - compact bar */}
      <div className="sm:hidden">
        <div className="flex gap-2 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= currentStep
                  ? "bg-gradient-to-r from-[#52ceff] to-[#c0d353]"
                  : "bg-white/8"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-[#52ceff] font-medium">
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
        </p>
      </div>
    </div>
  );
}

// ------- Main Enrollment Component -------

export default function Enroll() {
  const [step, setStep] = useState(0);
  const [selectedState, setSelectedState] = useState("");
  const [stateRejected, setStateRejected] = useState(false);
  const [stateConfirmed, setStateConfirmed] = useState(false);
  const [signingLink, setSigningLink] = useState("");
  const [signnowDocumentId, setSignnowDocumentId] = useState("");
  const [signingComplete, setSigningComplete] = useState(false);
  const [signingError, setSigningError] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [showSigningInfo, setShowSigningInfo] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  // ------- SignNow: Create invite mutation -------
  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/signnow/create-invite", {});
      return res.json();
    },
    onSuccess: (data) => {
      setSigningLink(data.signingLink);
      setSignnowDocumentId(data.documentId);
      setSigningError("");
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error) => {
      console.error("SignNow create-invite error:", error);
      setSigningError("We couldn't prepare your signing document. This may be a temporary issue. Please try again in a moment.");
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  // ------- Poll for signing completion -------
  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!signnowDocumentId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/signnow/status/${signnowDocumentId}`);
        const data = await res.json();
        if (data.completed) {
          setSigningComplete(true);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        // Silently retry on next interval
      }
    }, 5000);
  }, [signnowDocumentId]);

  useEffect(() => {
    if (step === 2 && signnowDocumentId) {
      startPolling();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [step, signnowDocumentId, startPolling]);

  // When signing completes, advance to step 3
  useEffect(() => {
    if (signingComplete && step === 2) {
      setTimeout(() => {
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1500);
    }
  }, [signingComplete, step]);

  // ------- Handlers -------

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setStateRejected(false);
    setStateConfirmed(false);
    setWaitlistEmail("");
    setWaitlistSubmitted(false);

    if (ELIGIBLE_STATES.has(value)) {
      setStateConfirmed(true);
    } else {
      setStateRejected(true);
    }
  };

  const handleContinueToSigning = () => {
    createInviteMutation.mutate();
  };

  const handleActivateAccount = () => {
    window.location.href = CHECKOUT_URL;
  };

  const handleRetrySign = () => {
    setSigningError("");
    createInviteMutation.mutate();
  };

  // ------- Step titles -------
  const getStepContent = () => {
    switch (step) {
      case 0:
        return {
          title: "Let's check your eligibility",
          subtitle: "We currently serve clients in select states. Confirm yours below to get started.",
        };
      case 1:
        return {
          title: "Tell us about yourself",
          subtitle: "This helps us set up your account and reach you with updates.",
        };
      case 2:
        return {
          title: signingComplete ? "Disclosure signed!" : "Review & sign your rights disclosure",
          subtitle: signingComplete
            ? "You're all set. Taking you to the next step..."
            : "This document protects your rights as a consumer. It's required by federal law before we can begin.",
        };
      case 3:
        return {
          title: "Activate your account",
          subtitle: "Your disclosure is signed. Set up your account on our secure checkout page to begin.",
        };
      default:
        return { title: "", subtitle: "" };
    }
  };

  const { title, subtitle } = getStepContent();

  // ------- Render -------
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Enroll Now - Start Your Credit Repair | Better Credit Partners</title>
        <meta name="description" content="Sign up for credit repair online in minutes. Check eligibility, sign your disclosure, and activate your account. No phone calls required." />
      </Helmet>
      {/* Compact header banner */}
      <section className="py-8 md:py-10 bg-gradient-to-br from-[#060414] via-[#0d2a3a] to-[#060414] border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 md:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            {title}
          </h1>
          <p className="text-base text-white/60 max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="flex-1 bg-[#060414] py-8 md:py-10">
        <div className={`mx-auto px-4 md:px-8 ${step === 2 ? "max-w-4xl" : "max-w-2xl"}`}>
          <StepProgress currentStep={step} />

          {/* ===== STEP 0: ELIGIBILITY CHECK ===== */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6 md:p-8 space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Which state do you live in?
                  </h2>
                  <p className="text-sm text-white/50">
                    Select your state to confirm we can serve you.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/60 text-sm font-medium">
                    State of residence
                  </Label>
                  <Select onValueChange={handleStateChange} value={selectedState}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 text-base">
                      <SelectValue placeholder="Select your state..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Eligible confirmation */}
                {stateConfirmed && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <p className="text-white text-sm font-medium">
                        We serve clients in{" "}
                        {ALL_STATES.find((s) => s.value === selectedState)?.label}.
                        You're eligible to enroll.
                      </p>
                    </div>

                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0 h-13 text-base"
                      onClick={() => {
                        setStep(1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* Not eligible - waitlist */}
                {stateRejected && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-start gap-3 mb-4">
                      <MapPin className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm mb-1">
                          We're not in your state yet, but we're expanding.
                        </h3>
                        <p className="text-xs text-white/60">
                          Join our waitlist and we'll notify you as soon as we launch in {ALL_STATES.find((s) => s.value === selectedState)?.label}.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden bg-white" style={{ minHeight: "400px" }}>
                      <iframe
                        src="https://form.typeform.com/to/EXhQK2lJ"
                        width="100%"
                        height="400"
                        frameBorder="0"
                        allow="camera; microphone; autoplay; encrypted-media"
                        title="Waitlist Signup"
                        className="block w-full"
                        style={{ minHeight: "400px" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/30 pt-2">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  CROA Compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  256-bit encryption
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Cancel anytime
                </span>
              </div>
            </div>
          )}

          {/* ===== STEP 1: TYPEFORM EMBED ===== */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6 md:p-8">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Tell us a bit about yourself
                  </h2>
                  <p className="text-sm text-white/50">
                    We'll use this to set up your account and keep you updated on your progress.
                  </p>
                </div>
                <div className="rounded-xl overflow-hidden bg-white" style={{ minHeight: "500px" }}>
                  <iframe
                    src="https://form.typeform.com/to/b9iyRKAI"
                    width="100%"
                    height="500"
                    frameBorder="0"
                    allow="camera; microphone; autoplay; encrypted-media"
                    title="Enrollment Information"
                    className="block w-full"
                    style={{ minHeight: "500px" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-white/50 hover:text-white hover:bg-white/5"
                  onClick={() => {
                    setStep(0);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0"
                  disabled={createInviteMutation.isPending}
                  onClick={handleContinueToSigning}
                >
                  {createInviteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Preparing your document...
                    </>
                  ) : (
                    <>
                      Continue to Disclosure
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: SIGNNOW EMBEDDED SIGNING ===== */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Signing iframe with explainer */}
              {signingLink && !signingComplete && !signingError && (
                <div className="space-y-4">
                  {/* What am I signing explainer */}
                  <div className="rounded-xl bg-[#123f56]/20 border border-[#52ceff]/10 p-5">
                    <button
                      onClick={() => setShowSigningInfo(!showSigningInfo)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <span className="text-white font-medium text-sm flex items-center gap-2">
                        <Info className="h-4 w-4 text-[#52ceff]" />
                        What am I signing?
                      </span>
                      <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${showSigningInfo ? "rotate-180" : ""}`} />
                    </button>
                    {showSigningInfo && (
                      <div className="mt-3 text-sm text-white/60 space-y-2 animate-in fade-in duration-200">
                        <p>This is the <strong className="text-white/80">Credit Repair Organizations Act (CROA) disclosure</strong>, a federal document that <strong className="text-white/80">protects your rights</strong> as a consumer.</p>
                        <p>It confirms:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Your right to cancel within 3 business days</li>
                          <li>No upfront fees are charged before services are performed</li>
                          <li>Exactly what services we will and won't provide</li>
                          <li>Your right to dispute items on your own for free</li>
                        </ul>
                        <p>This is required by federal law before any credit repair company can begin work. It's designed to protect you.</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-white/8 bg-white">
                    <iframe
                      ref={iframeRef}
                      src={signingLink}
                      width="100%"
                      title="Sign Credit Repair Disclosure"
                      className="bg-white block w-full"
                      allow="camera"
                      style={{ minHeight: "75vh", height: "900px", maxHeight: "1200px" }}
                    />
                  </div>
                </div>
              )}

              {/* Signing complete state */}
              {signingComplete && (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Document signed successfully
                  </h3>
                  <p className="text-white/60 text-sm">
                    Redirecting you to the next step...
                  </p>
                  <Loader2 className="h-5 w-5 text-[#52ceff] animate-spin mx-auto mt-4" />
                </div>
              )}

              {/* Error state */}
              {signingError && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">
                    Signing session error
                  </h3>
                  <p className="text-white/60 text-sm mb-4">{signingError}</p>
                  <Button
                    onClick={handleRetrySign}
                    className="bg-white/10 border border-white/20 text-white hover:bg-white/15"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              )}

              {/* Loading state (before iframe loads) */}
              {!signingLink && !signingError && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-12 text-center">
                  <Loader2 className="h-8 w-8 text-[#52ceff] animate-spin mx-auto mb-4" />
                  <p className="text-white/60 text-sm">
                    Preparing your disclosure document...
                  </p>
                </div>
              )}

              {/* Back button */}
              {!signingComplete && (
                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-white/50 hover:text-white hover:bg-white/5"
                    onClick={() => {
                      if (pollingRef.current) clearInterval(pollingRef.current);
                      setStep(1);
                      setSigningLink("");
                      setSignnowDocumentId("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <p className="text-xs text-white/30">
                    Complete the signature above to continue
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===== STEP 3: ACTIVATE ACCOUNT ===== */}
          {step === 3 && (
            <div className="space-y-8">
              {/* Success confirmation */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#52ceff]/20 to-[#c0d353]/20 border border-[#52ceff]/20 mb-5">
                  <CheckCircle2 className="h-10 w-10 text-[#52ceff]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  You're almost there
                </h2>
                <p className="text-white/60 max-w-md mx-auto">
                  Your disclosure has been signed. Complete your account setup on our secure checkout page to start the credit repair process.
                </p>
              </div>

              {/* What happens next */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/8 p-6 md:p-8">
                <h3 className="font-semibold text-white text-base mb-5">
                  What happens next
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      num: "1",
                      title: "Complete your signup",
                      desc: "Finish setting up your account on our secure checkout page.",
                    },
                    {
                      num: "2",
                      title: "Get your credit report",
                      desc: "Sign up for IdentityIQ credit monitoring ($35/mo) so we can access your reports and track changes.",
                    },
                    {
                      num: "3",
                      title: "We get to work",
                      desc: "We'll review your report, provide personalized education, and dispute inaccurate items with the bureaus.",
                    },
                  ].map((item) => (
                    <div key={item.num} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#52ceff]/10 border border-[#52ceff]/20 flex items-center justify-center">
                        <span className="text-[#52ceff] text-sm font-bold">{item.num}</span>
                      </div>
                      <div className="pt-0.5">
                        <p className="text-white font-medium text-sm">{item.title}</p>
                        <p className="text-white/50 text-sm mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing reminder */}
              <div className="rounded-2xl bg-[#123f56]/15 border border-[#52ceff]/10 p-5 flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#52ceff]/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-[#52ceff]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">
                    $129/month, billed after your first month
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    You're only billed once we've completed the first month of work. Cancel anytime with no penalties.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-2">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0 text-base px-10 h-14 shadow-[0_0_30px_rgba(82,206,255,0.15)]"
                  onClick={handleActivateAccount}
                >
                  Activate My Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-white/30 mt-3">
                  You'll be redirected to our secure checkout page
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
