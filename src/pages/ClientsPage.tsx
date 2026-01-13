import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Pencil, Trash2, Users, Mail, Phone, MapPin, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Client {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  active: boolean;
  created_at: string;
}

export default function ClientsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Invite state
  const [sendingInvite, setSendingInvite] = useState<string | null>(null);

  useEffect(() => {
    if (user && userRole === "dispatcher") {
      fetchClients();
    }
  }, [user, userRole]);

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
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingClient(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setAddress("");
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFirstName(client.first_name);
    setLastName(client.last_name);
    setEmail(client.email);
    setPhoneNumber(client.phone_number);
    setAddress(client.address);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phoneNumber.trim() || !address.trim()) {
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

    if (editingClient) {
      // Update existing client
      const { error } = await supabase
        .from("clients")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phoneNumber.trim(),
          address: address.trim(),
        })
        .eq("id", editingClient.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to update client",
          description: error.message,
        });
      } else {
        toast({
          title: "Client Updated",
          description: `${firstName} ${lastName} has been updated.`,
        });
        setModalOpen(false);
        fetchClients();
      }
    } else {
      // Create new client with a placeholder user_id
      // The client will link when they sign up with this email
      const tempUserId = crypto.randomUUID();
      
      const { error } = await supabase
        .from("clients")
        .insert({
          user_id: tempUserId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phoneNumber.trim(),
          address: address.trim(),
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to add client",
          description: error.message,
        });
      } else {
        toast({
          title: "Client Added",
          description: `${firstName} ${lastName} has been added.`,
        });
        setModalOpen(false);
        fetchClients();
      }
    }

    setSaving(false);
  };

  const confirmDelete = (client: Client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;

    setDeleting(true);

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientToDelete.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete client",
        description: error.message,
      });
    } else {
      toast({
        title: "Client Deleted",
        description: `${clientToDelete.first_name} ${clientToDelete.last_name} has been removed.`,
      });
      setDeleteModalOpen(false);
      setClientToDelete(null);
      fetchClients();
    }

    setDeleting(false);
  };

  const handleSendInvite = async (client: Client) => {
    setSendingInvite(client.id);

    try {
      const signupUrl = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.functions.invoke("send-client-invite", {
        body: {
          clientEmail: client.email,
          clientFirstName: client.first_name,
          clientLastName: client.last_name,
          signupUrl,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Invite Sent!",
        description: `An invitation email has been sent to ${client.email}.`,
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
            <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
            <p className="text-muted-foreground">Add and manage your client database.</p>
          </div>
          <Button variant="accent" onClick={openAddModal}>
            <Plus className="mr-2" size={18} />
            Add Client
          </Button>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Clients ({clients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-muted-foreground/50 mb-4" size={48} />
                <p className="text-muted-foreground mb-4">No clients added yet</p>
                <Button variant="outline" onClick={openAddModal}>
                  <Plus className="mr-2" size={16} />
                  Add Your First Client
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className="p-5 bg-secondary/30 rounded-xl border border-border/50 hover:border-accent/30 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {client.first_name} {client.last_name}
                          </h3>
                          <Badge variant={client.active ? "default" : "secondary"}>
                            {client.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail size={14} />
                            {client.email}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone size={14} />
                            {client.phone_number}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin size={14} />
                            <span className="truncate">{client.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleSendInvite(client)}
                          disabled={sendingInvite === client.id}
                        >
                          {sendingInvite === client.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <>
                              <Send size={16} className="mr-1" />
                              Invite
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditModal(client)}>
                          <Pencil size={16} className="mr-1" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => confirmDelete(client)}>
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

      {/* Add/Edit Client Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Update the client's information."
                : "Enter the client details. They will log in using this email."}
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
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The client will use this email to log in.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, Houston, TX 77001"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingClient ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {clientToDelete?.first_name} {clientToDelete?.last_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}