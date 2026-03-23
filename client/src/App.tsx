import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import HowItWorks from "@/pages/how-it-works";
import Services from "@/pages/services";
import Pricing from "@/pages/pricing";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Enroll from "@/pages/enroll";
import Legal from "@/pages/legal";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/protected-route";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import PartnerLayout from "@/pages/partner/partner-layout";
import PartnerDashboard from "@/pages/partner/dashboard";
import SubmitLead from "@/pages/partner/submit-lead";
import MyLeads from "@/pages/partner/my-leads";
import Commissions from "@/pages/partner/commissions";
import ReferralLink from "@/pages/partner/referral-link";
import Agreement from "@/pages/partner/agreement";
import Profile from "@/pages/partner/profile";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/services" component={Services} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/enroll" component={Enroll} />
      <Route path="/legal" component={Legal} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />

      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Partner routes */}
      <Route path="/partner/:rest*">
        <ProtectedRoute role="partner">
          <PartnerLayout>
            <Switch>
              <Route path="/partner" component={PartnerDashboard} />
              <Route path="/partner/submit-lead" component={SubmitLead} />
              <Route path="/partner/leads" component={MyLeads} />
              <Route path="/partner/commissions" component={Commissions} />
              <Route path="/partner/referral-link" component={ReferralLink} />
              <Route path="/partner/agreement" component={Agreement} />
              <Route path="/partner/profile" component={Profile} />
            </Switch>
          </PartnerLayout>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isPortalRoute =
    location.startsWith("/partner") ||
    location.startsWith("/admin") ||
    location === "/login" ||
    location === "/register";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="bcc-ui-theme">
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <ScrollToTop />
            {!isPortalRoute && <Header />}
            <main className="flex-1">
              <Router />
            </main>
            {!isPortalRoute && <Footer />}
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
