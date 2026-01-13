import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Truck, 
  MapPin, 
  Navigation, 
  Clock,
  CheckCircle,
  Package
} from "lucide-react";

interface Load {
  id: string;
  origin_address: string;
  destination_address: string;
  status: "Pending" | "Assigned" | "In-Transit" | "Delivered";
  trailer_type: string;
  weight_lbs: number;
  pickup_date: string;
  driver_name: string | null;
  truck_number: string | null;
  price_cents: number | null;
  client_id: string;
}

export default function DriverLoadsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user && userRole === "driver") {
      fetchLoads();
    }
  }, [user, userRole]);

  const fetchLoads = async () => {
    if (!user?.id) return;

    // First, check if this user is linked in the drivers table
    const { data: driverRecord } = await supabase
      .from("drivers")
      .select("id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch loads assigned to this driver by driver_id
    const { data, error } = await supabase
      .from("loads")
      .select("*")
      .eq("driver_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching loads:", error);
    } else {
      setLoads((data as Load[]) || []);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (load: Load, newStatus: "In-Transit" | "Delivered") => {
    setUpdating(load.id);

    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    // Set the appropriate timestamp
    if (newStatus === "In-Transit") {
      updateData.in_transit_at = new Date().toISOString();
    } else if (newStatus === "Delivered") {
      updateData.delivered_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from("loads")
      .update(updateData)
      .eq("id", load.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update load status. Please try again.",
      });
    } else {
      // Get client email for notification
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", load.client_id)
        .single();

      if (clientProfile?.email) {
        const notificationType = newStatus === "In-Transit" ? "status_in_transit" : "status_delivered";
        await sendNotification(
          notificationType,
          clientProfile.email,
          {
            id: load.id,
            origin_address: load.origin_address,
            destination_address: load.destination_address,
            pickup_date: load.pickup_date,
            driver_name: load.driver_name || undefined,
          },
          false,
          load.client_id // for in-app notification
        );
      }

      toast({
        title: "Status Updated!",
        description: `Load marked as ${newStatus}.`,
      });
      fetchLoads();
    }
    setUpdating(null);
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== "driver") {
    return <Navigate to="/dashboard" replace />;
  }

  const activeLoads = loads.filter(l => l.status === "Assigned" || l.status === "In-Transit");
  const completedLoads = loads.filter(l => l.status === "Delivered");

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground">My Loads</h1>
          <p className="text-muted-foreground">View and manage your assigned loads.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Truck className="mx-auto text-accent animate-pulse-subtle" size={48} />
          </div>
        ) : (
          <>
            {/* Active Loads */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="text-accent" size={20} />
                  Active Loads ({activeLoads.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeLoads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="mx-auto mb-4 opacity-50" size={48} />
                    No active loads assigned
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeLoads.map((load) => (
                      <div key={load.id} className="p-5 bg-secondary/30 rounded-xl border-2 border-accent/20">
                        <div className="flex items-center justify-between mb-4">
                          <StatusBadge status={load.status} />
                          <span className="text-sm text-muted-foreground">
                            {load.trailer_type} • {load.weight_lbs?.toLocaleString()} lbs
                          </span>
                        </div>

                        {/* Pickup */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-status-pending/20 rounded-full flex items-center justify-center shrink-0">
                              <MapPin className="text-status-pending" size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground uppercase font-medium">Pickup</p>
                              <p className="font-medium text-sm">{load.origin_address}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => openInMaps(load.origin_address)}
                          >
                            <Navigation className="mr-2" size={16} />
                            Navigate to Pickup
                          </Button>
                        </div>

                        {/* Delivery */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-status-delivered/20 rounded-full flex items-center justify-center shrink-0">
                              <MapPin className="text-status-delivered" size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground uppercase font-medium">Delivery</p>
                              <p className="font-medium text-sm">{load.destination_address}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => openInMaps(load.destination_address)}
                          >
                            <Navigation className="mr-2" size={16} />
                            Navigate to Delivery
                          </Button>
                        </div>

                        {/* Pickup Date */}
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
                          <Clock className="text-muted-foreground" size={18} />
                          <div>
                            <p className="text-xs text-muted-foreground">Scheduled Pickup</p>
                            <p className="font-medium text-sm">
                              {new Date(load.pickup_date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        {load.status === "Assigned" && (
                          <Button
                            variant="accent"
                            size="lg"
                            className="w-full"
                            onClick={() => handleStatusUpdate(load, "In-Transit")}
                            disabled={updating === load.id}
                          >
                            {updating === load.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Truck className="mr-2" size={18} />
                                Mark as Picked Up
                              </>
                            )}
                          </Button>
                        )}

                        {load.status === "In-Transit" && (
                          <Button
                            variant="accent"
                            size="lg"
                            className="w-full bg-status-delivered hover:bg-status-delivered/90"
                            onClick={() => handleStatusUpdate(load, "Delivered")}
                            disabled={updating === load.id}
                          >
                            {updating === load.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="mr-2" size={18} />
                                Mark as Delivered
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Loads */}
            {completedLoads.length > 0 && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="text-status-delivered" size={20} />
                    Completed ({completedLoads.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completedLoads.slice(0, 10).map((load) => (
                      <div
                        key={load.id}
                        className="p-4 bg-secondary/30 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <StatusBadge status={load.status} />
                          <span className="text-xs text-muted-foreground">
                            {load.trailer_type}
                          </span>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">{load.origin_address}</span>
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className="font-medium">{load.destination_address}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
