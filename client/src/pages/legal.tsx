import { Link } from "wouter";
import { 
  Scale, 
  Shield, 
  FileText,
  AlertTriangle,
  Check
} from "lucide-react";

const tableOfContents = [
  { id: "croa", label: "Federal CROA Disclosure" },
  { id: "states", label: "States We Serve" },
  { id: "rights", label: "Your Rights" },
  { id: "cancellation", label: "Cancellation Policy" },
];

export default function Legal() {
  return (
    <div className="flex flex-col">
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#060414] via-[#123f56] to-[#060414]">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Scale className="h-10 w-10 text-[#52ceff]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="text-page-title">
              Legal & Disclosures
            </h1>
            <p className="text-lg text-white/70 max-w-3xl mx-auto">
              Transparency is one of our core values. Below you'll find important legal disclosures required by federal and state law.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 rounded-2xl bg-[#123f56]/30 border border-white/10 p-6">
                <h3 className="font-semibold text-white mb-4">Table of Contents</h3>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-sm text-white/60 hover:text-[#52ceff] transition-colors py-1"
                      data-testid={`link-toc-${item.id}`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-8">
              <section id="croa" className="rounded-2xl bg-[#123f56]/30 border border-white/10 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="h-6 w-6 text-[#52ceff]" />
                  <h2 className="text-2xl font-semibold text-white" data-testid="text-croa-title">
                    Federal CROA Disclosure
                  </h2>
                </div>
                <p className="text-white/70 leading-relaxed mb-6">
                  The Credit Repair Organizations Act (CROA) is a federal law that protects consumers who use credit repair services. As a credit repair organization, we are required to provide you with the following disclosures:
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <Check className="h-5 w-5 text-[#409645] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white mb-1">Right to Cancel</h4>
                      <p className="text-sm text-white/60" data-testid="text-croa-cancel">
                        You have the right to cancel your contract with us within 3 business days of signing without any penalty or obligation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <Check className="h-5 w-5 text-[#409645] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white mb-1">No Guarantee of Results</h4>
                      <p className="text-sm text-white/60" data-testid="text-croa-guarantee">
                        We cannot guarantee any specific results. The removal of inaccurate information depends on the credit bureaus' and creditors' responses.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <Check className="h-5 w-5 text-[#409645] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white mb-1">No Misleading Claims</h4>
                      <p className="text-sm text-white/60" data-testid="text-croa-claims">
                        We will not make any statement or suggest that we can remove accurate information from your credit report.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <Check className="h-5 w-5 text-[#409645] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white mb-1">Direct Dispute Rights</h4>
                      <p className="text-sm text-white/60" data-testid="text-croa-direct">
                        You have the right to dispute inaccurate information in your credit report directly with the credit bureaus at no cost.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section id="states" className="rounded-2xl bg-[#123f56]/30 border border-white/10 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-6 w-6 text-[#52ceff]" />
                  <h2 className="text-2xl font-semibold text-white" data-testid="text-states-title">
                    States We Serve
                  </h2>
                </div>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
                  <p className="text-white/80 leading-relaxed" data-testid="text-states-content">
                    Better Credit Partners provides credit education and dispute assistance services in 12 states:
                  </p>
                  <p className="text-lg font-medium text-[#52ceff]">
                    AL, AK, FL, KY, MT, NJ, NM, ND, RI, SD, VT, WY
                  </p>
                  <p className="text-sm text-white/60">
                    We comply with all applicable federal and state regulations in each state we serve, including CROA and FCRA.
                  </p>
                </div>
              </section>

              <section id="rights" className="rounded-2xl bg-[#123f56]/30 border border-white/10 p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-white mb-6" data-testid="text-rights-title">
                  Your Consumer Rights
                </h2>
                <p className="text-white/70 leading-relaxed mb-6">
                  Under the Fair Credit Reporting Act (FCRA), you have the following rights:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#409645] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">The right to obtain a free copy of your credit report from each bureau once every 12 months at AnnualCreditReport.com.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#409645] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">The right to dispute incomplete or inaccurate information directly with the credit bureaus at no cost.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#409645] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">The right to have credit bureaus correct or delete inaccurate, incomplete, or unverifiable information.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#409645] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">The right to know if information in your file has been used against you.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#409645] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">The right to place a fraud alert or security freeze on your credit file.</span>
                  </li>
                </ul>
              </section>

              <section id="cancellation" className="rounded-2xl bg-[#123f56]/30 border border-white/10 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="h-6 w-6 text-[#c0d353]" />
                  <h2 className="text-2xl font-semibold text-white" data-testid="text-cancel-title">
                    Cancellation Policy
                  </h2>
                </div>
                <p className="text-white/70 leading-relaxed mb-6" data-testid="text-cancel-content">
                  You have the right to cancel your contract with Better Credit Partners:
                </p>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-6">
                  <div>
                    <h4 className="font-medium text-white mb-2">Within 3 Business Days</h4>
                    <p className="text-sm text-white/60">
                      Cancel within 3 business days of signing your agreement with no penalty. You will receive a full refund of any fees paid.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">After 3 Business Days</h4>
                    <p className="text-sm text-white/60">
                      You may cancel at any time after the initial 3-day period. Fees for services already performed are non-refundable.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">How to Cancel</h4>
                    <p className="text-sm text-white/60">
                      To cancel, contact us in writing at our business address or email us at info@bettercreditpartners.com.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-[#060414]">
        <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
          <p className="text-sm text-white/50">
            For questions about these disclosures, please <Link href="/contact" className="text-[#52ceff] hover:underline">contact us</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
