import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { SignedImage } from "@/components/SignedImage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  ArrowRight,
  Weight,
  Eye,
  MapPin,
  FileCheck,
  Users
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
  created_at: string;
  client_signature_url?: string | null;
  delivered_at?: string | null;
}

export function DispatcherDashboard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingLoad, setViewingLoad] = useState<Load | null>(null);

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
    assigned: loads.filter((l) => l.status === "Assigned").length,
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
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/clients">
            <Button variant="outline">
              <Users className="mr-2" size={18} />
              Manage Clients
            </Button>
          </Link>
          <Link to="/dashboard/drivers">
            <Button variant="outline">
              <Truck className="mr-2" size={18} />
              Manage Drivers
            </Button>
          </Link>
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
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 bg-secondary/30 rounded-xl gap-4 ${
                    load.status === "Delivered" ? "cursor-pointer hover:bg-secondary/50 transition-colors" : ""
                  }`}
                  onClick={() => load.status === "Delivered" && setViewingLoad(load)}
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
                    {load.status === "Delivered" && (
                      <Eye size={16} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* View Delivered Load Dialog */}
      <Dialog open={!!viewingLoad} onOpenChange={(open) => !open && setViewingLoad(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-status-delivered" size={20} />
              Delivered Load Details
            </DialogTitle>
          </DialogHeader>
          {viewingLoad && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={viewingLoad.status} />
                <span className="text-sm text-muted-foreground">
                  {viewingLoad.trailer_type} • {viewingLoad.weight_lbs?.toLocaleString()} lbs
                </span>
              </div>

              {/* Driver Info */}
              {viewingLoad.driver_name && (
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <Truck size={12} />
                    Driver
                  </Label>
                  <p className="font-medium text-sm">
                    {viewingLoad.driver_name}
                    {viewingLoad.truck_number && <span className="text-muted-foreground"> • Truck #{viewingLoad.truck_number}</span>}
                  </p>
                </div>
              )}

              {/* Pickup Location */}
              <div className="p-3 bg-secondary/30 rounded-lg">
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin size={12} className="text-status-pending" />
                  Pickup Location
                </Label>
                <p className="font-medium text-sm">{viewingLoad.origin_address}</p>
              </div>

              {/* Delivery Location */}
              <div className="p-3 bg-secondary/30 rounded-lg">
                <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin size={12} className="text-status-delivered" />
                  Delivery Location
                </Label>
                <p className="font-medium text-sm">{viewingLoad.destination_address}</p>
              </div>

              {/* Delivered Date */}
              {viewingLoad.delivered_at && (
                <div className="p-3 bg-status-delivered/10 rounded-lg border border-status-delivered/20">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <CheckCircle size={12} className="text-status-delivered" />
                    Delivered On
                  </Label>
                  <p className="font-medium text-sm text-status-delivered">
                    {new Date(viewingLoad.delivered_at).toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {/* Client Signature */}
              {viewingLoad.client_signature_url ? (
                <div className="p-4 bg-status-delivered/10 rounded-lg border border-status-delivered/20">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                    <FileCheck size={12} className="text-status-delivered" />
                    Client Signature
                  </Label>
                  <div className="bg-white rounded-lg border border-border p-2">
                    <SignedImage
                      src={viewingLoad.client_signature_url}
                      alt="Client signature"
                      className="max-h-24 mx-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg border border-border text-center">
                  <p className="text-sm text-muted-foreground">No signature on file</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setViewingLoad(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
