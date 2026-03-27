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
import { RefreshCw, Clock, AlertTriangle, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";

interface Commission {
  id: string;
  partnerId: string;
  leadId: string;
  amount: number;
  retentionDays: number;
  status: string;
  eligibleAt: string | null;
  paidAt: string | null;
  payoutQuarter: string | null;
  voidedReason: string | null;
  createdAt: string;
  leadContactName: string;
}

interface PartnerOption {
  id: string;
  companyName: string;
  contactName: string;
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

const statusIcons: Record<string, typeof Clock> = {
  pending_retention: Clock,
  eligible: CheckCircle,
  paid: DollarSign,
  voided: XCircle,
};

function getRetentionInfo(commission: Commission) {
  if (commission.status !== "pending_retention") return null;
  const created = new Date(commission.createdAt).getTime();
  const retentionMs = (commission.retentionDays || 91) * 24 * 60 * 60 * 1000;
  const eligibleDate = new Date(created + retentionMs);
  const daysElapsed = Math.floor((Date.now() - created) / (24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, commission.retentionDays - daysElapsed);
  const progress = Math.min(100, Math.round((daysElapsed / commission.retentionDays) * 100));
  return { eligibleDate, daysElapsed, daysRemaining, progress };
}

function getQuarterLabel(date: Date): string {
  const q = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${q} ${date.getFullYear()}`;
}

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

  const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]));

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

  // Summary stats
  const inRetention = commissions?.filter((c) => c.status === "pending_retention").length ?? 0;
  const eligible = commissions?.filter((c) => c.status === "eligible").length ?? 0;
  const paid = commissions?.filter((c) => c.status === "paid").length ?? 0;
  const voided = commissions?.filter((c) => c.status === "voided").length ?? 0;
  const eligibleAmount = commissions?.filter((c) => c.status === "eligible").reduce((s, c) => s + c.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Tracker</h1>
          <p className="text-sm text-gray-500">Track retention periods, eligibility & quarterly payouts</p>
        </div>
        <Button
          variant="outline"
          onClick={() => retentionMutation.mutate()}
          disabled={retentionMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${retentionMutation.isPending ? "animate-spin" : ""}`} />
          Check Retention
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex items-start gap-2">
        <Clock className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-sky-800">
          <strong>91-day retention period.</strong> When a lead enrolls, a commission is created in "In Retention" status.
          After 91 days without cancellation, it becomes "Eligible" for quarterly payout.
          If the client cancels or requests a refund before 91 days, void the commission.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-yellow-400">
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">In Retention</p>
            <p className="text-2xl font-bold text-yellow-700">{inRetention}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Eligible for Payout</p>
            <p className="text-2xl font-bold text-blue-700">{eligible}</p>
            {eligibleAmount > 0 && <p className="text-xs text-blue-500">{formatCurrency(eligibleAmount)} ready</p>}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400">
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Paid Out</p>
            <p className="text-2xl font-bold text-green-700">{paid}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Voided</p>
            <p className="text-2xl font-bold text-red-700">{voided}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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

      {/* Commissions table */}
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
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Became Client</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Payout Quarter</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((c) => {
                    const partner = partnerMap.get(c.partnerId);
                    const retention = getRetentionInfo(c);
                    const StatusIcon = statusIcons[c.status] ?? Clock;

                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {partner?.contactName || partner?.companyName || "-"}
                        </TableCell>
                        <TableCell>{c.leadContactName}</TableCell>
                        <TableCell>{formatCurrency(c.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StatusIcon className="w-3.5 h-3.5" />
                            <Badge variant="secondary" className={statusColors[c.status] ?? ""}>
                              {statusLabels[c.status] ?? c.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(c.createdAt)}
                        </TableCell>
                        <TableCell>
                          {c.status === "pending_retention" && retention ? (
                            <div className="space-y-1 min-w-[140px]">
                              <div className="flex justify-between text-[10px]">
                                <span className="text-gray-500">Day {retention.daysElapsed} of {c.retentionDays}</span>
                                <span className="font-medium text-amber-600">{retention.daysRemaining}d left</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-amber-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${retention.progress}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-gray-400">
                                Eligible {retention.eligibleDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                          ) : c.status === "eligible" ? (
                            <span className="text-xs text-blue-600 font-medium">Passed 91 days</span>
                          ) : c.status === "paid" ? (
                            <span className="text-xs text-green-600">{formatDate(c.paidAt)}</span>
                          ) : c.status === "voided" ? (
                            <span className="text-xs text-red-500" title={c.voidedReason ?? ""}>
                              {c.voidedReason ? c.voidedReason.substring(0, 30) : "Voided"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {c.payoutQuarter || (c.status === "eligible"
                            ? getQuarterLabel(new Date())
                            : c.status === "pending_retention" && retention
                            ? getQuarterLabel(retention.eligibleDate)
                            : "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {c.status === "pending_retention" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 text-xs"
                              onClick={() => {
                                setVoidingId(c.id);
                                setVoidDialogOpen(true);
                              }}
                            >
                              Cancel / Refund
                            </Button>
                          )}
                          {c.status === "eligible" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 text-xs"
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Void dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={(open) => { setVoidDialogOpen(open); if (!open) { setVoidingId(null); setVoidReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Void Commission
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            This will void the commission. Use this when a client cancels their enrollment or requests a refund before the 91-day retention period.
          </p>
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
              <Label htmlFor="voidReason">Reason</Label>
              <Select onValueChange={setVoidReason} value={voidReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client cancelled before 91 days">Client cancelled before 91 days</SelectItem>
                  <SelectItem value="Client requested refund">Client requested refund</SelectItem>
                  <SelectItem value="Duplicate commission">Duplicate commission</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {voidReason === "Other" && (
                <Input
                  placeholder="Describe reason..."
                  onChange={(e) => setVoidReason(e.target.value)}
                />
              )}
            </div>
            <Button type="submit" variant="destructive" className="w-full" disabled={voidMutation.isPending || !voidReason}>
              {voidMutation.isPending ? "Voiding..." : "Void Commission"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
