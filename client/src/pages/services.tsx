import { Link } from "wouter";
import { 
  FileSearch, 
  FileText, 
  MessageSquare,
  GraduationCap,
  UserCheck,
  ArrowRight,
  AlertCircle,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: FileSearch,
    title: "Credit Report Analysis",
    description: "Comprehensive review and analysis of your credit reports from all three major bureaus.",
    features: [
      "Detailed review of Equifax, Experian, and TransUnion reports",
      "Identification of potentially inaccurate items",
      "Analysis of factors affecting your credit score",
      "Clear explanation of findings in plain language",
    ],
  },
  {
    icon: FileText,
    title: "Dispute Letter Preparation",
    description: "Professional assistance with drafting and organizing dispute letters under FCRA guidelines.",
    features: [
      "Customized dispute letters for each issue",
      "Proper documentation organization",
      "Strategic dispute approach",
      "Tracking and follow-up on submissions",
    ],
  },
  {
    icon: MessageSquare,
    title: "Creditor Communication",
    description: "Help with communicating with creditors regarding disputed account information.",
    features: [
      "Draft communications to creditors",
      "Guidance on debt validation requests",
      "Assistance with goodwill letters",
      "Response tracking and follow-up",
    ],
  },
  {
    icon: GraduationCap,
    title: "Credit Education & Priority Support",
    description: "Personalized credit education calls with our team, plus priority support throughout your program.",
    features: [
      "One-on-one credit education calls",
      "Priority customer support access",
      "Best practices for credit utilization",
      "Long-term credit management planning",
    ],
  },
  {
    icon: UserCheck,
    title: "Identity Issue Guidance",
    description: "Assistance with addressing identity-related issues on your credit reports.",
    features: [
      "Mixed file identification",
      "Fraud alert guidance",
      "Identity theft dispute assistance",
      "Security freeze recommendations",
    ],
  },
];

const notOffered = [
  "Guaranteed results or specific point increases",
  "Removal of accurate, verified information",
  "Debt elimination or settlement services",
  "Legal advice or representation",
];

export default function Services() {
  return (
    <div className="flex flex-col">
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#060414] via-[#123f56] to-[#060414]">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="text-page-title">
              Our Services
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              We offer credit education and dispute assistance services designed to help you improve your credit through legitimate, FCRA-compliant methods.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="rounded-2xl bg-[#123f56]/30 border border-white/10 p-6 backdrop-blur-sm flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-[#52ceff]/20 flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-[#52ceff]" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2" data-testid={`text-service-title-${index}`}>
                  {service.title}
                </h2>
                <p className="text-white/60 text-sm mb-4" data-testid={`text-service-desc-${index}`}>
                  {service.description}
                </p>
                <ul className="space-y-2 mt-auto">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-[#409645] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80" data-testid={`text-feature-${index}-${featureIndex}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#060414]">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white text-lg mb-4" data-testid="text-not-offered-title">
                  What We Do NOT Offer
                </h3>
                <p className="text-white/70 mb-4">
                  In compliance with federal and state regulations, we want to be clear about what our services do not include:
                </p>
                <ul className="space-y-2">
                  {notOffered.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-2" />
                      <span className="text-white/70" data-testid={`text-not-offered-${index}`}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-r from-[#123f56] to-[#52ceff]/30">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6" data-testid="text-cta-title">
            Learn More About How We Can Help
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Enroll online in minutes. No phone call required.
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
