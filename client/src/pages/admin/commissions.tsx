import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";

interface Commission {
  id: string;
  partnerName: string;
  leadName: string;
  amount: number;
  status: string;
  eligibleDate: string | null;
  paidDate: string | null;
  quarter: string;
}

interface PartnerOption {
  id: string;
  companyName: string;
}

const statusColors: Record<string, string> = {
  pending_retention: "bg-yellow-100 text-yellow-800",
  eligible: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  voided: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending_retention: "In Retention",
  eligible: "Eligible",
  paid: "Paid",
  voided: "Voided",
};

export default function AdminCommissions() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");

  const queryParams = new URLSearchParams();
  if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter);
  if (partnerFilter && partnerFilter !== "all") queryParams.set("partnerId", partnerFilter);
  const qs = queryParams.toString();

  const { data: commissions, isLoading } = useQuery<Commission[]>({
    queryKey: [`/api/admin/commissions${qs ? `?${qs}` : ""}`],
  });

  const { data: partners } = useQuery<PartnerOption[]>({
    queryKey: ["/api/admin/partners"],
  });

  const voidMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/commissions/${id}/void`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commissions"] });
      setVoidDialogOpen(false);
      setVoidingId(null);
      setVoidReason("");
      toast({ title: "Commission voided" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const retentionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/commissions/check-retention");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commissions"] });
      toast({ title: "Retention check complete" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commission Tracker</h1>
        <Button
          variant="outline"
          onClick={() => retentionMutation.mutate()}
          disabled={retentionMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${retentionMutation.isPending ? "animate-spin" : ""}`} />
          Check Retention
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_retention">In Retention</SelectItem>
              <SelectItem value="eligible">Eligible</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="voided">Voided</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={partnerFilter} onValueChange={setPartnerFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              {partners?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !commissions || commissions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No commissions found.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Eligible Date</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Quarter</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.partnerName}</TableCell>
                      <TableCell>{c.leadName}</TableCell>
                      <TableCell>{formatCurrency(c.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[c.status] ?? ""}>
                          {statusLabels[c.status] ?? c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(c.eligibleDate)}
                      </TableCell>
                      <TableCell>
                        {formatDate(c.paidDate)}
                      </TableCell>
                      <TableCell>{c.quarter}</TableCell>
                      <TableCell>
                        {c.status !== "voided" && c.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => {
                              setVoidingId(c.id);
                              setVoidDialogOpen(true);
                            }}
                          >
                            Void
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={voidDialogOpen} onOpenChange={(open) => { setVoidDialogOpen(open); if (!open) { setVoidingId(null); setVoidReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Commission</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (voidingId) {
                voidMutation.mutate({ id: voidingId, reason: voidReason });
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="voidReason">Reason for voiding</Label>
              <Input
                id="voidReason"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="destructive" className="w-full" disabled={voidMutation.isPending}>
              {voidMutation.isPending ? "Voiding..." : "Void Commission"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
