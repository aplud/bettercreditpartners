import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import bcpLogo from "@assets/BCP-ISOLOGO_1768516740168.png";

export function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <img src={bcpLogo} alt="BCP" className="h-12 w-12 animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (role && user?.role !== role) {
    // Redirect to the correct portal for their role
    if (user?.role === "admin") return <Redirect to="/admin" />;
    if (user?.role === "partner") return <Redirect to="/partner" />;
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
