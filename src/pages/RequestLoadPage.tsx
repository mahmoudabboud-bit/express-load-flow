import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification } from "@/lib/notifications";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Truck, Weight, Calendar, Loader2, ArrowLeft, Clock } from "lucide-react";
import { Navigate, Link } from "react-router-dom";

const trailerTypes = ["Flat Bed", "Step Deck", "Minifloat", "1Ton"] as const;

export default function RequestLoadPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin_address: "",
    destination_address: "",
    trailer_type: "" as typeof trailerTypes[number] | "",
    weight_lbs: "",
    pickup_date: "",
    pickup_time: "",
    delivery_date: "",
    delivery_time: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.origin_address || !formData.destination_address || !formData.trailer_type || !formData.weight_lbs || !formData.pickup_date) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setLoading(true);

    const { data: insertedLoad, error } = await supabase.from("loads").insert({
      client_id: user.id,
      origin_address: formData.origin_address,
      destination_address: formData.destination_address,
      trailer_type: formData.trailer_type,
      weight_lbs: parseInt(formData.weight_lbs),
      pickup_date: formData.pickup_date,
      pickup_time: formData.pickup_time || null,
      delivery_date: formData.delivery_date || null,
      delivery_time: formData.delivery_time || null,
      status: "Pending",
    }).select().single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to submit",
        description: error.message,
      });
    } else {
      // Send email and in-app notifications
      await sendNotification(
        "load_submitted",
        user.email || "",
        {
          id: insertedLoad.id,
          origin_address: formData.origin_address,
          destination_address: formData.destination_address,
          pickup_date: formData.pickup_date,
          trailer_type: formData.trailer_type,
          weight_lbs: parseInt(formData.weight_lbs),
        },
        true, // notify dispatcher
        user.id // recipient user ID for in-app notification
      );

      toast({
        title: "Load Requested!",
        description: "Your load has been submitted and is under review.",
      });
      navigate("/dashboard/shipments");
    }

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-2xl">Request a Load</CardTitle>
            <CardDescription>
              Fill in the details below to request a new shipment. Our dispatchers will review and assign a driver.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Origin */}
              <div className="space-y-2">
                <Label htmlFor="origin" className="flex items-center gap-2">
                  <MapPin size={16} className="text-status-pending" />
                  Pickup Location
                </Label>
                <Input
                  id="origin"
                  placeholder="123 Main St, City, State ZIP"
                  value={formData.origin_address}
                  onChange={(e) => setFormData({ ...formData, origin_address: e.target.value })}
                />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin size={16} className="text-status-delivered" />
                  Delivery Location
                </Label>
                <Input
                  id="destination"
                  placeholder="456 Oak Ave, City, State ZIP"
                  value={formData.destination_address}
                  onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                />
              </div>

              {/* Trailer Type */}
              <div className="space-y-2">
                <Label htmlFor="trailer" className="flex items-center gap-2">
                  <Truck size={16} className="text-accent" />
                  Trailer Type
                </Label>
                <Select
                  value={formData.trailer_type}
                  onValueChange={(v) => setFormData({ ...formData, trailer_type: v as typeof trailerTypes[number] })}
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

              {/* Weight */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="flex items-center gap-2">
                  <Weight size={16} className="text-muted-foreground" />
                  Weight (lbs)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="45000"
                  min="1"
                  max="100000"
                  value={formData.weight_lbs}
                  onChange={(e) => setFormData({ ...formData, weight_lbs: e.target.value })}
                />
              </div>

              {/* Pickup Date & Time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar size={16} className="text-muted-foreground" />
                  Pickup Date & Time
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="pickup_date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.pickup_date}
                    onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    id="pickup_time"
                    type="time"
                    value={formData.pickup_time}
                    onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                    className="w-[140px]"
                  />
                </div>
              </div>

              {/* Delivery Date & Time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock size={16} className="text-accent" />
                  Delivery Date & Time
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="delivery_date"
                    type="date"
                    min={formData.pickup_date || new Date().toISOString().split("T")[0]}
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    id="delivery_time"
                    type="time"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-[140px]"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Submit Load Request"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
