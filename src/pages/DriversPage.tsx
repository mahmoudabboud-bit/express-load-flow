import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, Users, Truck, Mail, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Driver {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  truck_type: string;
  truck_number: string;
  email: string;
  active: boolean;
  created_at: string;
}

const TRUCK_TYPES = ["Flatbed", "Dry Van", "Reefer", "Tanker", "Lowboy", "Step Deck", "Hotshot"];

export default function DriversPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [truckType, setTruckType] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Invite state
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  useEffect(() => {
    if (user && userRole === "dispatcher") {
      fetchDrivers();
    }
  }, [user, userRole]);

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order("last_name", { ascending: true });

    if (error) {
      console.error("Error fetching drivers:", error);
    } else {
      setDrivers(data || []);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingDriver(null);
    setFirstName("");
    setLastName("");
    setTruckType("");
    setTruckNumber("");
    setEmail("");
    setModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFirstName(driver.first_name);
    setLastName(driver.last_name);
    setTruckType(driver.truck_type);
    setTruckNumber(driver.truck_number);
    setEmail(driver.email);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !truckType || !truckNumber.trim() || !email.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setSaving(true);

    if (editingDriver) {
      // Update existing driver
      const { error } = await supabase
        .from("drivers")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          truck_type: truckType,
          truck_number: truckNumber.trim(),
          email: email.trim().toLowerCase(),
        })
        .eq("id", editingDriver.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to update driver",
          description: error.message,
        });
      } else {
        toast({
          title: "Driver Updated",
          description: `${firstName} ${lastName} has been updated.`,
        });
        setModalOpen(false);
        fetchDrivers();
      }
    } else {
      // Create new driver - first create auth user, then driver record
      // For now, we'll create the driver record with a placeholder user_id
      // The driver will need to sign up with their email to link accounts
      
      // Generate a temporary UUID for user_id (driver will link when they sign up)
      const tempUserId = crypto.randomUUID();
      
      const { error } = await supabase
        .from("drivers")
        .insert({
          user_id: tempUserId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          truck_type: truckType,
          truck_number: truckNumber.trim(),
          email: email.trim().toLowerCase(),
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to add driver",
          description: error.message,
        });
      } else {
        toast({
          title: "Driver Added",
          description: `${firstName} ${lastName} has been added. They can now sign up with ${email}.`,
        });
        setModalOpen(false);
        fetchDrivers();
      }
    }

    setSaving(false);
  };

  const confirmDelete = (driver: Driver) => {
    setDriverToDelete(driver);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!driverToDelete) return;

    setDeleting(true);

    const { error } = await supabase
      .from("drivers")
      .delete()
      .eq("id", driverToDelete.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete driver",
        description: error.message,
      });
    } else {
      toast({
        title: "Driver Deleted",
        description: `${driverToDelete.first_name} ${driverToDelete.last_name} has been removed.`,
      });
      setDeleteModalOpen(false);
      setDriverToDelete(null);
      fetchDrivers();
    }

    setDeleting(false);
  };

  const handleSendInvite = async (driver: Driver) => {
    setSendingInvite(driver.id);

    try {
      const signupUrl = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.functions.invoke("send-driver-invite", {
        body: {
          driverEmail: driver.email,
          driverFirstName: driver.first_name,
          driverLastName: driver.last_name,
          signupUrl,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Invite Sent!",
        description: `An invitation email has been sent to ${driver.email}.`,
      });
    } catch (err: any) {
      console.error("Error sending invite:", err);
      toast({
        variant: "destructive",
        title: "Failed to send invite",
        description: err.message || "Please try again.",
      });
    }

    setSendingInvite(null);
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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Driver Management</h1>
            <p className="text-muted-foreground">Add and manage your driver database.</p>
          </div>
          <Button variant="accent" onClick={openAddModal}>
            <Plus className="mr-2" size={18} />
            Add Driver
          </Button>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Drivers ({drivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-muted-foreground/50 mb-4" size={48} />
                <p className="text-muted-foreground mb-4">No drivers added yet</p>
                <Button variant="outline" onClick={openAddModal}>
                  <Plus className="mr-2" size={16} />
                  Add Your First Driver
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-5 bg-secondary/30 rounded-xl border border-border/50 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {driver.first_name} {driver.last_name}
                          </h3>
                          <Badge variant={driver.active ? "default" : "secondary"}>
                            {driver.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail size={14} />
                            {driver.email}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Truck size={14} />
                            {driver.truck_type}
                          </div>
                          <div className="text-muted-foreground">
                            Truck #: <span className="text-foreground font-medium">{driver.truck_number}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSendInvite(driver)}
                          disabled={sendingInvite === driver.id}
                        >
                          {sendingInvite === driver.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <>
                              <Send size={16} className="mr-1" />
                              Invite
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditModal(driver)}>
                          <Pencil size={16} className="mr-1" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => confirmDelete(driver)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Driver Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDriver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
            <DialogDescription>
              {editingDriver
                ? "Update the driver's information."
                : "Enter the driver details. They will log in using this email."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="driver@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The driver will use this email to log in.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="truckType">Truck Type</Label>
              <Select value={truckType} onValueChange={setTruckType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select truck type" />
                </SelectTrigger>
                <SelectContent>
                  {TRUCK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="truckNumber">Truck Number</Label>
              <Input
                id="truckNumber"
                placeholder="TRK-1234"
                value={truckNumber}
                onChange={(e) => setTruckNumber(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingDriver ? "Save Changes" : "Add Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {driverToDelete?.first_name} {driverToDelete?.last_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
