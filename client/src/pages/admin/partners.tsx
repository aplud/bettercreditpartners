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
  agreementSigned: boolean;
  stats: {
    leadCount: number;
    convertedCount: number;
    totalEarned: number;
    pendingAmount: number;
  };
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
  const [suspendTarget, setSuspendTarget] = useState<Partner | null>(null);
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

  const [search, setSearch] = useState("");
  const [statusFilterVal, setStatusFilterVal] = useState<string>("all");

  const filteredPartners = partners?.filter((p) => {
    const matchesSearch = !search || p.companyName.toLowerCase().includes(search.toLowerCase()) || p.contactName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilterVal === "all" || p.status === statusFilterVal;
    return matchesSearch && matchesStatus;
  });

  const getTier = (leads: number) => {
    if (leads >= 30) return { label: "Platinum", color: "bg-purple-100 text-purple-700 border-purple-200" };
    if (leads >= 20) return { label: "Gold", color: "bg-amber-100 text-amber-700 border-amber-200" };
    if (leads >= 10) return { label: "Silver", color: "bg-gray-100 text-gray-600 border-gray-200" };
    return { label: "Bronze", color: "bg-orange-100 text-orange-700 border-orange-200" };
  };

  const AVATAR_COLORS = [
    "from-blue-500 to-cyan-400",
    "from-emerald-500 to-teal-400",
    "from-purple-500 to-indigo-400",
    "from-amber-500 to-orange-400",
    "from-rose-500 to-pink-400",
    "from-red-500 to-rose-400",
    "from-indigo-500 to-blue-400",
    "from-teal-500 to-emerald-400",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="text-sm text-gray-500">Car dealers, financial advisors & referral partners</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-[#123f56] hover:bg-[#0e3245]">
          <Plus className="mr-2 h-4 w-4" /> Invite Partner
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search partners..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {["all", "active", "pending", "suspended"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilterVal(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              statusFilterVal === s
                ? "bg-[#123f56] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 flex items-start gap-2">
        <span className="text-lg">💡</span>
        <p className="text-sm text-sky-800">
          <strong>$50 paid per enrolled client</strong> — works for both individual credit repair AND business credit building. Partners earn automatically when their referral signs an enrollment agreement.
        </p>
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !filteredPartners || filteredPartners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No partners found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map((partner, i) => {
            const { leadCount = 0, convertedCount = 0, totalEarned = 0, pendingAmount = 0 } = partner.stats || {};
            const tier = getTier(leadCount);
            const convRate = leadCount > 0 ? Math.round((convertedCount / leadCount) * 100) : 0;

            return (
              <Card key={partner.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/partners/${partner.id}`)}>
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold`}>
                        {partner.contactName?.[0]?.toUpperCase() || partner.companyName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{partner.contactName || partner.companyName}</p>
                        <p className="text-xs text-gray-400">{partner.companyName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className={`text-[10px] ${tier.color}`}>
                        {tier.label}
                      </Badge>
                      {!partner.agreementSigned && (
                        <span className="text-[9px] text-red-500 font-medium">No Agreement</span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{leadCount}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Referrals</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalEarned)}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Paid Out</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{convRate}%</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Conv.</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate(`/admin/partners/${partner.id}`)}>
                        View
                      </Button>
                      {partner.status === "pending" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600" onClick={() => statusMutation.mutate({ id: partner.id, status: "active" })}>
                          Approve
                        </Button>
                      )}
                      {partner.status === "active" && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => setSuspendTarget(partner)}>
                          Suspend
                        </Button>
                      )}
                      {partner.status === "suspended" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: partner.id, status: "active" })}>
                          Reactivate
                        </Button>
                      )}
                    </div>
                    {pendingAmount > 0 && (
                      <span className="text-xs font-medium text-cyan-600">{formatCurrency(pendingAmount)} due</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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

      <AlertDialog open={!!suspendTarget} onOpenChange={(open) => !open && setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend partner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will suspend <strong>{suspendTarget?.companyName}</strong>. They will lose access to the partner portal until reactivated. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (suspendTarget) {
                  statusMutation.mutate({ id: suspendTarget.id, status: "suspended" });
                  setSuspendTarget(null);
                }
              }}
            >
              Suspend Partner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
