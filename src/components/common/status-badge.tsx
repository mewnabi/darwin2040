import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label: string;
  colorMap?: Record<string, string>;
}

const defaultColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-blue-100 text-blue-800",
  REGISTRATION_OPEN: "bg-green-100 text-green-800",
  REGISTRATION_CLOSED: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-navy-100 text-navy-700",
  CANCELLED: "bg-red-100 text-red-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  PAID: "bg-green-100 text-green-800",
  WAITLISTED: "bg-blue-100 text-blue-800",
  PROMOTED: "bg-purple-100 text-purple-800",
  REFUNDED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
  FAILED: "bg-red-100 text-red-800",
};

export function StatusBadge({ status, label, colorMap }: StatusBadgeProps) {
  const colors = colorMap || defaultColors;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colors[status] || "bg-gray-100 text-gray-800",
      )}
    >
      {label}
    </span>
  );
}
