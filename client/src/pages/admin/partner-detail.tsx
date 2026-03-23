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

interface PartnerDetail {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  programName: string;
  paymentMethod: string | null;
  paymentDetails: string | null;
  leads: Lead[];
  commissions: Commission[];
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
  leadName: string;
  amount: number;
  status: string;
  eligibleDate: string | null;
  paidDate: string | null;
  quarter: string;
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

  const { data: partner, isLoading } = useQuery<PartnerDetail>({
    queryKey: [`/api/admin/partners/${partnerId}`],
    enabled: !!partnerId,
  });

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
        <CardHeader>
          <CardTitle>Partner Information</CardTitle>
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
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads ({partner.leads?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="commissions">Commissions ({partner.commissions?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {!partner.leads || partner.leads.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No leads.</p>
              ) : (
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
                        <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
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
                        <TableCell className="font-medium">{commission.leadName}</TableCell>
                        <TableCell>${(commission.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={commissionStatusColors[commission.status] ?? ""}>
                            {commissionStatusLabels[commission.status] ?? commission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {commission.eligibleDate
                            ? new Date(commission.eligibleDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {commission.paidDate
                            ? new Date(commission.paidDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{commission.quarter}</TableCell>
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
    </div>
  );
}
