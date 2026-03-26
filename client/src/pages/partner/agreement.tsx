import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgreementStatus {
  status: string;
  signed: boolean;
}

export default function Agreement() {
  const { toast } = useToast();
  const [signingLink, setSigningLink] = useState("");
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const MAX_POLL_ATTEMPTS = 60; // 60 attempts * 5s = 5 minutes

  const { data: status, isLoading } = useQuery<AgreementStatus>({
    queryKey: ["/api/partners/agreement-status"],
    refetchInterval: polling ? 5000 : false,
  });

  // Track poll attempts and stop after max
  useEffect(() => {
    if (polling && status && !status.signed) {
      setPollCount((prev) => {
        const next = prev + 1;
        if (next >= MAX_POLL_ATTEMPTS) {
          setPolling(false);
          setPollTimedOut(true);
        }
        return next;
      });
    }
  }, [status, polling]);

  // Stop polling once signed
  useEffect(() => {
    if (status?.signed) {
      setPolling(false);
      setPollTimedOut(false);
      setSigningLink("");
    }
  }, [status?.signed]);

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/partners/agreement-signing-link");
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.signingLink) {
        setSigningLink(data.signingLink);
        setPolling(true);
      } else {
        toast({ title: "No agreement", description: "No signing document is configured for your program.", variant: "destructive" });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Partner Agreement</h1>

      <Card>
        <CardHeader>
          <CardTitle>Agreement Status</CardTitle>
          <CardDescription>
            Your partner referral agreement status with Better Credit Partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : status?.signed ? (
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <FileCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Agreement Signed</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your partner agreement has been signed and your account is active.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Agreement Pending</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Please sign your partner agreement to activate your account and start submitting leads.
                  </p>
                </div>
              </div>
              {!signingLink && (
                <Button
                  onClick={() => createInviteMutation.mutate()}
                  disabled={createInviteMutation.isPending}
                  className="w-full"
                >
                  {createInviteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing Document...
                    </>
                  ) : (
                    "Sign Agreement Now"
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {signingLink && !status?.signed && (
        <Card>
          <CardHeader>
            <CardTitle>Sign Your Agreement</CardTitle>
            <CardDescription>
              Review and sign the partner referral agreement below
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-b-lg overflow-hidden bg-white">
              <iframe
                ref={iframeRef}
                src={signingLink}
                width="100%"
                title="Sign Partner Agreement"
                className="bg-white block w-full"
                allow="camera"
                style={{ minHeight: "70vh", height: "800px" }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {pollTimedOut && !status?.signed && (
        <Card className="p-6 text-center">
          <p className="text-yellow-400 mb-4">Status check timed out. Click below to check again.</p>
          <Button
            variant="outline"
            onClick={() => {
              setPollCount(0);
              setPollTimedOut(false);
              setPolling(true);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Again
          </Button>
        </Card>
      )}
    </div>
  );
}
