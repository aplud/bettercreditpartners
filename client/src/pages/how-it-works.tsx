import { Link } from "wouter";
import { 
  FileSearch, 
  ClipboardList, 
  Send, 
  BookOpen,
  ArrowRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: FileSearch,
    title: "Sign Up Online",
    description: "Enroll through our simple online process. We'll review your credit reports from all three major bureaus and identify what's reporting and how it's affecting your score.",
    details: [
      "No impact on your credit score",
      "Comprehensive review of all three bureaus",
      "Identification of potentially disputable items",
      "Clear explanation of what we find",
    ],
  },
  {
    number: "02",
    icon: ClipboardList,
    title: "Personalized Action Plan",
    description: "Based on our analysis, we create a customized plan tailored to your specific situation. This plan outlines which items may be disputed under the Fair Credit Reporting Act (FCRA).",
    details: [
      "Customized to your unique situation",
      "Based on FCRA-allowed disputes",
      "Clear timeline expectations",
      "Educational resources included",
    ],
  },
  {
    number: "03",
    icon: Send,
    title: "Dispute Assistance",
    description: "We help you draft and submit professional dispute letters to the credit bureaus and/or creditors. Each dispute is carefully crafted to address the specific inaccuracy identified.",
    details: [
      "Professional dispute letter drafting",
      "Submission to appropriate parties",
      "Tracking of all communications",
      "Follow-up on responses",
    ],
  },
  {
    number: "04",
    icon: BookOpen,
    title: "Ongoing Education & Priority Support",
    description: "Throughout the process, you have access to priority customer support and credit education calls with our team. We help you understand your scores and build habits that last.",
    details: [
      "Priority customer support throughout your program",
      "Personalized credit education calls",
      "Understanding credit scoring factors",
      "Long-term credit building strategies",
    ],
  },
];

export default function HowItWorks() {
  return (
    <div className="flex flex-col">
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#060414] via-[#123f56] to-[#060414]">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="text-page-title">
              How It Works
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Our transparent, step-by-step process is designed to help you understand every aspect of credit dispute assistance.
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#52ceff] to-[#c0d353] flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#060414]" data-testid={`text-step-number-${index}`}>
                        {step.number}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 rounded-2xl bg-[#123f56]/30 border border-white/10 p-6 md:p-8 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <step.icon className="h-6 w-6 text-[#52ceff]" />
                      <h2 className="text-xl md:text-2xl font-semibold text-white" data-testid={`text-step-title-${index}`}>
                        {step.title}
                      </h2>
                    </div>
                    <p className="text-white/70 mb-6 leading-relaxed" data-testid={`text-step-desc-${index}`}>
                      {step.description}
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center gap-3 text-sm text-white/80">
                          <div className="w-2 h-2 rounded-full bg-[#409645] flex-shrink-0" />
                          <span data-testid={`text-step-detail-${index}-${detailIndex}`}>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#060414]">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="rounded-2xl bg-[#123f56]/20 border border-white/10 p-6 md:p-8">
            <div className="flex gap-4">
              <Info className="h-6 w-6 text-[#c0d353] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white text-lg mb-2" data-testid="text-disclaimer-title">
                  Important Information
                </h3>
                <p className="text-white/70 leading-relaxed" data-testid="text-disclaimer-content">
                  Results vary. We do not remove accurate, current, or verifiable information. The Fair Credit Reporting Act (FCRA) gives you the right to dispute information you believe to be inaccurate. Credit bureaus must investigate disputes and respond within specific timeframes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-r from-[#123f56] to-[#52ceff]/30">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6" data-testid="text-cta-title">
            Ready to Get Started?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Start your credit repair journey online — no phone call required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/enroll">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#52ceff] to-[#c0d353] text-[#060414] font-bold border-0 px-8"
                data-testid="button-cta-enroll"
              >
                Start My Credit Repair
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/5 border-white/20 text-white px-8"
                data-testid="button-cta-contact"
              >
                Have Questions?
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
