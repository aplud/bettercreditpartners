import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LogOut,
  ExternalLink,
  Zap,
  Users,
  User,
  DollarSign,
  LinkIcon,
  LayoutDashboard,
  Settings,
  ScrollText,
  Sheet,
  ShieldCheck,
  Package,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import bcpLogo from "@assets/BCP-ISOLOGO_1768516740168.png";
import bcpShield from "@assets/bcp-shield-white.svg";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

interface DashboardStats {
  activePartners: number;
  totalLeads: number;
  pendingCommissions: number;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard-stats"],
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.clear();
    navigate("/login");
  };

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      label: "Partners",
      href: "/admin/partners",
      icon: <Users className="w-4 h-4" />,
      badge: stats?.activePartners || undefined,
      badgeColor: "bg-blue-500",
    },
    {
      label: "Lead Pipeline",
      href: "/admin/leads",
      icon: <User className="w-4 h-4" />,
      badge: stats?.totalLeads || undefined,
      badgeColor: "bg-blue-500",
    },
    {
      label: "Commissions",
      href: "/admin/commissions",
      icon: <DollarSign className="w-4 h-4" />,
      badge: stats?.pendingCommissions ? formatCurrency(stats.pendingCommissions) : undefined,
      badgeColor: "bg-emerald-500",
    },
    {
      label: "Referral Links",
      href: "/admin/referral-links",
      icon: <LinkIcon className="w-4 h-4" />,
    },
  ];

  const systemItems: NavItem[] = [
    { label: "Programs", href: "/admin/programs", icon: <Package className="w-4 h-4" /> },
    { label: "Payouts", href: "/admin/payouts", icon: <CreditCard className="w-4 h-4" /> },
    { label: "Admin Accounts", href: "/admin/accounts", icon: <ShieldCheck className="w-4 h-4" /> },
    { label: "Sheets Sync", href: "/admin/sheets-sync", icon: <Sheet className="w-4 h-4" /> },
    { label: "Audit Log", href: "/admin/audit-log", icon: <ScrollText className="w-4 h-4" /> },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return location === "/admin";
    return location.startsWith(href);
  };

  const signupLink = `${window.location.origin}/register`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(signupLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? "w-16" : "w-56"} flex-shrink-0 bg-[#060414] text-white flex flex-col transition-all duration-200 relative`}
      >
        {/* Logo */}
        <div className={`p-4 border-b border-white/10 ${collapsed ? "px-3" : ""}`}>
          <div className="flex items-center gap-2.5">
            <img src={bcpLogo} alt="BCP" className="h-9 w-9 object-contain flex-shrink-0" />
            {!collapsed && (
              <div>
                <div className="font-bold text-sm leading-tight">Better Credit Partners</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Partner Portal</div>
              </div>
            )}
          </div>
        </div>

        {/* Commission info badge */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 bg-[#243347] rounded-lg border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#52ceff]">$50</span>
              <div className="text-[10px] text-slate-400 leading-tight">
                Per enrolled client<br />
                Individual + Business
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto mt-4 px-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-medium px-2 mb-2">
            {!collapsed && "Navigation"}
          </div>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 cursor-pointer transition-all text-sm ${
                  isActive(item.href)
                    ? "bg-[#123f56] text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                } ${collapsed ? "justify-center px-2" : ""}`}
              >
                {item.icon}
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`${item.badgeColor || "bg-blue-500"} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </div>
            </Link>
          ))}

          {/* System section */}
          {!collapsed && (
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-medium px-2 mb-2 mt-6">
              System
            </div>
          )}
          {systemItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 cursor-pointer transition-all text-sm ${
                  isActive(item.href)
                    ? "bg-[#123f56] text-white font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                } ${collapsed ? "justify-center px-2" : ""}`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* User pill */}
        <div className="p-3 border-t border-white/10">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user?.username?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.username}</div>
                <div className="text-[10px] text-slate-400">Admin · Better Credit Partners</div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold mx-auto">
              {user?.username?.[0]?.toUpperCase() || "A"}
            </div>
          )}

          <div className="flex gap-1 mt-2">
            <a
              href="/"
              className={`flex items-center gap-1.5 text-slate-400 hover:text-white text-xs py-1 px-2 rounded hover:bg-white/5 transition-colors ${collapsed ? "justify-center w-full" : ""}`}
            >
              <ExternalLink className="w-3 h-3" />
              {!collapsed && "Website"}
            </a>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs py-1 px-2 rounded hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#060414] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </div>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#123f56] hover:bg-[#0e3245] text-white gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite Partner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a Partner</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Share this signup link with potential partners. They'll be able to register and start referring clients.
                  </p>
                  <div className="flex gap-2">
                    <Input readOnly value={signupLink} className="text-sm font-mono" />
                    <Button onClick={handleCopyLink} variant="outline" className="shrink-0">
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
