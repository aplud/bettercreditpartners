import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck, AlertCircle } from "lucide-react";

interface AgreementStatus {
  signed: boolean;
  signedAt: string | null;
  agreementVersion: string | null;
}

export default function Agreement() {
  const { data: status, isLoading } = useQuery<AgreementStatus>({
    queryKey: ["/api/partners/agreement-status"],
  });

  return (
    <div className="space-y-6 max-w-lg">
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
                {status.signedAt && (
                  <p className="text-sm text-muted-foreground">
                    Signed on{" "}
                    {new Date(status.signedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                {status.agreementVersion && (
                  <p className="text-sm text-muted-foreground">
                    Version: {status.agreementVersion}
                  </p>
                )}
              </div>
            </div>
          ) : (
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
                  Your partner agreement has not been signed yet. Please contact
                  your BCP administrator to arrange agreement signing.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
