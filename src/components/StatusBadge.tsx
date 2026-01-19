import { cn } from "@/lib/utils";

type LoadStatus = "Pending" | "Awaiting Payment" | "Assigned" | "Arrived" | "Loaded" | "In-Transit" | "Arrived at Delivery" | "Delivered";

interface StatusBadgeProps {
  status: LoadStatus;
  className?: string;
}

const statusStyles: Record<LoadStatus, string> = {
  Pending: "status-pending",
  "Awaiting Payment": "bg-amber-500/20 text-amber-600 border-amber-500/30",
  Assigned: "status-approved",
  Arrived: "status-approved",
  Loaded: "status-in-transit",
  "In-Transit": "status-in-transit",
  "Arrived at Delivery": "status-in-transit",
  Delivered: "status-delivered",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", statusStyles[status], className)}>
      {status}
    </span>
  );
}
