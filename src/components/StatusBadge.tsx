import { cn } from "@/lib/utils";

type LoadStatus = "Pending" | "Assigned" | "In-Transit" | "Delivered";

interface StatusBadgeProps {
  status: LoadStatus;
  className?: string;
}

const statusStyles: Record<LoadStatus, string> = {
  Pending: "status-pending",
  Assigned: "status-approved",
  "In-Transit": "status-in-transit",
  Delivered: "status-delivered",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", statusStyles[status], className)}>
      {status}
    </span>
  );
}
