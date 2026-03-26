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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";

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

interface Program {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
};

export default function Partners() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [addOpen, setAddOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({
    username: "", password: "", companyName: "", contactName: "",
    email: "", phone: "", programId: "", paymentMethod: "", paymentDetails: "",
    agreementSigned: false,
  });

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
    queryFn: getQueryFn({ on401: "returnNull" }),
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

  const addPartnerMutation = useMutation({
    mutationFn: async (data: typeof newPartner) => {
      const res = await apiRequest("POST", "/api/admin/partners", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      setAddOpen(false);
      setNewPartner({ username: "", password: "", companyName: "", contactName: "", email: "", phone: "", programId: "", paymentMethod: "", paymentDetails: "", agreementSigned: false });
      toast({ title: "Partner created" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Partners</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Partner
        </Button>
      </div>

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
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table className="min-w-[600px]">
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
                        <Badge variant="secondary" className={statusColors[partner.status] ?? ""}>
                          {partner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{partner.programName}</TableCell>
                      <TableCell>{partner.leadCount}</TableCell>
                      <TableCell>{partner.convertedCount}</TableCell>
                      <TableCell>{formatCurrency(partner.totalEarned)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {partner.status === "pending" && (
                            <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: partner.id, status: "active" })}>
                              Approve
                            </Button>
                          )}
                          {partner.status === "active" && (
                            <Button size="sm" variant="outline" className="text-red-600" onClick={() => statusMutation.mutate({ id: partner.id, status: "suspended" })}>
                              Suspend
                            </Button>
                          )}
                          {partner.status === "suspended" && (
                            <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: partner.id, status: "active" })}>
                              Reactivate
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Partner</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); addPartnerMutation.mutate(newPartner); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Username</Label>
                <Input value={newPartner.username} onChange={(e) => setNewPartner(p => ({ ...p, username: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" value={newPartner.password} onChange={(e) => setNewPartner(p => ({ ...p, password: e.target.value }))} required minLength={6} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Contact Name</Label>
                <Input value={newPartner.contactName} onChange={(e) => setNewPartner(p => ({ ...p, contactName: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Company Name</Label>
                <Input value={newPartner.companyName} onChange={(e) => setNewPartner(p => ({ ...p, companyName: e.target.value }))} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={newPartner.email} onChange={(e) => setNewPartner(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input type="tel" value={newPartner.phone} onChange={(e) => setNewPartner(p => ({ ...p, phone: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Referral Program</Label>
              <Select onValueChange={(v) => setNewPartner(p => ({ ...p, programId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                <SelectContent>
                  {programs?.map((prog) => (
                    <SelectItem key={prog.id} value={prog.id}>{prog.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Payment Method</Label>
                <Select onValueChange={(v) => setNewPartner(p => ({ ...p, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ach">ACH (Direct Deposit)</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Payment Details</Label>
                <Input value={newPartner.paymentDetails} onChange={(e) => setNewPartner(p => ({ ...p, paymentDetails: e.target.value }))} placeholder="e.g. PayPal email" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="agreementSigned"
                checked={newPartner.agreementSigned}
                onCheckedChange={(checked) => setNewPartner(p => ({ ...p, agreementSigned: checked === true }))}
              />
              <Label htmlFor="agreementSigned" className="text-sm">Partner agreement already signed (activate immediately)</Label>
            </div>
            <Button type="submit" className="w-full" disabled={addPartnerMutation.isPending}>
              {addPartnerMutation.isPending ? "Creating..." : "Create Partner"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
