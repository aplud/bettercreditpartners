import { Link } from "wouter";
import { Mail, MapPin } from "lucide-react";
import logoUrl from "@assets/BCP-ISOLOGO_1768516740168.png";

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="Better Credit Partners" className="h-12 w-auto" data-testid="img-footer-logo" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional credit education and dispute assistance services. We help clients understand their credit reports and dispute inaccurate information.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-home">
                Home
              </Link>
              <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-how-it-works">
                How It Works
              </Link>
              <Link href="/services" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-services">
                Services
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-pricing">
                Pricing
              </Link>
              <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-about">
                About
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-contact">
                Contact
              </Link>
              <Link href="/partner-program" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-partner-program">
                Partner Program
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Legal</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/legal" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-legal">
                Legal & Disclosures
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-privacy">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-terms">
                Terms of Service
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span data-testid="text-footer-email">support@bettercreditpartners.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span data-testid="text-footer-address">Miami, FL</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="bg-muted rounded-lg p-6 space-y-4">
            <h4 className="font-semibold text-sm">Important Disclosures</h4>
            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p data-testid="text-croa-disclosure">
                <strong>Cancellation Rights:</strong> You have the right to cancel your contract with us within 3 business days of signing without any penalty or obligation.
              </p>
              <p data-testid="text-croa-results">
                <strong>No Guarantee of Results:</strong> We cannot guarantee any specific results. The removal of inaccurate, unverifiable, or outdated information from your credit report depends on the credit bureaus' and creditors' responses.
              </p>
              <p data-testid="text-croa-direct">
                <strong>Your Rights:</strong> You have the right to dispute inaccurate information in your credit report directly with credit bureaus at no cost.
              </p>
              <p data-testid="text-states-disclosure">
                <strong>States Served:</strong> We provide credit education and dispute assistance services in AL, AK, FL, KY, MT, NJ, NM, ND, RI, SD, VT, and WY.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            {new Date().getFullYear()} Better Credit Partners. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
