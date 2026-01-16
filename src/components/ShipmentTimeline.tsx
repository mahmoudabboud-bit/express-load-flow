import { Check, Clock, Truck, Package, MapPin, BoxIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  status: string;
  label: string;
  timestamp: string | null;
  icon: React.ReactNode;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface ShipmentTimelineProps {
  currentStatus: "Pending" | "Assigned" | "Arrived" | "Loaded" | "In-Transit" | "Arrived at Delivery" | "Delivered";
  createdAt: string;
  assignedAt?: string | null;
  arrivedAt?: string | null;
  loadedAt?: string | null;
  inTransitAt?: string | null;
  arrivedAtDeliveryAt?: string | null;
  deliveredAt?: string | null;
}

export function ShipmentTimeline({
  currentStatus,
  createdAt,
  assignedAt,
  arrivedAt,
  loadedAt,
  inTransitAt,
  arrivedAtDeliveryAt,
  deliveredAt,
}: ShipmentTimelineProps) {
  const statusOrder = ["Pending", "Assigned", "Arrived", "Loaded", "In-Transit", "Arrived at Delivery", "Delivered"];
  const currentIndex = statusOrder.indexOf(currentStatus);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const steps: TimelineStep[] = [
    {
      status: "Pending",
      label: "Request Submitted",
      timestamp: createdAt,
      icon: <Package size={16} />,
      isCompleted: currentIndex >= 0,
      isCurrent: currentStatus === "Pending",
    },
    {
      status: "Assigned",
      label: "Driver Assigned",
      timestamp: assignedAt || null,
      icon: <Clock size={16} />,
      isCompleted: currentIndex >= 1,
      isCurrent: currentStatus === "Assigned",
    },
    {
      status: "Arrived",
      label: "Arrived at Pickup",
      timestamp: arrivedAt || null,
      icon: <MapPin size={16} />,
      isCompleted: currentIndex >= 2,
      isCurrent: currentStatus === "Arrived",
    },
    {
      status: "Loaded",
      label: "Loaded",
      timestamp: loadedAt || null,
      icon: <BoxIcon size={16} />,
      isCompleted: currentIndex >= 3,
      isCurrent: currentStatus === "Loaded",
    },
    {
      status: "In-Transit",
      label: "In Transit",
      timestamp: inTransitAt || null,
      icon: <Truck size={16} />,
      isCompleted: currentIndex >= 4,
      isCurrent: currentStatus === "In-Transit",
    },
    {
      status: "Arrived at Delivery",
      label: "Arrived at Drop Off",
      timestamp: arrivedAtDeliveryAt || null,
      icon: <MapPin size={16} />,
      isCompleted: currentIndex >= 5,
      isCurrent: currentStatus === "Arrived at Delivery",
    },
    {
      status: "Delivered",
      label: "Delivered",
      timestamp: deliveredAt || null,
      icon: <Check size={16} />,
      isCompleted: currentIndex >= 6,
      isCurrent: currentStatus === "Delivered",
    },
  ];

  return (
    <div className="py-4">
      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.status} className="flex items-start mb-4 last:mb-0">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute w-0.5 left-[15px]",
                  step.isCompleted && steps[index + 1].isCompleted
                    ? "bg-accent"
                    : "bg-border"
                )}
                style={{ top: `${index * 40 + 32}px`, height: "24px" }}
              />
            )}

            {/* Step icon */}
            <div
              className={cn(
                "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                step.isCompleted
                  ? "bg-accent border-accent text-accent-foreground"
                  : "bg-muted border-border text-muted-foreground",
                step.isCurrent && "ring-2 ring-accent/30 ring-offset-2 ring-offset-background"
              )}
            >
              {step.isCompleted ? <Check size={14} /> : step.icon}
            </div>

            {/* Step content */}
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "font-medium text-sm",
                    step.isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.isCurrent && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
                    Current
                  </span>
                )}
              </div>
              {step.timestamp && step.isCompleted && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(step.timestamp)}
                </p>
              )}
              {!step.isCompleted && (
                <p className="text-xs text-muted-foreground/60 mt-0.5 italic">
                  Pending
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
