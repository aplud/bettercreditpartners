import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/format";

interface PartnerDetailResponse {
  partner: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    status: string;
    paymentMethod: string | null;
    paymentDetails: string | null;
  };
  program: {
    name: string;
  };
  leads: Lead[];
  commissions: Commission[];
  agreementSigned: boolean;
  agreementSignedAt: string | null;
}

interface Lead {
  id: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

interface Commission {
  id: string;
  leadId: string;
  amount: number;
  status: string;
  eligibleAt: string | null;
  paidAt: string | null;
  payoutQuarter: string | null;
  voidedReason: string | null;
}

const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

const commissionStatusColors: Record<string, string> = {
  pending_retention: "bg-yellow-100 text-yellow-800",
  eligible: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  voided: "bg-red-100 text-red-800",
};

const commissionStatusLabels: Record<string, string> = {
  pending_retention: "In Retention",
  eligible: "Eligible",
  paid: "Paid",
  voided: "Voided",
};

export default function PartnerDetailPage() {
  const { toast } = useToast();
  const [, params] = useRoute("/admin/partners/:id");
  const partnerId = params?.id;

  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [newLead, setNewLead] = useState({ contactName: "", email: "", phone: "" });

  const { data: detailData, isLoading } = useQuery<PartnerDetailResponse>({
    queryKey: [`/api/admin/partners/${partnerId}`],
    enabled: !!partnerId,
  });

  const partner = detailData ? {
    ...detailData.partner,
    programName: detailData.program?.name ?? "",
    leads: detailData.leads ?? [],
    commissions: detailData.commissions ?? [],
    agreementSigned: detailData.agreementSigned ?? false,
    agreementSignedAt: detailData.agreementSignedAt ?? null,
  } : null;

  const leadStatusMutation = useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      await apiRequest("POST", `/api/admin/leads/${leadId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/partners/${partnerId}`] });
      toast({ title: "Lead status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (leadId: string) => {
      await apiRequest("POST", `/api/admin/leads/${leadId}/convert`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/partners/${partnerId}`] });
      toast({ title: "Lead converted and commission created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { newPassword: string }) => {
      await apiRequest("POST", `/api/admin/partners/${partnerId}/reset-password`, data);
    },
    onSuccess: () => {
      setResetPwOpen(false);
      setNewPassword("");
      toast({ title: "Password reset", description: "Partner password has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addLeadMutation = useMutation({
    mutationFn: async (data: { contactName: string; email: string; phone: string }) => {
      await apiRequest("POST", `/api/admin/partners/${partnerId}/leads`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/partners/${partnerId}`] });
      setAddLeadOpen(false);
      setNewLead({ contactName: "", email: "", phone: "" });
      toast({ title: "Lead added" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const markAgreementMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/admin/partners/${partnerId}/mark-agreement-signed`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/partners/${partnerId}`] });
      toast({ title: "Agreement marked as signed", description: "Partner has been activated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const voidMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/commissions/${id}/void`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/partners/${partnerId}`] });
      setVoidDialogOpen(false);
      setVoidingId(null);
      setVoidReason("");
      toast({ title: "Commission voided" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!partner) {
    return <p className="text-muted-foreground">Partner not found.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{partner.companyName}</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Partner Information</CardTitle>
          <div className="flex gap-2">
            {!partner.agreementSigned && (
              <Button
                size="sm"
                className="bg-[#123f56] hover:bg-[#0e3245]"
                onClick={() => markAgreementMutation.mutate()}
                disabled={markAgreementMutation.isPending}
              >
                {markAgreementMutation.isPending ? "Marking..." : "Mark Agreement Signed"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setResetPwOpen(true)}>
              Reset Password
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Contact:</span>{" "}
              {partner.contactName}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>{" "}
              {partner.email}
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {partner.phone || "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              <Badge
                variant="secondary"
                className={leadStatusColors[partner.status] ?? (partner.status === "active" ? "bg-green-100 text-green-800" : partner.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800")}
              >
                {partner.status}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Program:</span>{" "}
              {partner.programName}
            </div>
            <div>
              <span className="text-muted-foreground">Payment:</span>{" "}
              {partner.paymentMethod ?? "Not set"}{" "}
              {partner.paymentDetails ? `(${partner.paymentDetails})` : ""}
            </div>
            <div>
              <span className="text-muted-foreground">Agreement:</span>{" "}
              {partner.agreementSigned ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Signed {partner.agreementSignedAt ? `on ${formatDate(partner.agreementSignedAt)}` : ""}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  Not Signed
                </Badge>
              )}
            </div>
          </div>
          {!partner.agreementSigned && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              This partner has <strong>not signed</strong> their partner agreement. They can still submit leads, but commissions will not be paid until the agreement is signed.
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads ({partner.leads?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="commissions">Commissions ({partner.commissions?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Leads</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setAddLeadOpen(true)}>
                Add Lead
              </Button>
            </CardHeader>
            <CardContent>
              {!partner.leads || partner.leads.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No leads.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partner.leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.contactName}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.phone}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={leadStatusColors[lead.status] ?? ""}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(lead.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {lead.status === "new" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => leadStatusMutation.mutate({ leadId: lead.id, status: "contacted" })}
                                >
                                  Mark Contacted
                                </Button>
                              )}
                              {lead.status === "contacted" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => convertMutation.mutate(lead.id)}
                                >
                                  Mark Converted
                                </Button>
                              )}
                              {lead.status !== "lost" && lead.status !== "converted" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600"
                                  onClick={() => leadStatusMutation.mutate({ leadId: lead.id, status: "lost" })}
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
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {!partner.commissions || partner.commissions.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No commissions.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                      {partner.commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="font-medium">{commission.leadId?.slice(0, 8) ?? "-"}</TableCell>
                          <TableCell>{formatCurrency(commission.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={commissionStatusColors[commission.status] ?? ""}>
                              {commissionStatusLabels[commission.status] ?? commission.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(commission.eligibleAt)}
                          </TableCell>
                          <TableCell>
                            {formatDate(commission.paidAt)}
                          </TableCell>
                          <TableCell>{commission.payoutQuarter ?? "-"}</TableCell>
                          <TableCell>
                            {commission.status !== "voided" && commission.status !== "paid" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => {
                                  setVoidingId(commission.id);
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
        </TabsContent>
      </Tabs>

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

      <Dialog open={resetPwOpen} onOpenChange={(open) => { setResetPwOpen(open); if (!open) setNewPassword(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Partner Password</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              resetPasswordMutation.mutate({ newPassword });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min 6 characters"
              />
            </div>
            <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addLeadOpen} onOpenChange={(open) => { setAddLeadOpen(open); if (!open) setNewLead({ contactName: "", email: "", phone: "" }); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lead for {partner?.companyName}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); addLeadMutation.mutate(newLead); }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input value={newLead.contactName} onChange={(e) => setNewLead(l => ({ ...l, contactName: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={newLead.email} onChange={(e) => setNewLead(l => ({ ...l, email: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={newLead.phone} onChange={(e) => setNewLead(l => ({ ...l, phone: e.target.value }))} required />
            </div>
            <Button type="submit" className="w-full" disabled={addLeadMutation.isPending}>
              {addLeadMutation.isPending ? "Adding..." : "Add Lead"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
