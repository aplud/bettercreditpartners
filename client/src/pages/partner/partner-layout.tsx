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
  SidebarGroupContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  DollarSign,
  LinkIcon,
  FileCheck,
  User,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import bcpLogo from "@assets/BCP-ISOLOGO_1768516740168.png";

const navItems = [
  { label: "Dashboard", href: "/partner", icon: LayoutDashboard },
  { label: "Submit Lead", href: "/partner/submit-lead", icon: UserPlus },
  { label: "My Leads", href: "/partner/leads", icon: FileText },
  { label: "Commissions", href: "/partner/commissions", icon: DollarSign },
  { label: "Referral Link", href: "/partner/referral-link", icon: LinkIcon },
  { label: "Agreement", href: "/partner/agreement", icon: FileCheck },
  { label: "Profile", href: "/partner/profile", icon: User },
];

export default function PartnerLayout({
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
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-2 py-1">
            <img src={bcpLogo} alt="BCP" className="h-8 w-8 object-contain" />
            <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">
              BCP Partners
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.href}
                      tooltip={item.label}
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
        </SidebarContent>
        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Back to Website">
                <a href="/">
                  <ExternalLink />
                  <span>Back to Website</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Sign Out">
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
            {user?.username}
          </span>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
