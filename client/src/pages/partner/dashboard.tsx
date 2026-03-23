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
import { Users, CheckCircle, Clock, DollarSign } from "lucide-react";

interface Lead {
  id: string;
  contactName: string;
  email: string;
  status: string;
  createdAt: string;
}

interface Commission {
  id: string;
  amount: number;
  status: string;
}

export default function PartnerDashboard() {
  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/partners/leads"],
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery<
    Commission[]
  >({
    queryKey: ["/api/partners/commissions"],
  });

  const isLoading = leadsLoading || commissionsLoading;

  const totalLeads = leads?.length ?? 0;
  const convertedLeads =
    leads?.filter((l) => l.status === "converted").length ?? 0;
  const pendingCommissions =
    commissions
      ?.filter((c) => c.status === "eligible" || c.status === "pending_retention")
      .reduce((sum, c) => sum + c.amount, 0) ?? 0;
  const totalEarned =
    commissions
      ?.filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0) ?? 0;

  const recentLeads = leads?.slice(0, 5) ?? [];

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    converted: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };

  const stats = [
    {
      title: "Leads Submitted",
      value: totalLeads,
      icon: Users,
      format: (v: number) => v.toString(),
    },
    {
      title: "Converted",
      value: convertedLeads,
      icon: CheckCircle,
      format: (v: number) => v.toString(),
    },
    {
      title: "Pending Commissions",
      value: pendingCommissions,
      icon: Clock,
      format: (v: number) => `$${v.toFixed(2)}`,
    },
    {
      title: "Total Earned",
      value: totalEarned,
      icon: DollarSign,
      format: (v: number) => `$${v.toFixed(2)}`,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {stat.format(stat.value)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No leads submitted yet. Start by submitting your first lead!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.contactName}
                    </TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusColors[lead.status] ?? ""}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(lead.createdAt).toLocaleDateString()}
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
