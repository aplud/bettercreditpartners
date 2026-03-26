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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/format";

interface Payout {
  id: string;
  quarter: string;
  generatedAt: string;
  totalAmount: number;
  partnerCount: number;
}

export default function Payouts() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quarter, setQuarter] = useState("");

  const { data: payouts, isLoading } = useQuery<Payout[]>({
    queryKey: ["/api/admin/payouts"],
  });

  const generateMutation = useMutation({
    mutationFn: async (quarter: string) => {
      const res = await apiRequest("POST", "/api/admin/payouts/generate", { quarter });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payout-${quarter}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      setDialogOpen(false);
      setQuarter("");
      toast({ title: "Payout generated and CSV downloaded" });
    },
    onError: (err: Error) => {
      toast({ title: "Error generating payout", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payout Reports</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Generate Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Payout Report</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateMutation.mutate(quarter);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="quarter">Quarter (e.g., 2026-Q1)</Label>
                <Input
                  id="quarter"
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                  placeholder="2026-Q1"
                  pattern="\d{4}-Q[1-4]"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? "Generating..." : "Generate & Download CSV"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Past Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !payouts || payouts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No payouts generated yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quarter</TableHead>
                  <TableHead>Generated Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Partner Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.quarter}</TableCell>
                    <TableCell>{formatDate(payout.generatedAt)}</TableCell>
                    <TableCell>{formatCurrency(payout.totalAmount)}</TableCell>
                    <TableCell>{payout.partnerCount}</TableCell>
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
