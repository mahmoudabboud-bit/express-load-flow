import { useAuth } from "@/lib/auth-context";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ClientDashboard } from "@/components/dashboards/ClientDashboard";
import { DispatcherDashboard } from "@/components/dashboards/DispatcherDashboard";
import { DriverDashboard } from "@/components/dashboards/DriverDashboard";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderDashboard = () => {
    switch (userRole) {
      case "client":
        return <ClientDashboard />;
      case "dispatcher":
        return <DispatcherDashboard />;
      case "driver":
        return <DriverDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        );
    }
  };

  return <DashboardLayout>{renderDashboard()}</DashboardLayout>;
}
