import { cn } from "@/lib/format";
import type { OrderStatus, ReservationStatus } from "@/lib/types";

type Tone = "neutral" | "strawberry" | "success" | "warning" | "danger" | "ink";

const tones: Record<Tone, string> = {
  neutral: "bg-vanilla-100 text-ink-700 border-border-warm",
  strawberry: "bg-strawberry-50 text-strawberry-700 border-strawberry-100",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-vanilla-200/40 text-ink-700 border-vanilla-200",
  danger: "bg-strawberry-50 text-danger border-danger/20",
  ink: "bg-ink-900 text-vanilla-0 border-ink-900",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const orderTones: Record<OrderStatus, Tone> = {
  pending: "warning",
  confirmed: "strawberry",
  preparing: "strawberry",
  ready: "success",
  completed: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status, label }: { status: OrderStatus; label?: string }) {
  return <Badge tone={orderTones[status]}>{label ?? status.replace("_", " ")}</Badge>;
}

const reservationTones: Record<ReservationStatus, Tone> = {
  pending: "warning",
  confirmed: "strawberry",
  seated: "ink",
  completed: "success",
  cancelled: "danger",
};

export function ReservationStatusBadge({
  status,
  label,
}: {
  status: ReservationStatus;
  label?: string;
}) {
  return <Badge tone={reservationTones[status]}>{label ?? status}</Badge>;
}
