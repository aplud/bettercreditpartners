import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  DollarSign,
  CreditCard,
  Sheet,
  ScrollText,
  LogOut,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import bcpLogo from "@assets/BCP-ISOLOGO_1768516740168.png";

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Programs",
    items: [
      { label: "Referral Programs", href: "/admin/programs", icon: Package },
    ],
  },
  {
    label: "Partners",
    items: [
      { label: "All Partners", href: "/admin/partners", icon: Users },
    ],
  },
  {
    label: "Leads",
    items: [
      { label: "All Leads", href: "/admin/leads", icon: FileText },
    ],
  },
  {
    label: "Commissions",
    items: [
      { label: "Commission Tracker", href: "/admin/commissions", icon: DollarSign },
      { label: "Payout Reports", href: "/admin/payouts", icon: CreditCard },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Admin Accounts", href: "/admin/accounts", icon: ShieldCheck },
      { label: "Google Sheets Sync", href: "/admin/sheets-sync", icon: Sheet },
      { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.clear();
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b bg-slate-900 text-white">
          <div className="flex items-center gap-2 px-2 py-1">
            <img src={bcpLogo} alt="BCP" className="h-8 w-8 object-contain" />
            <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">
              BCP Admin
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-slate-900">
          {navGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-slate-400 text-xs uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        tooltip={item.label}
                        className="text-slate-300 hover:text-white hover:bg-slate-800 data-[active=true]:bg-slate-800 data-[active=true]:text-white"
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter className="border-t border-slate-700 bg-slate-900">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Back to Website"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <a href="/">
                  <ExternalLink />
                  <span>Back to Website</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Sign Out"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {user?.username} (admin)
          </span>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
