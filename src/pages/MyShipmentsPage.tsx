import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignatureCapture } from "@/components/SignatureCapture";
import { ShipmentTimeline } from "@/components/ShipmentTimeline";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, ArrowLeft, Loader2, Filter, Pencil, MapPin, Truck, Weight, Calendar, PenTool, FileCheck, Eye, DollarSign, User, Clock } from "lucide-react";
import { format } from "date-fns";

interface Load {
  id: string;
  origin_address: string;
  destination_address: string;
  status: "Pending" | "Assigned" | "In-Transit" | "Delivered";
  trailer_type: string;
  weight_lbs: number;
  pickup_date: string;
  pickup_time: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  driver_name: string | null;
  truck_number: string | null;
  price_cents: number | null;
  client_signature_url: string | null;
  created_at: string;
  assigned_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  eta: string | null;
}

const trailerTypes = ["Dry Van", "Reefer", "Flatbed", "Stepdeck"] as const;

export default function MyShipmentsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [viewingLoad, setViewingLoad] = useState<Load | null>(null);
  const [signingLoad, setSigningLoad] = useState<Load | null>(null);
  const [editForm, setEditForm] = useState({
    origin_address: "",
    destination_address: "",
    trailer_type: "",
    weight_lbs: "",
    pickup_date: "",
    pickup_time: "",
    delivery_date: "",
    delivery_time: "",
  });
  const [saving, setSaving] = useState(false);

  const openEditModal = (load: Load) => {
    setEditingLoad(load);
    setEditForm({
      origin_address: load.origin_address,
      destination_address: load.destination_address,
      trailer_type: load.trailer_type,
      weight_lbs: load.weight_lbs.toString(),
      pickup_date: load.pickup_date,
      pickup_time: load.pickup_time || "",
      delivery_date: load.delivery_date || "",
      delivery_time: load.delivery_time || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLoad) return;

    setSaving(true);
    const { error } = await supabase
      .from("loads")
      .update({
        origin_address: editForm.origin_address,
        destination_address: editForm.destination_address,
        trailer_type: editForm.trailer_type,
        weight_lbs: parseInt(editForm.weight_lbs),
        pickup_date: editForm.pickup_date,
        pickup_time: editForm.pickup_time || null,
        delivery_date: editForm.delivery_date || null,
        delivery_time: editForm.delivery_time || null,
      })
      .eq("id", editingLoad.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: error.message,
      });
    } else {
      toast({
        title: "Load Updated",
        description: "Your shipment details have been saved.",
      });
      setEditingLoad(null);
      fetchLoads();
    }
    setSaving(false);
  };

  const handleSignDelivery = async (signatureDataUrl: string) => {
    if (!signingLoad) return;

    const { error } = await supabase
      .from("loads")
      .update({
        client_signature_url: signatureDataUrl,
        signature_timestamp: new Date().toISOString(),
      })
      .eq("id", signingLoad.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to save signature",
        description: error.message,
      });
      throw error;
    }

    toast({
      title: "Delivery Confirmed!",
      description: "Thank you for confirming receipt of your shipment.",
    });
    fetchLoads();
  };

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
              <SelectItem value="Assigned">Assigned</SelectItem>
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
                        {load.price_cents && load.status !== "Pending" && (
                          <div className="text-lg font-bold text-foreground">
                            ${(load.price_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          Pickup: {new Date(load.pickup_date).toLocaleDateString()}
                        </div>
                        {load.eta && load.status !== "Delivered" && (
                          <div className="flex items-center gap-1 text-accent font-medium">
                            <Clock size={14} />
                            ETA: {format(new Date(load.eta), "MMM d 'at' h:mm a")}
                          </div>
                        )}
                        {load.driver_name && (
                          <div className="text-foreground font-medium">
                            Driver: {load.driver_name}
                            {load.truck_number && <span className="text-muted-foreground"> • {load.truck_number}</span>}
                          </div>
                        )}
                        {load.status === "Pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(load)}
                            className="mt-2"
                          >
                            <Pencil size={14} className="mr-1" />
                            Edit
                          </Button>
                        )}
                        {(load.status === "Assigned" || load.status === "In-Transit") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingLoad(load)}
                            className="mt-2"
                          >
                            <Eye size={14} className="mr-1" />
                            View Details
                          </Button>
                        )}
                        {load.status === "Delivered" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingLoad(load)}
                            className="mt-2"
                          >
                            <Eye size={14} className="mr-1" />
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Modal */}
        <SignatureCapture
          open={!!signingLoad}
          onClose={() => setSigningLoad(null)}
          onSign={handleSignDelivery}
          loadInfo={signingLoad ? {
            origin: signingLoad.origin_address,
            destination: signingLoad.destination_address,
            driverName: signingLoad.driver_name || undefined,
          } : undefined}
        />

        {/* Edit Modal */}
        <Dialog open={!!editingLoad} onOpenChange={(open) => !open && setEditingLoad(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Shipment</DialogTitle>
              <DialogDescription>
                Update your pending shipment details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-origin" className="flex items-center gap-2">
                  <MapPin size={16} className="text-status-pending" />
                  Pickup Location
                </Label>
                <Input
                  id="edit-origin"
                  value={editForm.origin_address}
                  onChange={(e) => setEditForm({ ...editForm, origin_address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-destination" className="flex items-center gap-2">
                  <MapPin size={16} className="text-status-delivered" />
                  Delivery Location
                </Label>
                <Input
                  id="edit-destination"
                  value={editForm.destination_address}
                  onChange={(e) => setEditForm({ ...editForm, destination_address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-trailer" className="flex items-center gap-2">
                  <Truck size={16} className="text-accent" />
                  Trailer Type
                </Label>
                <Select
                  value={editForm.trailer_type}
                  onValueChange={(v) => setEditForm({ ...editForm, trailer_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trailer type" />
                  </SelectTrigger>
                  <SelectContent>
                    {trailerTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-weight" className="flex items-center gap-2">
                  <Weight size={16} className="text-muted-foreground" />
                  Weight (lbs)
                </Label>
                <Input
                  id="edit-weight"
                  type="number"
                  min="1"
                  max="100000"
                  value={editForm.weight_lbs}
                  onChange={(e) => setEditForm({ ...editForm, weight_lbs: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date" className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  Pickup Date & Time
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="edit-date"
                    type="date"
                    value={editForm.pickup_date}
                    onChange={(e) => setEditForm({ ...editForm, pickup_date: e.target.value })}
                  />
                  <Input
                    id="edit-pickup-time"
                    type="time"
                    value={editForm.pickup_time}
                    onChange={(e) => setEditForm({ ...editForm, pickup_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-delivery-date" className="flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  Delivery Date & Time
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="edit-delivery-date"
                    type="date"
                    value={editForm.delivery_date}
                    onChange={(e) => setEditForm({ ...editForm, delivery_date: e.target.value })}
                  />
                  <Input
                    id="edit-delivery-time"
                    type="time"
                    value={editForm.delivery_time}
                    onChange={(e) => setEditForm({ ...editForm, delivery_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingLoad(null)}>
                  Cancel
                </Button>
                <Button variant="accent" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Modal (Read-only) */}
        <Dialog open={!!viewingLoad} onOpenChange={(open) => !open && setViewingLoad(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Shipment Details
                {viewingLoad && <StatusBadge status={viewingLoad.status} />}
              </DialogTitle>
              <DialogDescription>
                View your shipment information.
              </DialogDescription>
            </DialogHeader>
            {viewingLoad && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={12} className="text-status-pending" />
                      Pickup Location
                    </Label>
                    <p className="text-sm font-medium">{viewingLoad.origin_address}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(viewingLoad.pickup_date).toLocaleDateString()}
                      {viewingLoad.pickup_time && ` at ${viewingLoad.pickup_time.slice(0, 5)}`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin size={12} className="text-status-delivered" />
                      Delivery Location
                    </Label>
                    <p className="text-sm font-medium">{viewingLoad.destination_address}</p>
                    {viewingLoad.delivery_date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(viewingLoad.delivery_date).toLocaleDateString()}
                        {viewingLoad.delivery_time && ` at ${viewingLoad.delivery_time.slice(0, 5)}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Truck size={12} />
                      Trailer Type
                    </Label>
                    <p className="text-sm font-medium">{viewingLoad.trailer_type}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Weight size={12} />
                      Weight
                    </Label>
                    <p className="text-sm font-medium">{viewingLoad.weight_lbs.toLocaleString()} lbs</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} />
                      Pickup
                    </Label>
                    <p className="text-sm font-medium">
                      {new Date(viewingLoad.pickup_date).toLocaleDateString()}
                      {viewingLoad.pickup_time && (
                        <span className="text-muted-foreground"> {viewingLoad.pickup_time.slice(0, 5)}</span>
                      )}
                    </p>
                  </div>
                </div>

                {viewingLoad.price_cents && (
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <DollarSign size={12} />
                      Price
                    </Label>
                    <p className="text-2xl font-bold text-accent">
                      ${(viewingLoad.price_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}

                {viewingLoad.driver_name && (
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <User size={12} />
                      Driver Information
                    </Label>
                    <p className="text-sm font-medium">{viewingLoad.driver_name}</p>
                    {viewingLoad.truck_number && (
                      <p className="text-sm text-muted-foreground">Truck: {viewingLoad.truck_number}</p>
                    )}
                  </div>
                )}

                {viewingLoad.eta && (
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Clock size={12} />
                      Estimated Arrival
                    </Label>
                    <p className="text-lg font-bold text-accent">
                      {format(new Date(viewingLoad.eta), "PPPP 'at' p")}
                    </p>
                  </div>
                )}

                {viewingLoad.client_signature_url && (
                  <div className="flex items-center gap-2 text-status-delivered">
                    <FileCheck size={16} />
                    <span className="text-sm font-medium">Delivery Confirmed</span>
                  </div>
                )}

                {/* Status Timeline */}
                <div className="border-t pt-4 mt-4">
                  <Label className="text-sm font-medium mb-2 block">Tracking Timeline</Label>
                  <ShipmentTimeline
                    currentStatus={viewingLoad.status}
                    createdAt={viewingLoad.created_at}
                    assignedAt={viewingLoad.assigned_at}
                    inTransitAt={viewingLoad.in_transit_at}
                    deliveredAt={viewingLoad.delivered_at}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setViewingLoad(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
