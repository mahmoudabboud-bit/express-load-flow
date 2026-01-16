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
import { Package, ArrowLeft, Loader2, Filter, UserCheck, Truck, DollarSign, Pencil, Eye, MapPin, FileCheck, CheckCircle, User, Phone, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface Client {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
}

interface Load {
  id: string;
  origin_address: string;
  destination_address: string;
  status: "Pending" | "Assigned" | "Arrived" | "Loaded" | "In-Transit" | "Arrived at Delivery" | "Delivered";
  trailer_type: string;
  weight_lbs: number;
  pickup_date: string;
  pickup_time: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  driver_name: string | null;
  truck_number: string | null;
  price_cents: number | null;
  created_at: string;
  client_id: string;
  driver_id: string | null;
  client_signature_url: string | null;
  delivered_at: string | null;
  assigned_at: string | null;
  in_transit_at: string | null;
  eta: string | null;
  client?: Client | null;
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
  activeLoads?: number;
  availability_status: string | null;
  available_at: string | null;
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
  const [eta, setEta] = useState<Date | undefined>(undefined);
  const [etaTime, setEtaTime] = useState("12:00");
  const [approving, setApproving] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingLoad, setViewingLoad] = useState<Load | null>(null);

  useEffect(() => {
    if (user && userRole === "dispatcher") {
      fetchLoads();
      fetchDrivers();
      fetchClients();

      // Subscribe to realtime changes on loads table
      const channel = supabase
        .channel('loads-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'loads',
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setLoads((prev) => [payload.new as Load, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setLoads((prev) =>
                prev.map((load) =>
                  load.id === payload.new.id ? (payload.new as Load) : load
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setLoads((prev) =>
                prev.filter((load) => load.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, userRole]);

  const fetchDrivers = async () => {
    // Fetch from the drivers table including availability fields
    const { data: driversData, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("active", true)
      .order("last_name", { ascending: true });

    if (error) {
      console.error("Error fetching drivers:", error);
      return;
    }

    if (!driversData) return;

    // Fetch active load counts for each driver
    const { data: activeCounts } = await supabase
      .from("loads")
      .select("driver_id")
      .in("status", ["Assigned", "Arrived", "Loaded", "In-Transit", "Arrived at Delivery"]);

    // Count loads per driver
    const loadCountMap: Record<string, number> = {};
    if (activeCounts) {
      activeCounts.forEach(load => {
        if (load.driver_id) {
          loadCountMap[load.driver_id] = (loadCountMap[load.driver_id] || 0) + 1;
        }
      });
    }

    // Add active load count to each driver
    const driversWithCounts = driversData.map(driver => ({
      ...driver,
      activeLoads: loadCountMap[driver.user_id] || 0,
    }));

    setDrivers(driversWithCounts);
  };

  // Filter drivers to only show available ones for assignment
  const availableDrivers = drivers.filter(
    driver => driver.availability_status === "Available" || driver.availability_status === null
  );

  useEffect(() => {
    const approveId = searchParams.get("approve");
    if (approveId && loads.length > 0) {
      const load = loads.find(l => l.id === approveId);
      if (load && load.status === "Pending") {
        openApprovalModal(load);
      }
    }
  }, [searchParams, loads]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("last_name", { ascending: true });

    if (error) {
      console.error("Error fetching clients:", error);
    } else {
      setClients(data || []);
    }
  };

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

  // Helper to get client info for a load
  const getClientForLoad = (load: Load): Client | null => {
    // First try to match by client_id === user_id in clients table
    return clients.find(c => c.user_id === load.client_id) || null;
  };

  const openApprovalModal = (load: Load, editing = false) => {
    setSelectedLoad(load);
    setIsEditing(editing);
    setSelectedDriverId(editing ? load.driver_id || "" : "");
    setDriverName(editing ? load.driver_name || "" : "");
    setTruckNumber(editing ? load.truck_number || "" : "");
    setPrice(editing && load.price_cents ? (load.price_cents / 100).toFixed(2) : "");
    if (editing && load.eta) {
      const etaDate = new Date(load.eta);
      setEta(etaDate);
      setEtaTime(format(etaDate, "HH:mm"));
    } else {
      setEta(undefined);
      setEtaTime("12:00");
    }
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

    // Combine date and time for ETA
    let combinedEta: string | null = null;
    if (eta) {
      const [hours, minutes] = etaTime.split(":").map(Number);
      const etaWithTime = new Date(eta);
      etaWithTime.setHours(hours, minutes, 0, 0);
      combinedEta = etaWithTime.toISOString();
    }

    const updateData: Record<string, unknown> = {
      driver_id: selectedDriver?.user_id || null,
      driver_name: driverFullName,
      truck_number: truckNumber.trim(),
      price_cents: priceInCents,
      eta: combinedEta,
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

      // Send ETA notification if ETA was set/updated (for edits with ETA change or new assignments with ETA)
      if (combinedEta) {
        const etaChanged = isEditing && selectedLoad.eta !== combinedEta;
        const newEtaSet = !isEditing && combinedEta;
        
        if (etaChanged || newEtaSet) {
          // Get client email from profiles table
          const { data: clientProfile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", selectedLoad.client_id)
            .single();

          if (clientProfile?.email) {
            await sendNotification(
              "eta_updated",
              clientProfile.email,
              {
                id: selectedLoad.id,
                origin_address: selectedLoad.origin_address,
                destination_address: selectedLoad.destination_address,
                pickup_date: selectedLoad.pickup_date,
                driver_name: driverFullName,
                truck_number: truckNumber.trim(),
                eta: combinedEta,
              },
              false,
              selectedLoad.client_id
            );
          }
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
              <SelectItem value="Arrived">Arrived</SelectItem>
              <SelectItem value="Loaded">Loaded</SelectItem>
              <SelectItem value="In-Transit">In Transit</SelectItem>
              <SelectItem value="Arrived at Delivery">Arrived at Delivery</SelectItem>
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
                {filteredLoads.map((load) => {
                  const client = getClientForLoad(load);
                  return (
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
                            {client && (
                              <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded flex items-center gap-1">
                                <User size={12} />
                                {client.first_name} {client.last_name}
                              </span>
                            )}
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
                          {(load as any).delivery_asap && (
                            <div className="text-accent font-medium">
                              Delivery: ASAP
                            </div>
                          )}
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingLoad(load)}
                            >
                              <Eye className="mr-2" size={16} />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openApprovalModal(load, true)}
                            >
                              <Pencil className="mr-2" size={16} />
                              Edit
                            </Button>
                          </div>
                        )}
                        {(load.status === "Arrived" || load.status === "Loaded" || load.status === "In-Transit" || load.status === "Arrived at Delivery" || load.status === "Delivered") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingLoad(load)}
                          >
                            <Eye className="mr-2" size={16} />
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
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

          {selectedLoad && (() => {
            const selectedClient = getClientForLoad(selectedLoad);
            return (
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-lg text-sm">
                <div className="font-medium mb-2">{selectedLoad.trailer_type} • {selectedLoad.weight_lbs.toLocaleString()} lbs</div>
                {selectedClient && (
                  <div className="mb-2 pb-2 border-b border-border/50">
                    <span className="text-muted-foreground">Client:</span>{" "}
                    <span className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</span>
                    <span className="text-muted-foreground"> ({selectedClient.phone_number})</span>
                  </div>
                )}
                <div><span className="text-muted-foreground">From:</span> {selectedLoad.origin_address}</div>
                <div><span className="text-muted-foreground">To:</span> {selectedLoad.destination_address}</div>
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground">Pickup:</span>{" "}
                    {new Date(selectedLoad.pickup_date).toLocaleDateString()}
                    {selectedLoad.pickup_time && ` at ${format(new Date(`2000-01-01T${selectedLoad.pickup_time}`), "h:mm a")}`}
                  </div>
                {(selectedLoad as any).delivery_asap ? (
                    <div>
                      <span className="text-muted-foreground">Delivery:</span>{" "}
                      <span className="font-medium text-accent">ASAP</span>
                    </div>
                  ) : selectedLoad.delivery_date && (
                    <div>
                      <span className="text-muted-foreground">Delivery:</span>{" "}
                      {new Date(selectedLoad.delivery_date).toLocaleDateString()}
                      {selectedLoad.delivery_time && ` at ${format(new Date(`2000-01-01T${selectedLoad.delivery_time}`), "h:mm a")}`}
                    </div>
                  )}
                </div>
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
                    {availableDrivers.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No available drivers. <Link to="/dashboard/drivers" className="text-accent underline">Manage drivers</Link>.
                      </div>
                    ) : (
                      availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span>{driver.first_name} {driver.last_name} - {driver.truck_type} ({driver.truck_number})</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              driver.activeLoads === 0 
                                ? "bg-green-500/20 text-green-600" 
                                : driver.activeLoads && driver.activeLoads >= 3 
                                  ? "bg-red-500/20 text-red-600" 
                                  : "bg-yellow-500/20 text-yellow-600"
                            }`}>
                              {driver.activeLoads || 0} active
                            </span>
                          </div>
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

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock size={16} />
                  ETA (Estimated Arrival)
                </Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start text-left font-normal"
                      >
                        {eta ? format(eta, "PPP") : <span className="text-muted-foreground">Select date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={eta}
                        onSelect={setEta}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={etaTime}
                    onChange={(e) => setEtaTime(e.target.value)}
                    className="w-[120px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setApprovalModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="accent" onClick={handleApprove} disabled={approving}>
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditing ? "Save Changes" : "Assign Load"}
                </Button>
              </DialogFooter>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* View Details Modal */}
      <Dialog open={!!viewingLoad} onOpenChange={(open) => !open && setViewingLoad(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck size={20} />
              Load Details
            </DialogTitle>
          </DialogHeader>

          {viewingLoad && (() => {
            const viewClient = getClientForLoad(viewingLoad);
            return (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={viewingLoad.status} />
                <span className="text-sm text-muted-foreground">
                  {viewingLoad.trailer_type} • {viewingLoad.weight_lbs.toLocaleString()} lbs
                </span>
              </div>

              {/* Client Info */}
              {viewClient && (
                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-accent" />
                    <span className="font-medium">Client</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{viewClient.first_name} {viewClient.last_name}</div>
                    <div className="text-muted-foreground">{viewClient.email}</div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                      <Phone size={12} />
                      {viewClient.phone_number}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-green-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-muted-foreground text-xs">Pickup</div>
                    <div className="font-medium">{viewingLoad.origin_address}</div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {new Date(viewingLoad.pickup_date).toLocaleDateString()}
                      {viewingLoad.pickup_time && ` at ${viewingLoad.pickup_time.slice(0, 5)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-accent mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="text-muted-foreground text-xs">Delivery</div>
                    <div className="font-medium">{viewingLoad.destination_address}</div>
                    {viewingLoad.delivery_date && (
                      <div className="text-muted-foreground text-xs mt-1">
                        {new Date(viewingLoad.delivery_date).toLocaleDateString()}
                        {viewingLoad.delivery_time && ` at ${viewingLoad.delivery_time.slice(0, 5)}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {viewingLoad.driver_name && (
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck size={16} className="text-accent" />
                    <span className="font-medium">Driver & Truck</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {viewingLoad.driver_name} • {viewingLoad.truck_number}
                  </div>
                  {viewingLoad.price_cents && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Price: ${(viewingLoad.price_cents / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {viewingLoad.eta && (
                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    <span className="text-sm text-muted-foreground">Estimated Arrival:</span>
                    <span className="font-medium">{format(new Date(viewingLoad.eta), "PPP 'at' p")}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                {viewingLoad.assigned_at && (
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-muted-foreground">Assigned</div>
                    <div className="font-medium">{new Date(viewingLoad.assigned_at).toLocaleString()}</div>
                  </div>
                )}
                {viewingLoad.in_transit_at && (
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-muted-foreground">In Transit</div>
                    <div className="font-medium">{new Date(viewingLoad.in_transit_at).toLocaleString()}</div>
                  </div>
                )}
                {viewingLoad.delivered_at && (
                  <div className="p-2 bg-muted/50 rounded">
                    <div className="text-muted-foreground">Delivered</div>
                    <div className="font-medium">{new Date(viewingLoad.delivered_at).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {viewingLoad.status === "Delivered" && viewingLoad.client_signature_url && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle size={16} className="text-green-500" />
                    Client Signature
                  </div>
                  <div className="border rounded-lg p-3 bg-white">
                    <img
                      src={viewingLoad.client_signature_url}
                      alt="Client signature"
                      className="max-h-24 w-auto mx-auto"
                    />
                  </div>
                </div>
              )}

              {viewingLoad.status === "Delivered" && !viewingLoad.client_signature_url && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-600">
                  No signature captured for this delivery.
                </div>
              )}
            </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingLoad(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
