import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  activePartners: number;
  totalLeads: number;
  conversionRate: number;
  commissionsPending: number;
  leadsByStatus: Array<{ status: string; count: number }>;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard-stats"],
  });

  const statCards = [
    {
      title: "Active Partners",
      value: stats?.activePartners ?? 0,
      icon: Users,
      format: (v: number) => v.toString(),
    },
    {
      title: "Total Leads",
      value: stats?.totalLeads ?? 0,
      icon: FileText,
      format: (v: number) => v.toString(),
    },
    {
      title: "Conversion Rate",
      value: stats?.conversionRate ?? 0,
      icon: TrendingUp,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      title: "Commissions Pending",
      value: stats?.commissionsPending ?? 0,
      icon: DollarSign,
      format: (v: number) => formatCurrency(v),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
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
          <CardTitle>Leads by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.leadsByStatus || stats.leadsByStatus.length === 0 || stats.leadsByStatus.every((d) => d.count === 0) ? (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground text-sm">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.leadsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin/partners">
            <Button variant="outline">Review Partners</Button>
          </Link>
          <Link href="/admin/leads">
            <Button variant="outline">Manage Leads</Button>
          </Link>
          <Link href="/admin/commissions">
            <Button variant="outline">Check Commissions</Button>
          </Link>
          <Link href="/admin/programs">
            <Button variant="outline">Manage Programs</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
