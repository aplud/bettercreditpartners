import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface SheetsStatus {
  configured: boolean;
  lastSyncTime: string | null;
  lastError: string | null;
  pendingTables: string[];
}

export default function SheetsSync() {
  const { toast } = useToast();

  const { data: status, isLoading } = useQuery<SheetsStatus>({
    queryKey: ["/api/admin/sheets/status"],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/sheets/sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sheets/status"] });
      toast({ title: "Sync completed successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Google Sheets Sync</h1>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : !status ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Unable to fetch sync status.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-32">Configured:</span>
                {status.configured ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-32">Last Sync:</span>
                <span className="text-sm">
                  {status.lastSyncTime
                    ? new Date(status.lastSyncTime).toLocaleString()
                    : "Never"}
                </span>
              </div>

              {status.lastError && (
                <div className="flex items-start gap-3">
                  <span className="text-sm text-muted-foreground w-32">Last Error:</span>
                  <span className="text-sm text-red-600">{status.lastError}</span>
                </div>
              )}

              <div className="flex items-start gap-3">
                <span className="text-sm text-muted-foreground w-32">Pending Tables:</span>
                <div>
                  {status.pendingTables && status.pendingTables.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {status.pendingTables.map((table) => (
                        <Badge key={table} variant="outline">
                          {table}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
