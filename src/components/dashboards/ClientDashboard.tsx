import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Package, Truck, Clock, CheckCircle, Plus, ArrowRight } from "lucide-react";

interface Load {
  id: string;
  origin_address: string;
  destination_address: string;
  status: "Pending" | "Approved" | "In-Transit" | "Delivered";
  trailer_type: string;
  pickup_date: string;
  driver_name: string | null;
  truck_number: string | null;
  created_at: string;
}

export function ClientDashboard() {
  const { user } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoads();
    }
  }, [user]);

  const fetchLoads = async () => {
    const { data, error } = await supabase
      .from("loads")
      .select("*")
      .eq("client_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching loads:", error);
    } else {
      setLoads((data as Load[]) || []);
    }
    setLoading(false);
  };

  const stats = {
    total: loads.length,
    pending: loads.filter((l) => l.status === "Pending").length,
    inTransit: loads.filter((l) => l.status === "In-Transit").length,
    delivered: loads.filter((l) => l.status === "Delivered").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back!</h1>
          <p className="text-muted-foreground">Track your shipments and request new loads.</p>
        </div>
        <Link to="/dashboard/request">
          <Button variant="accent" size="lg">
            <Plus className="mr-2" size={18} />
            Request New Load
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                <Package className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Loads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-status-pending/20 rounded-xl flex items-center justify-center">
                <Clock className="text-status-pending" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-status-in-transit/20 rounded-xl flex items-center justify-center">
                <Truck className="text-status-in-transit" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inTransit}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-status-delivered/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-status-delivered" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.delivered}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Shipments */}
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Shipments</CardTitle>
          <Link to="/dashboard/shipments">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2" size={16} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : loads.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-muted-foreground/50 mb-4" size={48} />
              <p className="text-muted-foreground mb-4">No shipments yet</p>
              <Link to="/dashboard/request">
                <Button variant="accent">Request Your First Load</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {loads.map((load) => (
                <div
                  key={load.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/30 rounded-xl gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={load.status} />
                      <span className="text-xs text-muted-foreground">
                        {load.trailer_type}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{load.origin_address}</span>
                      <span className="text-muted-foreground mx-2">→</span>
                      <span className="font-medium">{load.destination_address}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {load.driver_name && (
                      <div>
                        <span className="text-foreground font-medium">{load.driver_name}</span>
                        {load.truck_number && <span> • {load.truck_number}</span>}
                      </div>
                    )}
                    <div>{new Date(load.pickup_date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
