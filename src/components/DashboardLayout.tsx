import { ReactNode, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { NotificationBell } from "@/components/NotificationBell";
import { PushNotificationPrompt } from "@/components/PushNotificationPrompt";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = {
    client: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Package, label: "Request Load", href: "/dashboard/request" },
      { icon: Truck, label: "My Shipments", href: "/dashboard/shipments" },
    ],
    dispatcher: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Package, label: "Load Queue", href: "/dashboard/queue" },
      { icon: BarChart3, label: "Insights", href: "/dashboard/insights" },
    ],
    driver: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Truck, label: "My Loads", href: "/dashboard/my-loads" },
    ],
  };

  const currentNavItems = userRole ? navItems[userRole] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-16 flex items-center justify-between px-4">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 gradient-hero text-primary-foreground transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <Logo variant="light" size="md" />
        </div>

        <nav className="px-4 py-6 space-y-1">
          {currentNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-accent"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center">
              <User size={20} className="text-sidebar-foreground" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-border bg-card">
          <div>
            <h1 className="text-lg font-semibold text-foreground capitalize">
              {userRole} Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center">
                <User size={18} className="text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">{children}</div>
      </main>

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />
    </div>
  );
}
