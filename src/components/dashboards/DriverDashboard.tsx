import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { SignatureCapture } from "@/components/SignatureCapture";
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Package,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Load {
  id: string;
  origin_address: string;
  destination_address: string;
  status: "Pending" | "Assigned" | "Arrived" | "Loaded" | "In-Transit" | "Delivered";
  trailer_type: string;
  weight_lbs: number;
  pickup_date: string;
  pickup_time: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  eta: string | null;
  driver_name: string | null;
  truck_number: string | null;
  price_cents: number | null;
  client_id: string;
}

export function DriverDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentLoad, setCurrentLoad] = useState<Load | null>(null);
  const [completedLoads, setCompletedLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLoads();
    }
  }, [user]);

  const fetchLoads = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Fetch loads assigned to this driver by driver_id
    const { data, error } = await supabase
      .from("loads")
      .select("*")
      .eq("driver_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching loads:", error);
    } else {
      const loads = (data as Load[]) || [];
      const active = loads.find(l => 
        l.status === "Assigned" || l.status === "Arrived" || l.status === "Loaded" || l.status === "In-Transit"
      );
      setCurrentLoad(active || null);
      setCompletedLoads(loads.filter(l => l.status === "Delivered"));
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (newStatus: "Arrived" | "Loaded" | "In-Transit" | "Delivered", signatureDataUrl?: string) => {
    if (!currentLoad) return;
    
    setUpdating(true);

    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === "Arrived") {
      updateData.arrived_at = new Date().toISOString();
    } else if (newStatus === "Loaded") {
      updateData.loaded_at = new Date().toISOString();
    } else if (newStatus === "In-Transit") {
      updateData.in_transit_at = new Date().toISOString();
    } else if (newStatus === "Delivered") {
      updateData.delivered_at = new Date().toISOString();
      
      // Upload signature to storage if provided
      if (signatureDataUrl) {
        try {
          // Convert base64 to blob
          const base64Data = signatureDataUrl.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });
          
          const fileName = `${currentLoad.id}_${Date.now()}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('signatures')
            .upload(fileName, blob, { contentType: 'image/png' });
          
          if (uploadError) {
            console.error("Signature upload error:", uploadError);
            throw uploadError;
          }
          
          // Store the file path (not public URL) for signed URL generation
          updateData.client_signature_url = fileName;
          updateData.signature_timestamp = new Date().toISOString();
        } catch (uploadErr) {
          console.error("Failed to upload signature:", uploadErr);
          toast({
            variant: "destructive",
            title: "Signature upload failed",
            description: "Could not save signature. Please try again.",
          });
          setUpdating(false);
          return;
        }
      }
    }

    const { error } = await supabase
      .from("loads")
      .update(updateData)
      .eq("id", currentLoad.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not update load status. Please try again.",
      });
    } else {
      // Get client email for notification
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", currentLoad.client_id)
        .single();

      if (clientProfile?.email) {
        const notificationType = newStatus === "In-Transit" ? "status_in_transit" : "status_delivered";
        await sendNotification(
          notificationType,
          clientProfile.email,
          {
            id: currentLoad.id,
            origin_address: currentLoad.origin_address,
            destination_address: currentLoad.destination_address,
            pickup_date: currentLoad.pickup_date,
            driver_name: currentLoad.driver_name || undefined,
          },
          false,
          currentLoad.client_id // for in-app notification
        );
      }

      toast({
        title: "Status Updated!",
        description: `Load marked as ${newStatus}.`,
      });
      fetchLoads();
    }
    setUpdating(false);
  };

  const handleDeliveryClick = () => {
    setShowSignature(true);
  };

  const handleSignatureSubmit = async (signatureDataUrl: string) => {
    await handleStatusUpdate("Delivered", signatureDataUrl);
    setShowSignature(false);
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Truck className="mx-auto text-accent animate-pulse-subtle mb-4" size={48} />
          <p className="text-muted-foreground">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">My Current Load</h1>
        <p className="text-muted-foreground">Manage your assigned deliveries</p>
      </div>

      {/* Current Load */}
      {currentLoad ? (
        <Card className="card-elevated border-2 border-accent/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={currentLoad.status} />
              <span className="text-sm text-muted-foreground">
                {currentLoad.trailer_type} • {currentLoad.weight_lbs?.toLocaleString()} lbs
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pickup Location */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-status-pending/20 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="text-status-pending" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Pickup</p>
                  <p className="font-semibold text-foreground">{currentLoad.origin_address}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => openInMaps(currentLoad.origin_address)}
              >
                <Navigation className="mr-2" size={18} />
                Navigate to Pickup
              </Button>
            </div>

            {/* Delivery Location */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-status-delivered/20 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="text-status-delivered" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Delivery</p>
                  <p className="font-semibold text-foreground">{currentLoad.destination_address}</p>
                  {currentLoad.delivery_date && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(currentLoad.delivery_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {currentLoad.delivery_time && ` at ${currentLoad.delivery_time.slice(0, 5)}`}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => openInMaps(currentLoad.destination_address)}
              >
                <Navigation className="mr-2" size={18} />
                Navigate to Delivery
              </Button>
            </div>

            {/* Pickup Date/Time */}
            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
              <Clock className="text-muted-foreground" size={20} />
              <div>
                <p className="text-xs text-muted-foreground">Scheduled Pickup</p>
                <p className="font-semibold">
                  {new Date(currentLoad.pickup_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {currentLoad.pickup_time && ` at ${currentLoad.pickup_time.slice(0, 5)}`}
                </p>
              </div>
            </div>

            {/* ETA */}
            {currentLoad.eta && (
              <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-xl border border-accent/30">
                <Clock className="text-accent" size={20} />
                <div>
                  <p className="text-xs text-muted-foreground">Expected Arrival (ETA)</p>
                  <p className="font-semibold text-accent">
                    {new Date(currentLoad.eta).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Status Actions */}
            <div className="space-y-3 pt-4">
            {currentLoad.status === "Assigned" && (
              <Button
                variant="driver-action"
                size="xl"
                className="w-full py-6 text-lg"
                onClick={() => handleStatusUpdate("Arrived")}
                disabled={updating}
              >
                <MapPin className="mr-3" size={24} />
                Arrived
              </Button>
            )}

            {currentLoad.status === "Arrived" && (
              <Button
                variant="driver-action"
                size="xl"
                className="w-full py-6 text-lg"
                onClick={() => handleStatusUpdate("Loaded")}
                disabled={updating}
              >
                <Package className="mr-3" size={24} />
                Loaded
              </Button>
            )}

            {currentLoad.status === "Loaded" && (
              <Button
                variant="driver-action"
                size="xl"
                className="w-full py-6 text-lg"
                onClick={() => handleStatusUpdate("In-Transit")}
                disabled={updating}
              >
                <Truck className="mr-3" size={24} />
                In Transit
              </Button>
            )}

              {currentLoad.status === "In-Transit" && (
                <Button
                  variant="driver-action"
                  size="xl"
                  className="w-full py-6 text-lg bg-status-delivered hover:bg-status-delivered/90"
                  onClick={handleDeliveryClick}
                  disabled={updating}
                >
                  <CheckCircle className="mr-3" size={24} />
                  Mark as Delivered
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-elevated">
          <CardContent className="py-16 text-center">
            <Package className="mx-auto text-muted-foreground/50 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Active Load</h3>
            <p className="text-muted-foreground">
              You don't have any loads assigned at the moment.
              <br />
              Check back later or contact dispatch.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completed Loads */}
      {completedLoads.length > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="text-status-delivered" size={20} />
              Completed ({completedLoads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedLoads.slice(0, 5).map((load) => (
                <div
                  key={load.id}
                  className="p-4 bg-secondary/30 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={load.status} />
                    <span className="text-xs text-muted-foreground">
                      {load.trailer_type}
                    </span>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">{load.origin_address}</span>
                    <span className="text-muted-foreground mx-2">→</span>
                    <span className="font-medium">{load.destination_address}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Signature Capture Modal */}
      <SignatureCapture
        open={showSignature}
        onClose={() => setShowSignature(false)}
        onSign={handleSignatureSubmit}
        loadInfo={currentLoad ? {
          origin: currentLoad.origin_address,
          destination: currentLoad.destination_address,
          driverName: currentLoad.driver_name || undefined,
        } : undefined}
      />
    </div>
  );
}
