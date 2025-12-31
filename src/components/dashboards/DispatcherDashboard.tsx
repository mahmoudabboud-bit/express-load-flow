import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  ArrowRight,
  Weight
} from "lucide-react";

interface Load {
  id: string;
  origin_address: string;
  destination_address: string;
  status: "Pending" | "Approved" | "In-Transit" | "Delivered";
  trailer_type: string;
  weight_lbs: number;
  pickup_date: string;
  driver_name: string | null;
  truck_number: string | null;
  created_at: string;
}

export function DispatcherDashboard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    const { data, error } = await supabase
      .from("loads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

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
    totalWeight: loads.reduce((acc, l) => acc + (l.weight_lbs || 0), 0),
  };

  const pendingLoads = loads.filter((l) => l.status === "Pending");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dispatch Center</h1>
          <p className="text-muted-foreground">Manage loads and track operations.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/queue">
            <Button variant="outline">
              <Package className="mr-2" size={18} />
              View Full Queue
            </Button>
          </Link>
          <Link to="/dashboard/insights">
            <Button variant="accent">
              <TrendingUp className="mr-2" size={18} />
              View Insights
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

        <Card className="card-elevated col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <Weight className="text-accent" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {(stats.totalWeight / 1000).toFixed(1)}k
                </p>
                <p className="text-sm text-muted-foreground">Active lbs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approval */}
      <Card className="card-elevated border-l-4 border-l-status-pending">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="text-status-pending" size={20} />
            Pending Approval ({pendingLoads.length})
          </CardTitle>
          <Link to="/dashboard/queue">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2" size={16} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : pendingLoads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending loads to approve
            </div>
          ) : (
            <div className="space-y-4">
              {pendingLoads.slice(0, 5).map((load) => (
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
                      <span className="text-xs text-muted-foreground">
                        • {load.weight_lbs?.toLocaleString()} lbs
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{load.origin_address}</span>
                      <span className="text-muted-foreground mx-2">→</span>
                      <span className="font-medium">{load.destination_address}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      {new Date(load.pickup_date).toLocaleDateString()}
                    </div>
                    <Link to={`/dashboard/queue?approve=${load.id}`}>
                      <Button variant="accent" size="sm">
                        Approve & Assign
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4">
              {loads.filter(l => l.status !== "Pending").slice(0, 5).map((load) => (
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
