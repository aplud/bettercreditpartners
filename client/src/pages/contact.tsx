import { Helmet } from "react-helmet-async";
import {
  Mail,
  MapPin,
  Clock
} from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "support@bettercreditpartners.com",
    subtext: "We respond within 24 hours",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Miami, FL",
    subtext: "Serving clients nationwide",
  },
  {
    icon: Clock,
    label: "Business Hours",
    value: "Monday - Friday",
    subtext: "9:00 AM - 5:00 PM EST",
  },
];

export default function Contact() {
  return (
    <div className="flex flex-col">
      <Helmet>
        <title>Contact Us | Better Credit Partners</title>
        <meta name="description" content="Get in touch with Better Credit Partners. Email support@bettercreditpartners.com or use our online form. We're here to help with your credit questions." />
      </Helmet>
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#060414] via-[#123f56] to-[#060414]">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" data-testid="text-page-title">
              Contact Us
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Have questions? Ready to get started? Fill out the form below and we'll respond within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <div className="rounded-2xl bg-[#123f56]/30 border border-white/10 overflow-hidden backdrop-blur-sm">
                <div 
                  className="w-full"
                  style={{ height: "600px" }}
                  data-testid="typeform-container"
                >
                  <iframe
                    src="https://form.typeform.com/to/LkCoJUEw"
                    title="Contact Form"
                    className="w-full h-full border-0"
                    allow="camera; microphone; autoplay; encrypted-media;"
                    data-testid="typeform-embed"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white" data-testid="text-info-title">
                  Contact Information
                </h2>
                <p className="text-white/60">
                  We're here to help you with your credit questions.
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((info, index) => (
                  <div 
                    key={index}
                    className="rounded-xl bg-[#123f56]/30 border border-white/10 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#52ceff]/20 flex items-center justify-center flex-shrink-0">
                        <info.icon className="h-5 w-5 text-[#52ceff]" />
                      </div>
                      <div>
                        <div className="font-medium text-white" data-testid={`text-info-label-${index}`}>
                          {info.label}
                        </div>
                        <div className="text-sm text-white/80" data-testid={`text-info-value-${index}`}>
                          {info.value}
                        </div>
                        <div className="text-xs text-white/70" data-testid={`text-info-subtext-${index}`}>
                          {info.subtext}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-[#123f56]/20 border border-white/10 p-4">
                <p className="text-sm text-white/60 leading-relaxed" data-testid="text-response-time">
                  We typically respond to all inquiries within 24 business hours. For urgent matters, please call us directly during business hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
