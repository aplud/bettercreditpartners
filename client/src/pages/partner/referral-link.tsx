import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check } from "lucide-react";

interface PartnerProfile {
  id: string;
  referralCode: string;
  companyName: string;
}

export default function ReferralLink() {
  const [copied, setCopied] = useState(false);

  const { data: profile, isLoading } = useQuery<PartnerProfile>({
    queryKey: ["/api/partners/me"],
  });

  const referralUrl = profile
    ? `${window.location.origin}/ref/${profile.referralCode}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Referral Link</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral URL</CardTitle>
          <CardDescription>
            Share this link with potential clients. When they sign up through
            your link, the lead will be automatically attributed to you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex gap-2">
              <Input value={referralUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Share</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
            <li>
              Share the link directly with potential clients via email, text, or
              social media.
            </li>
            <li>
              Include it on your website or in your marketing materials.
            </li>
            <li>
              When someone visits the link and submits their information, the
              lead is automatically assigned to you.
            </li>
            <li>
              You can also manually submit leads through the "Submit Lead" page.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
