import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Partner {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  status: string;
  programName: string;
  leadCount: number;
  convertedCount: number;
  totalEarned: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
};

export default function Partners() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/admin/partners/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: "Partner status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Partners</h1>

      <Card>
        <CardHeader>
          <CardTitle>Partners</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !partners || partners.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No partners registered yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Converted</TableHead>
                  <TableHead>Earned</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow
                    key={partner.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/admin/partners/${partner.id}`)}
                  >
                    <TableCell className="font-medium">{partner.companyName}</TableCell>
                    <TableCell>{partner.contactName}</TableCell>
                    <TableCell>{partner.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[partner.status] ?? ""}
                      >
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.programName}</TableCell>
                    <TableCell>{partner.leadCount}</TableCell>
                    <TableCell>{partner.convertedCount}</TableCell>
                    <TableCell>${(partner.totalEarned / 100).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {partner.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => statusMutation.mutate({ id: partner.id, status: "active" })}
                          >
                            Approve
                          </Button>
                        )}
                        {partner.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => statusMutation.mutate({ id: partner.id, status: "suspended" })}
                          >
                            Suspend
                          </Button>
                        )}
                        {partner.status === "suspended" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => statusMutation.mutate({ id: partner.id, status: "active" })}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
