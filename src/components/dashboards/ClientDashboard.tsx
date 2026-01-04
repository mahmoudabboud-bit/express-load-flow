import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Package, Truck, Clock, CheckCircle, Plus, ArrowRight, Pencil, MapPin, Weight, Calendar, Loader2 } from "lucide-react";

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

const trailerTypes = ["Dry Van", "Reefer", "Flatbed", "Stepdeck"] as const;

export function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLoad, setEditingLoad] = useState<Load | null>(null);
  const [editForm, setEditForm] = useState({
    origin_address: "",
    destination_address: "",
    trailer_type: "",
    weight_lbs: "",
    pickup_date: "",
  });
  const [saving, setSaving] = useState(false);

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

  const openEditModal = (load: Load) => {
    setEditingLoad(load);
    setEditForm({
      origin_address: load.origin_address,
      destination_address: load.destination_address,
      trailer_type: load.trailer_type,
      weight_lbs: load.weight_lbs.toString(),
      pickup_date: load.pickup_date,
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
                    {load.status === "Pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(load)}
                      >
                        <Pencil size={14} className="mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                Pickup Date
              </Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.pickup_date}
                onChange={(e) => setEditForm({ ...editForm, pickup_date: e.target.value })}
              />
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
    </div>
  );
}
