import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, LinkIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Partner {
  id: string;
  companyName: string;
  contactName: string;
  status: string;
  referralCode: string;
  stats?: {
    leadCount: number;
  };
}

const AVATAR_COLORS = [
  "from-blue-500 to-cyan-400",
  "from-emerald-500 to-teal-400",
  "from-purple-500 to-indigo-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
];

function getTier(leads: number) {
  if (leads >= 30) return { label: "Platinum", color: "bg-purple-100 text-purple-700 border-purple-200" };
  if (leads >= 20) return { label: "Gold", color: "bg-amber-100 text-amber-700 border-amber-200" };
  if (leads >= 10) return { label: "Silver", color: "bg-gray-100 text-gray-600 border-gray-200" };
  return { label: "Bronze", color: "bg-orange-100 text-orange-700 border-orange-200" };
}

export default function AdminReferralLinks() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const baseUrl = window.location.origin;

  const copyLink = (partner: Partner) => {
    const link = `${baseUrl}/?ref=${partner.referralCode || partner.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(partner.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Link copied" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referral Links</h1>
        <p className="text-sm text-gray-500">Unique tracked URLs per partner</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <LinkIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800">
          Each partner has a unique tracking link. When a client clicks and fills out the form, the referral is automatically attributed — for both individual credit repair and business credit.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Partner Referral Links</h3>
              <p className="text-xs text-gray-400">Unique tracked URLs — auto-attribute commissions</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !partners || partners.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No partners yet</p>
          ) : (
            <div className="space-y-3">
              {partners.map((partner, i) => {
                const leadCount = partner.stats?.leadCount ?? 0;
                const tier = getTier(leadCount);
                const link = `${baseUrl}/?ref=${partner.referralCode || partner.id}`;

                return (
                  <div key={partner.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold`}>
                          {partner.contactName?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-gray-900">{partner.contactName}</span>
                          <span className="text-xs text-gray-400 ml-2">{partner.companyName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${tier.color}`}>
                          {tier.label}
                        </Badge>
                        <span className="text-xs text-gray-500">{leadCount} clicks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <span className="text-xs font-mono text-blue-600 flex-1 truncate">{link}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs shrink-0"
                        onClick={() => copyLink(partner)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {copiedId === partner.id ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
