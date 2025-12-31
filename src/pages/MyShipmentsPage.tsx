import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, ArrowLeft, Loader2, Filter } from "lucide-react";

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

export default function MyShipmentsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching loads:", error);
    } else {
      setLoads((data as Load[]) || []);
    }
    setLoading(false);
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

  if (userRole !== "client") {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredLoads = statusFilter === "all" 
    ? loads 
    : loads.filter(l => l.status === statusFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground">My Shipments</h1>
            <p className="text-muted-foreground">Track all your loads in one place.</p>
          </div>
          <Link to="/dashboard/request">
            <Button variant="accent">
              <Plus className="mr-2" size={18} />
              Request New Load
            </Button>
          </Link>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="In-Transit">In Transit</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredLoads.length} shipment{filteredLoads.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Shipments List */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Shipment History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : filteredLoads.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto text-muted-foreground/50 mb-4" size={48} />
                <p className="text-muted-foreground mb-4">
                  {statusFilter === "all" ? "No shipments yet" : `No ${statusFilter.toLowerCase()} shipments`}
                </p>
                {statusFilter === "all" && (
                  <Link to="/dashboard/request">
                    <Button variant="accent">Request Your First Load</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLoads.map((load) => (
                  <div
                    key={load.id}
                    className="p-5 bg-secondary/30 rounded-xl border border-border/50 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <StatusBadge status={load.status} />
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {load.trailer_type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {load.weight_lbs.toLocaleString()} lbs
                          </span>
                        </div>
                        <div className="text-sm mb-2">
                          <div className="flex items-start gap-2">
                            <span className="w-16 text-muted-foreground shrink-0">From:</span>
                            <span className="font-medium">{load.origin_address}</span>
                          </div>
                          <div className="flex items-start gap-2 mt-1">
                            <span className="w-16 text-muted-foreground shrink-0">To:</span>
                            <span className="font-medium">{load.destination_address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-sm">
                        <div className="text-muted-foreground">
                          Pickup: {new Date(load.pickup_date).toLocaleDateString()}
                        </div>
                        {load.driver_name && (
                          <div className="text-foreground font-medium">
                            Driver: {load.driver_name}
                            {load.truck_number && <span className="text-muted-foreground"> • {load.truck_number}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
