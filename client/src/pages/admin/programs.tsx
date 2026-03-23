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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil } from "lucide-react";

interface Program {
  id: string;
  name: string;
  commissionAmount: number;
  retentionDays: number;
  payoutSchedule: string;
  description: string | null;
  active: boolean;
  partnerCount: number;
}

interface ProgramFormData {
  name: string;
  commissionAmount: string;
  retentionDays: string;
  payoutSchedule: string;
  description: string;
}

const emptyForm: ProgramFormData = {
  name: "",
  commissionAmount: "",
  retentionDays: "90",
  payoutSchedule: "quarterly",
  description: "",
};

export default function Programs() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramFormData>(emptyForm);

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ["/api/admin/programs"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProgramFormData) => {
      await apiRequest("POST", "/api/admin/programs", {
        name: data.name,
        commissionAmount: Math.round(parseFloat(data.commissionAmount) * 100),
        retentionDays: parseInt(data.retentionDays),
        payoutSchedule: data.payoutSchedule,
        description: data.description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
      setCreateOpen(false);
      setForm(emptyForm);
      toast({ title: "Program created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error creating program", description: err.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProgramFormData }) => {
      await apiRequest("PATCH", `/api/admin/programs/${id}`, {
        name: data.name,
        commissionAmount: Math.round(parseFloat(data.commissionAmount) * 100),
        retentionDays: parseInt(data.retentionDays),
        payoutSchedule: data.payoutSchedule,
        description: data.description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
      setEditOpen(false);
      setEditingId(null);
      toast({ title: "Program updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error updating program", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      if (active) {
        await apiRequest("PATCH", `/api/admin/programs/${id}/deactivate`);
      } else {
        await apiRequest("PATCH", `/api/admin/programs/${id}`, { active: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
      toast({ title: "Program status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function openEdit(program: Program) {
    setEditingId(program.id);
    setForm({
      name: program.name,
      commissionAmount: (program.commissionAmount / 100).toString(),
      retentionDays: program.retentionDays.toString(),
      payoutSchedule: program.payoutSchedule,
      description: program.description ?? "",
    });
    setEditOpen(true);
  }

  function handleSubmitCreate(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  function handleSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      editMutation.mutate({ id: editingId, data: form });
    }
  }

  const formFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Program Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="commissionAmount">Commission Amount ($)</Label>
        <Input
          id="commissionAmount"
          type="number"
          step="0.01"
          min="0"
          value={form.commissionAmount}
          onChange={(e) => setForm({ ...form, commissionAmount: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="retentionDays">Retention Days</Label>
        <Input
          id="retentionDays"
          type="number"
          min="0"
          value={form.retentionDays}
          onChange={(e) => setForm({ ...form, retentionDays: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Payout Schedule</Label>
        <Select
          value={form.payoutSchedule}
          onValueChange={(v) => setForm({ ...form, payoutSchedule: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Referral Programs</h1>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setForm(emptyForm); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Referral Program</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitCreate} className="space-y-4">
              {formFields}
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Program"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            {formFields}
            <Button type="submit" className="w-full" disabled={editMutation.isPending}>
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>All Programs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !programs || programs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No programs created yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Retention Days</TableHead>
                  <TableHead>Payout Schedule</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Partners</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell>${(program.commissionAmount / 100).toFixed(2)}</TableCell>
                    <TableCell>{program.retentionDays}</TableCell>
                    <TableCell className="capitalize">{program.payoutSchedule}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={program.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {program.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{program.partnerCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(program)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMutation.mutate({ id: program.id, active: program.active })}
                        >
                          {program.active ? "Deactivate" : "Activate"}
                        </Button>
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
