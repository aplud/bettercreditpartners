import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, DollarSign, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/format";
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
  totalPartners: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  pendingCommissions: number;
  paidCommissions: number;
  leadsByStatus: Array<{ status: string; count: number }>;
  monthlyReferrals: Array<{ month: string; count: number }>;
  monthlyCommissions: Array<{ month: string; amount: number }>;
  topPartners: Array<{
    id: string;
    name: string;
    company: string;
    leads: number;
    converted: number;
    earned: number;
    status: string;
  }>;
}

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  username?: string;
  details: string;
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function activityColor(action: string): string {
  if (action.includes("create") && action.includes("lead")) return "bg-emerald-500";
  if (action.includes("update")) return "bg-blue-500";
  if (action.includes("commission")) return "bg-purple-500";
  if (action.includes("payout")) return "bg-amber-500";
  if (action.includes("partner")) return "bg-cyan-500";
  return "bg-slate-400";
}

function activityText(entry: AuditEntry): string {
  const name = entry.username || entry.userId?.slice(0, 8);
  if (entry.action === "create" && entry.entityType === "lead") {
    return `New referral submitted — ${entry.details || entry.entityId?.slice(0, 8)}`;
  }
  if (entry.action === "update" && entry.entityType === "lead") {
    return `Lead status updated — ${entry.details || ""}`;
  }
  if (entry.entityType === "commission") {
    return `Commission ${entry.action} — ${entry.details || ""}`;
  }
  if (entry.entityType === "partner") {
    return `Partner ${entry.action} — ${entry.details || ""}`;
  }
  return `${entry.action} ${entry.entityType} — ${entry.details || entry.entityId?.slice(0, 8) || ""}`;
}

const AVATAR_COLORS = [
  "from-blue-500 to-cyan-400",
  "from-emerald-500 to-teal-400",
  "from-purple-500 to-indigo-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard-stats"],
  });

  const { data: auditLog } = useQuery<AuditEntry[]>({
    queryKey: ["/api/admin/audit-log"],
  });

  const recentActivity = (auditLog || []).slice(0, 8);

  const nextPayoutDate = (() => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const nextQuarterStart = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
    return nextQuarterStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  const metricCards = [
    {
      label: "TOTAL REFERRALS",
      value: stats?.totalLeads ?? 0,
      format: (v: number) => v.toString(),
      icon: <FileText className="w-6 h-6 text-blue-300" />,
      delta: `${stats?.convertedLeads ?? 0} converted`,
      deltaColor: "text-emerald-600",
      borderColor: "border-l-blue-500",
    },
    {
      label: "ACTIVE PARTNERS",
      value: stats?.activePartners ?? 0,
      format: (v: number) => v.toString(),
      icon: <Users className="w-6 h-6 text-teal-300" />,
      delta: `${stats?.totalPartners ?? 0} total`,
      deltaColor: "text-emerald-600",
      borderColor: "border-l-teal-500",
    },
    {
      label: "COMMISSIONS PAID",
      value: stats?.paidCommissions ?? 0,
      format: (v: number) => formatCurrency(v),
      icon: <DollarSign className="w-6 h-6 text-emerald-300" />,
      delta: `${stats?.conversionRate?.toFixed(0) ?? 0}% conversion`,
      deltaColor: "text-emerald-600",
      borderColor: "border-l-emerald-500",
    },
    {
      label: "PENDING PAYOUT",
      value: stats?.pendingCommissions ?? 0,
      format: (v: number) => formatCurrency(v),
      icon: <Wallet className="w-6 h-6 text-purple-300" />,
      delta: `Next run: ${nextPayoutDate}`,
      deltaColor: "text-emerald-600",
      borderColor: "border-l-purple-500",
    },
  ];

  const maxPartnerEarned = Math.max(...(stats?.topPartners?.map((p) => p.earned) || [1]));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Better Credit Partners — Referral Program Overview</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => (
          <Card key={card.label} className={`border-l-4 ${card.borderColor} shadow-sm`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium text-gray-400 tracking-wider">{card.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-gray-900 mt-1">{card.format(card.value)}</p>
                  )}
                  <p className={`text-xs mt-1 ${card.deltaColor} font-medium`}>▲ {card.delta}</p>
                </div>
                {card.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Referrals + Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Monthly Referrals Bar Chart */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Monthly Referrals</h3>
                <p className="text-xs text-gray-400">Individual + Business tracks combined</p>
              </div>
              {stats?.monthlyReferrals && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  ● {stats.totalLeads} total
                </span>
              )}
            </div>
            {isLoading || !stats?.monthlyReferrals ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.monthlyReferrals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Live Activity</h3>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="space-y-0">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No recent activity</p>
              ) : (
                recentActivity.map((entry) => (
                  <div key={entry.id} className="flex gap-3 py-2.5 border-b border-gray-100 last:border-0">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${activityColor(entry.action)}`} />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 leading-relaxed">{activityText(entry)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(entry.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Payouts Chart + Top Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Commission Payouts */}
        <Card className="lg:col-span-3 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Commission Payouts</h3>
                <p className="text-xs text-gray-400">Monthly ($50 per enrollment)</p>
              </div>
            </div>
            {isLoading || !stats?.monthlyCommissions ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.monthlyCommissions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `$${v / 100}`} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    formatter={(value: number) => [formatCurrency(value), "Amount"]}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Partners Leaderboard */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Top Partners</h3>
            <div className="space-y-3">
              {!stats?.topPartners || stats.topPartners.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No partners yet</p>
              ) : (
                stats.topPartners.map((partner, i) => (
                  <div key={partner.id} className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-5 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-gray-300"}`}>
                      {i + 1}
                    </span>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {partner.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{partner.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{partner.company}</p>
                    </div>
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                        style={{ width: `${(partner.earned / maxPartnerEarned) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-emerald-600 w-16 text-right">
                      {formatCurrency(partner.earned)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
