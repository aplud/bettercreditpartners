import { Link } from "wouter";
import { 
  Target, 
  GraduationCap, 
  Shield, 
  MapPin,
  ArrowRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Target,
    title: "Our Mission",
    description: "To empower individuals with the knowledge and assistance they need to understand and improve their credit profiles through legitimate, educational, and ethical practices.",
  },
  {
    icon: GraduationCap,
    title: "Education First",
    description: "We believe that understanding how credit works is just as important as disputing inaccurate information. We invest time in educating our clients.",
  },
  {
    icon: Shield,
    title: "Compliance Commitment",
    description: "We strictly adhere to the Credit Repair Organizations Act (CROA), Fair Credit Reporting Act (FCRA), and all applicable state regulations.",
  },
];

const statesServed = ["AL", "AK", "FL", "KY", "MT", "NJ", "NM", "ND", "RI", "SD", "VT", "WY"];

const commitments = [
  "No misleading claims or false promises",
  "Honest assessment of your credit situation",
  "Clear communication throughout the process",
  "Transparent pricing with no hidden fees",
  "Respect for your cancellation rights",
  "Protection of your personal information",
];

export default function About() {
  return (
    <div className="flex flex-col">
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#060414] via-[#123f56] to-[#060414]">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="text-page-title">
              About Better Credit Partners
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              We are a professional credit consulting firm dedicated to helping individuals understand their credit reports and assisting with the dispute of inaccurate information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {values.map((value, index) => (
              <div 
                key={index} 
                className="rounded-2xl bg-[#123f56]/30 border border-white/10 p-8 backdrop-blur-sm text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-xl bg-[#52ceff]/20 flex items-center justify-center mb-6">
                  <value.icon className="h-7 w-7 text-[#52ceff]" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-4" data-testid={`text-value-title-${index}`}>
                  {value.title}
                </h2>
                <p className="text-white/70 leading-relaxed" data-testid={`text-value-desc-${index}`}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-[#060414]">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4" data-testid="text-commitment-title">
              Our Commitment to You
            </h2>
            <p className="text-white/60 text-lg">
              We hold ourselves to the highest standards of ethics and transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commitments.map((commitment, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-4 rounded-xl bg-[#123f56]/20 border border-white/10"
              >
                <Check className="h-5 w-5 text-[#409645] flex-shrink-0" />
                <span className="text-white/90" data-testid={`text-commitment-${index}`}>{commitment}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-br from-[#060414] via-[#123f56]/50 to-[#060414]">
        <div className="max-w-4xl mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MapPin className="h-7 w-7 text-[#52ceff]" />
              <h2 className="text-3xl md:text-4xl font-semibold text-white" data-testid="text-states-title">
                States We Serve
              </h2>
            </div>
            <p className="text-white/60 text-lg">
              We provide credit education and dispute assistance services in 12 states.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3" data-testid="states-list">
            {statesServed.map((state, index) => (
              <span 
                key={index} 
                className="px-4 py-2 rounded-full bg-[#52ceff]/20 text-[#52ceff] font-medium text-sm border border-[#52ceff]/30"
                data-testid={`text-state-${index}`}
              >
                {state}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-r from-[#123f56] to-[#52ceff]/30">
        <div className="max-w-4xl mx-auto px-6 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6" data-testid="text-cta-title">
            Ready to Work With Us?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Start your credit repair journey online. It only takes a few minutes.
          </p>
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
        </div>
      </section>
    </div>
  );
}
