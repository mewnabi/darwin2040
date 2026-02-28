import { StatusBadge } from "@/components/common/status-badge";
import { PAYMENT_STATUS_LABELS } from "@/constants/member-tiers";

interface PaymentStatusProps {
  status: string;
}

export function PaymentStatusBadge({ status }: PaymentStatusProps) {
  return (
    <StatusBadge
      status={status}
      label={PAYMENT_STATUS_LABELS[status] || status}
    />
  );
}
