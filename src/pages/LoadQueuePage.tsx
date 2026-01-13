import { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Package, ArrowLeft, Loader2, Filter, UserCheck, Truck, DollarSign, Pencil } from "lucide-react";

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
  client_id: string;
  driver_id: string | null;
}

interface Driver {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  truck_type: string;
  truck_number: string;
  email: string;
  active: boolean;
}

export default function LoadQueuePage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Approval modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [price, setPrice] = useState("");
  const [approving, setApproving] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user && userRole === "dispatcher") {
      fetchLoads();
      fetchDrivers();
    }
  }, [user, userRole]);

  const fetchDrivers = async () => {
    // Fetch from the drivers table
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("active", true)
      .order("last_name", { ascending: true });

    if (error) {
      console.error("Error fetching drivers:", error);
    } else if (data) {
      setDrivers(data);
    }
  };

  useEffect(() => {
    const approveId = searchParams.get("approve");
    if (approveId && loads.length > 0) {
      const load = loads.find(l => l.id === approveId);
      if (load && load.status === "Pending") {
        openApprovalModal(load);
      }
    }
  }, [searchParams, loads]);

  const fetchLoads = async () => {
    const { data, error } = await supabase
      .from("loads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching loads:", error);
    } else {
      setLoads((data as Load[]) || []);
    }
    setLoading(false);
  };

  const openApprovalModal = (load: Load, editing = false) => {
    setSelectedLoad(load);
    setIsEditing(editing);
    setSelectedDriverId(editing ? load.driver_id || "" : "");
    setDriverName(editing ? load.driver_name || "" : "");
    setTruckNumber(editing ? load.truck_number || "" : "");
    setPrice(editing && load.price_cents ? (load.price_cents / 100).toFixed(2) : "");
    setApprovalModalOpen(true);
  };

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setDriverName(`${driver.first_name} ${driver.last_name}`);
      setTruckNumber(driver.truck_number);
    }
  };

  const handleApprove = async () => {
    if (!selectedLoad || !selectedDriverId || !truckNumber.trim() || !price.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a driver, enter truck number, and price.",
      });
      return;
    }

    const selectedDriver = drivers.find(d => d.id === selectedDriverId);
    const driverFullName = selectedDriver ? `${selectedDriver.first_name} ${selectedDriver.last_name}` : driverName.trim();

    const priceInCents = Math.round(parseFloat(price) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid price",
        description: "Please enter a valid price.",
      });
      return;
    }

    setApproving(true);

    const updateData: Record<string, unknown> = {
      driver_id: selectedDriver?.user_id || null,
      driver_name: driverFullName,
      truck_number: truckNumber.trim(),
      price_cents: priceInCents,
    };
    
    // Only update status and timestamp if we're assigning, not editing
    if (!isEditing) {
      updateData.status = "Assigned";
      updateData.assigned_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("loads")
      .update(updateData)
      .eq("id", selectedLoad.id);

    if (error) {
      toast({
        variant: "destructive",
        title: isEditing ? "Failed to update" : "Failed to assign",
        description: error.message,
      });
    } else {
      // Only send notification for new assignments, not edits
      if (!isEditing) {
        // Get client email from profiles table
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", selectedLoad.client_id)
          .single();

        // Send approval notification if we have the email
        if (clientProfile?.email) {
          await sendNotification(
            "load_approved",
            clientProfile.email,
            {
              id: selectedLoad.id,
              origin_address: selectedLoad.origin_address,
              destination_address: selectedLoad.destination_address,
              pickup_date: selectedLoad.pickup_date,
              driver_name: driverName.trim(),
              truck_number: truckNumber.trim(),
            },
            false,
            selectedLoad.client_id // for in-app notification
          );
        }
      }
      
      toast({
        title: isEditing ? "Load Updated!" : "Load Assigned!",
        description: `${isEditing ? "Updated" : "Assigned"} to ${driverName} (${truckNumber}).`,
      });
      setApprovalModalOpen(false);
      fetchLoads();
    }

    setApproving(false);
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

  if (userRole !== "dispatcher") {
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
            <h1 className="text-2xl font-bold text-foreground">Load Queue</h1>
            <p className="text-muted-foreground">Manage all loads and assign drivers.</p>
          </div>
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
            {filteredLoads.length} load{filteredLoads.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Loads List */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>All Loads</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : filteredLoads.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto text-muted-foreground/50 mb-4" size={48} />
                <p className="text-muted-foreground">
                  {statusFilter === "all" ? "No loads in the system" : `No ${statusFilter.toLowerCase()} loads`}
                </p>
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
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
                        <div className="text-sm text-right">
                          <div className="text-muted-foreground">
                            Pickup: {new Date(load.pickup_date).toLocaleDateString()}
                          </div>
                          {load.driver_name && (
                            <div className="text-foreground font-medium">
                              {load.driver_name} • {load.truck_number}
                            </div>
                          )}
                        </div>
                        {load.status === "Pending" && (
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => openApprovalModal(load, false)}
                          >
                            <UserCheck className="mr-2" size={16} />
                            Approve & Assign
                          </Button>
                        )}
                        {load.status === "Assigned" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openApprovalModal(load, true)}
                          >
                            <Pencil className="mr-2" size={16} />
                            Edit
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
      </div>

      {/* Approval Modal */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Assignment" : "Approve & Assign Driver"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update driver, truck, or price details." : "Assign a driver and truck to this load."}
            </DialogDescription>
          </DialogHeader>

          {selectedLoad && (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg text-sm">
                <div className="font-medium mb-2">{selectedLoad.trailer_type} • {selectedLoad.weight_lbs.toLocaleString()} lbs</div>
                <div><span className="text-muted-foreground">From:</span> {selectedLoad.origin_address}</div>
                <div><span className="text-muted-foreground">To:</span> {selectedLoad.destination_address}</div>
                <div><span className="text-muted-foreground">Pickup:</span> {new Date(selectedLoad.pickup_date).toLocaleDateString()}</div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <UserCheck size={16} />
                  Select Driver
                </Label>
                <Select value={selectedDriverId} onValueChange={handleDriverSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No drivers available. <Link to="/dashboard/drivers" className="text-accent underline">Add drivers first</Link>.
                      </div>
                    ) : (
                      drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.first_name} {driver.last_name} - {driver.truck_type} ({driver.truck_number})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="truckNumber" className="flex items-center gap-2">
                  <Truck size={16} />
                  Truck Number
                </Label>
                <Input
                  id="truckNumber"
                  placeholder="TRK-1234"
                  value={truckNumber}
                  onChange={(e) => setTruckNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <DollarSign size={16} />
                  Price ($)
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1500.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleApprove} disabled={approving}>
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? "Save Changes" : "Assign Load"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
