import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import bcpLogo from "@assets/BCP-ISOLOGO_1768516740168.png";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  paymentDetails: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "signing" | "done">("form");
  const [signingLink, setSigningLink] = useState("");
  const [signnowDocumentId, setSignnowDocumentId] = useState("");
  const [signingComplete, setSigningComplete] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      paymentMethod: "",
      paymentDetails: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/partners/register", data);
      return await res.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      // If a signing link was returned, show the signing step
      if (data.signingLink) {
        setSigningLink(data.signingLink);
        setStep("signing");
      } else {
        // No signing needed — go to dashboard
        navigate("/partner");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message.includes("409")
          ? "Username or email already exists"
          : error.message,
        variant: "destructive",
      });
    },
  });

  const [pollTimedOut, setPollTimedOut] = useState(false);
  const MAX_POLL_ATTEMPTS = 60; // 60 attempts * 5s = 5 minutes

  // Poll for signing completion
  const startPolling = () => {
    if (!signnowDocumentId) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts >= MAX_POLL_ATTEMPTS) {
        clearInterval(interval);
        setPollTimedOut(true);
        return;
      }
      try {
        const res = await fetch(`/api/signnow/status/${signnowDocumentId}`);
        const data = await res.json();
        if (data.signed) {
          setSigningComplete(true);
          clearInterval(interval);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (step === "signing" && signnowDocumentId) {
      setPollTimedOut(false);
      return startPolling();
    }
  }, [step, signnowDocumentId]);

  // When signing completes, transition to done
  useEffect(() => {
    if (signingComplete) {
      setStep("done");
      setTimeout(() => navigate("/partner"), 2000);
    }
  }, [signingComplete, navigate]);

  const inputClasses = "bg-white/10 border-white/10 text-white placeholder:text-white/60 focus:border-[#52ceff]/50";

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#060414] py-8">
      <div className="w-full max-w-lg mx-4">
        <div className="flex flex-col items-center mb-8">
          <img src={bcpLogo} alt="Better Credit Partners" className="h-16 w-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Become a Partner</h1>
          <p className="text-white/70 text-sm mt-1">Register to start earning commissions on referrals</p>
        </div>

        {step === "form" && (
          <form
            onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white/80">Username</Label>
                <Input id="username" placeholder="Choose a username" className={inputClasses} {...form.register("username")} />
                {form.formState.errors.username && <p className="text-sm text-red-400">{form.formState.errors.username.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Choose a password" className={`${inputClasses} pr-10`} {...form.register("password")} />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-white/80">Contact Name</Label>
                <Input id="contactName" placeholder="Your full name" className={inputClasses} {...form.register("contactName")} />
                {form.formState.errors.contactName && <p className="text-sm text-red-400">{form.formState.errors.contactName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-white/80">Company Name</Label>
                <Input id="companyName" placeholder="Your company name" className={inputClasses} {...form.register("companyName")} />
                {form.formState.errors.companyName && <p className="text-sm text-red-400">{form.formState.errors.companyName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" className={inputClasses} {...form.register("email")} />
                {form.formState.errors.email && <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white/80">Phone</Label>
                <Input id="phone" type="tel" placeholder="(555) 123-4567" className={inputClasses} {...form.register("phone")} />
                {form.formState.errors.phone && <p className="text-sm text-red-400">{form.formState.errors.phone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/80">Payment Method</Label>
                <Select onValueChange={(value) => form.setValue("paymentMethod", value)}>
                  <SelectTrigger className={inputClasses}>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ach">ACH (Direct Deposit)</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.paymentMethod && <p className="text-sm text-red-400">{form.formState.errors.paymentMethod.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDetails" className="text-white/80">Payment Details</Label>
                <Input id="paymentDetails" placeholder="e.g. PayPal email" className={inputClasses} {...form.register("paymentDetails")} />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#c0d353] to-[#52ceff] text-[#060414] font-bold border-0 hover:opacity-90"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              {!registerMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
            <p className="text-sm text-white/60 text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-[#52ceff] hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-white/60 text-center">
              <Link href="/" className="hover:text-white/70 transition-colors">
                &larr; Back to website
              </Link>
            </p>
          </form>
        )}

        {step === "signing" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <h2 className="text-lg font-semibold text-white mb-2">Sign Your Partner Agreement</h2>
              <p className="text-white/70 text-sm mb-4">
                Please review and sign the partner referral agreement below to activate your account.
              </p>
            </div>
            {signingLink && !signingComplete && (
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white">
                <iframe
                  ref={iframeRef}
                  src={signingLink}
                  width="100%"
                  title="Sign Partner Agreement"
                  className="bg-white block w-full"
                  allow="camera"
                  style={{ minHeight: "75vh", height: "900px", maxHeight: "1200px" }}
                />
              </div>
            )}
            {!signingLink && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-white/70 text-sm mb-4">
                  No signing document is required for this program. You can proceed to your dashboard.
                </p>
                <Button
                  onClick={() => navigate("/partner")}
                  className="bg-gradient-to-r from-[#c0d353] to-[#52ceff] text-[#060414] font-bold border-0"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
            {pollTimedOut && !signingComplete && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-center">
                <p className="text-yellow-300 text-sm mb-4">Status check timed out. Click below to check again.</p>
                <Button
                  variant="outline"
                  className="text-white border-white/20"
                  onClick={() => {
                    setPollTimedOut(false);
                    startPolling();
                  }}
                >
                  Check Again
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full text-white/60 hover:text-white/80"
              onClick={() => navigate("/partner")}
            >
              Skip for now — sign later from your dashboard
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Agreement Signed!</h2>
            <p className="text-white/60 text-sm">Redirecting to your dashboard...</p>
            <Loader2 className="h-5 w-5 text-[#52ceff] animate-spin mx-auto mt-4" />
          </div>
        )}
      </div>
    </div>
  );
}
