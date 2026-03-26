import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DollarSign, Clock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { formatDate, formatCurrency } from "@/lib/format";

interface Commission {
  id: string;
  leadContactName: string;
  amount: number;
  status: string;
  eligibleDate: string | null;
  paidDate: string | null;
  quarter: string;
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

export default function Commissions() {
  const { data: commissionsData, isLoading, isError, refetch } = useQuery<{ commissions: Commission[]; program: unknown }>({
    queryKey: ["/api/partners/commissions"],
  });
  const commissions = commissionsData?.commissions;

  const totalEarned =
    commissions
      ?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0) ?? 0;
  const pendingEligible =
    commissions
      ?.filter((c) => c.status === "eligible")
      .reduce((sum, c) => sum + c.amount, 0) ?? 0;
  const inRetention =
    commissions
      ?.filter((c) => c.status === "pending_retention")
      .reduce((sum, c) => sum + c.amount, 0) ?? 0;

  const summaryCards = [
    {
      title: "Total Earned",
      value: totalEarned,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Pending (Eligible)",
      value: pendingEligible,
      icon: DollarSign,
      color: "text-blue-600",
    },
    {
      title: "In Retention",
      value: inRetention,
      icon: Clock,
      color: "text-yellow-600",
    },
  ];

  if (isError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-400 mb-4">Failed to load data. Please try again.</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Commissions</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(card.value)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !commissions || commissions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm mb-2">
                No commissions yet. Commissions are created when your leads
                convert.
              </p>
              <p className="text-muted-foreground text-xs mb-4">
                Submit leads to start earning commissions on successful conversions.
              </p>
              <Link href="/partner/submit-lead">
                <Button variant="outline">Submit a Lead</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Eligible Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Quarter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">
                      {commission.leadContactName}
                    </TableCell>
                    <TableCell>{formatCurrency(commission.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[commission.status] ?? ""}
                      >
                        {statusLabels[commission.status] ?? commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(commission.eligibleDate)}
                    </TableCell>
                    <TableCell>
                      {formatDate(commission.paidDate)}
                    </TableCell>
                    <TableCell>{commission.quarter}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
