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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Building2, Mail, User, ExternalLink, Download, LayoutGrid, List, Plus } from "lucide-react";
import { formatDate } from "@/lib/format";
import { LeadKanban } from "@/components/lead-kanban";

interface Lead {
  id: string;
  contactName: string;
  email: string;
  phone: string;
  partnerId: string;
  partnerName: string;
  partnerContactName: string;
  partnerEmail: string;
  partnerStatus: string;
  source: string;
  status: string;
  createdAt: string;
}

interface PartnerOption {
  id: string;
  companyName: string;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  cancelled: "bg-orange-100 text-orange-800",
};

const partnerStatusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-700",
};

const sourceLabels: Record<string, string> = {
  form: "Manual",
  referral_link: "Referral Link",
};

export default function Leads() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [newLead, setNewLead] = useState({ contactName: "", email: "", phone: "", partnerId: "" });

  // Always fetch ALL leads — filter client-side so counts stay accurate
  const { data: allLeads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
  });

  const { data: partners } = useQuery<PartnerOption[]>({
    queryKey: ["/api/admin/partners"],
  });

  // Client-side filtering
  const partnerFiltered = partnerFilter === "all"
    ? allLeads
    : allLeads?.filter((l) => l.partnerId === partnerFilter);

  const leads = statusFilter === "all"
    ? partnerFiltered
    : partnerFiltered?.filter((l) => l.status === statusFilter);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("POST", `/api/admin/leads/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Lead status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/leads/${id}/convert`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Lead converted and commission created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const submitLeadMutation = useMutation({
    mutationFn: async (data: { contactName: string; email: string; phone: string; partnerId: string }) => {
      await apiRequest("POST", `/api/admin/leads`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-stats"] });
      toast({ title: "Referral submitted successfully" });
      setSubmitOpen(false);
      setNewLead({ contactName: "", email: "", phone: "", partnerId: "" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Get selected partner name for the filter display
  const selectedPartner = partners?.find((p) => p.id === partnerFilter);

  // Stats — count from partner-filtered data (before status filter) so chips always show totals
  const totalLeads = partnerFiltered?.length ?? 0;
  const newLeads = partnerFiltered?.filter((l) => l.status === "new").length ?? 0;
  const contactedLeads = partnerFiltered?.filter((l) => l.status === "contacted").length ?? 0;
  const convertedLeads = partnerFiltered?.filter((l) => l.status === "converted").length ?? 0;
  const cancelledLeads = partnerFiltered?.filter((l) => l.status === "cancelled").length ?? 0;

  // Sanitize a string to prevent CSV injection (cells starting with =, +, -, @)
  const sanitizeCSVField = (val: string): string => {
    if (val && /^[=+\-@]/.test(val)) {
      return "'" + val;
    }
    return val;
  };

  const exportCSV = () => {
    if (!leads || leads.length === 0) return;
    const headers = ["Contact Name", "Email", "Phone", "Partner", "Source", "Status", "Date"];
    const rows = leads.map((l) => [
      sanitizeCSVField(l.contactName),
      sanitizeCSVField(l.email),
      sanitizeCSVField(l.phone),
      sanitizeCSVField(l.partnerName),
      sanitizeCSVField(sourceLabels[l.source] ?? l.source ?? "manual"),
      sanitizeCSVField(l.status),
      sanitizeCSVField(formatDate(l.createdAt)),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Pipeline</h1>
          <p className="text-sm text-gray-500">Individual credit repair · Business credit building</p>
        </div>
        <div className="flex items-center gap-2">
          {partnerFilter !== "all" && selectedPartner && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setPartnerFilter("all")}
            >
              Showing {selectedPartner.companyName} &times;
            </Button>
          )}

          {/* Submit Referral Dialog */}
          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Submit Referral
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit a Referral</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4 pt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newLead.contactName && newLead.email && newLead.partnerId) {
                    submitLeadMutation.mutate(newLead);
                  }
                }}
              >
                <div>
                  <Label>Partner <span className="text-red-400">*</span></Label>
                  <Select value={newLead.partnerId} onValueChange={(v) => setNewLead({ ...newLead, partnerId: v })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a partner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {partners?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact Name <span className="text-red-400">*</span></Label>
                  <Input className="mt-1" value={newLead.contactName} onChange={(e) => setNewLead({ ...newLead, contactName: e.target.value })} />
                </div>
                <div>
                  <Label>Email <span className="text-red-400">*</span></Label>
                  <Input type="email" className="mt-1" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1" placeholder="(555) 123-4567" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={submitLeadMutation.isPending}>
                  {submitLeadMutation.isPending ? "Submitting..." : "Submit Referral"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            disabled={!leads || leads.length === 0}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>

          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 ${viewMode === "kanban" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-600"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 ${viewMode === "table" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick stat chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            statusFilter === "all"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All ({totalLeads})
        </button>
        <button
          onClick={() => setStatusFilter("new")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            statusFilter === "new"
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          New ({newLeads})
        </button>
        <button
          onClick={() => setStatusFilter("contacted")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            statusFilter === "contacted"
              ? "bg-yellow-600 text-white"
              : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
          }`}
        >
          Contacted ({contactedLeads})
        </button>
        <button
          onClick={() => setStatusFilter("converted")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            statusFilter === "converted"
              ? "bg-green-600 text-white"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          Converted ({convertedLeads})
        </button>
        {cancelledLeads > 0 && (
          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === "cancelled"
                ? "bg-orange-600 text-white"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100"
            }`}
          >
            Cancelled ({cancelledLeads})
          </button>
        )}
      </div>

      {/* Partner filter */}
      <div className="flex gap-3">
        <div className="w-56">
          <Select value={partnerFilter} onValueChange={setPartnerFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by partner..." />
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

      {/* Kanban View */}
      {viewMode === "kanban" && !isLoading && leads && (
        <LeadKanban leads={leads} />
      )}
      {viewMode === "kanban" && isLoading && (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      )}

      {/* Table View */}
      <Card className={viewMode === "kanban" ? "mt-4" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {viewMode === "kanban" ? "All Referrals" : `${leads?.length ?? 0} ${(leads?.length ?? 0) === 1 ? "lead" : "leads"}`}
            {partnerFilter !== "all" && selectedPartner
              ? ` from ${selectedPartner.companyName}`
              : ""}
            {statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !leads || leads.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No leads found.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.contactName}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1.5 text-sm font-medium hover:underline underline-offset-2 text-left">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase">
                              {lead.partnerName?.charAt(0) || "?"}
                            </span>
                            {lead.partnerName || "—"}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" side="right" align="start" sideOffset={8}>
                          <div className="p-3 border-b">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm">{lead.partnerName}</p>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-1.5 py-0 ${partnerStatusColors[lead.partnerStatus] ?? ""}`}
                              >
                                {lead.partnerStatus}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3 space-y-2">
                            {lead.partnerContactName && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="h-3 w-3 shrink-0" />
                                <span>{lead.partnerContactName}</span>
                              </div>
                            )}
                            {lead.partnerEmail && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span>{lead.partnerEmail}</span>
                              </div>
                            )}
                          </div>
                          <div className="border-t p-2 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 h-7 text-xs"
                              onClick={() => {
                                setPartnerFilter(lead.partnerId);
                              }}
                            >
                              <Building2 className="mr-1 h-3 w-3" />
                              Filter leads
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 h-7 text-xs"
                              onClick={() => navigate(`/admin/partners/${lead.partnerId}`)}
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              View partner
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {sourceLabels[lead.source] ?? lead.source ?? "manual"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[lead.status] ?? ""}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.status === "new" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => statusMutation.mutate({ id: lead.id, status: "contacted" })}
                          >
                            Mark Contacted
                          </Button>
                        )}
                        {lead.status === "contacted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setConvertTarget(lead)}
                          >
                            Mark Converted
                          </Button>
                        )}
                        {lead.status === "converted" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-orange-600 hover:text-orange-700"
                            onClick={() => statusMutation.mutate({ id: lead.id, status: "cancelled" })}
                          >
                            Cancel / Refund
                          </Button>
                        )}
                        {lead.status !== "lost" && lead.status !== "converted" && lead.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-600 hover:text-red-700"
                            onClick={() => statusMutation.mutate({ id: lead.id, status: "lost" })}
                          >
                            Lost
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convert Lead Confirmation */}
      <AlertDialog open={!!convertTarget} onOpenChange={(open) => !open && setConvertTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <strong>{convertTarget?.contactName}</strong> as converted and
              automatically create a commission for partner <strong>{convertTarget?.partnerName}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (convertTarget) convertMutation.mutate(convertTarget.id);
                setConvertTarget(null);
              }}
            >
              {convertMutation.isPending ? "Converting..." : "Convert & Create Commission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
