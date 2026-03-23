import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

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
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (role && user?.role !== role) return <Redirect to="/" />;

  return <>{children}</>;
}
