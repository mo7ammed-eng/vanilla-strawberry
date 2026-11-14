"use client";

import Link from "next/link";
import { Clock3, CreditCard, MapPin, Store, Truck } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useSettings } from "@/providers/settings-provider";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/format";

const steps: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Received" },
  { status: "confirmed", label: "Confirmed" },
  { status: "preparing", label: "In the kitchen" },
  { status: "ready", label: "Ready" },
  { status: "completed", label: "Completed" },
];

export function OrderDetail({ order }: { order: Order }) {
  const { settings } = useSettings();
  const currentIndex = steps.findIndex((step) => step.status === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border-warm bg-vanilla-0 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Order {order.order_number}</p>
            <h1 className="mt-2 text-2xl">{order.status_label}</h1>
            <p className="mt-1 text-sm text-ink-600">
              Placed {formatDateTime(order.placed_at ?? order.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OrderStatusBadge status={order.status} label={order.status_label} />
            <span className="text-[11px] uppercase tracking-[0.12em] text-ink-600">{order.source_label}</span>
          </div>
        </div>

        {cancelled ? (
          <div className="mt-5 rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">
            This order was cancelled{order.cancellation_reason ? `: ${order.cancellation_reason}` : "."}
          </div>
        ) : (
          <ol className="mt-7 grid grid-cols-5 gap-1" aria-label="Order progress">
            {steps.map((step, index) => {
              const done = currentIndex >= index;
              return (
                <li key={step.status} className="relative flex flex-col items-center text-center">
                  {index > 0 ? (
                    <span
                      className={cn(
                        "absolute right-1/2 top-2 h-px w-full",
                        done ? "bg-strawberry-500" : "bg-border-warm",
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2",
                      done ? "border-strawberry-500 bg-strawberry-500" : "border-border-warm bg-vanilla-0",
                    )}
                  >
                    {done ? <span className="h-1 w-1 rounded-full bg-vanilla-0" /> : null}
                  </span>
                  <span
                    className={cn(
                      "mt-2 text-[10px] leading-tight sm:text-[11px]",
                      done ? "font-semibold text-ink-900" : "text-ink-600",
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-6">
            <h2 className="text-lg font-semibold">In this order</h2>
            <ul className="mt-4 divide-y divide-border-warm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {item.quantity} × {item.product_name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-600">
                      {[item.variant_name, ...item.add_ons.map((addOn) => addOn.name)].filter(Boolean).join(" · ") ||
                        "Classic serve"}
                    </p>
                    {item.notes ? <p className="mt-1 text-xs italic text-ink-600">“{item.notes}”</p> : null}
                  </div>
                  <p className="shrink-0 text-sm tabular-nums">{formatMoney(item.line_total_cents)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-6">
            <h2 className="text-lg font-semibold">Order notes</h2>
            <p className="mt-2 text-sm text-ink-600">{order.notes || "No notes were left for this order."}</p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-6">
            <h2 className="text-lg font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(order.totals.subtotal_cents)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Tax</dt>
                <dd className="tabular-nums">{formatMoney(order.totals.tax_cents)}</dd>
              </div>
              {order.totals.service_fee_cents > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-600">Service fee</dt>
                  <dd className="tabular-nums">{formatMoney(order.totals.service_fee_cents)}</dd>
                </div>
              ) : null}
              {order.totals.delivery_fee_cents > 0 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-600">Delivery</dt>
                  <dd className="tabular-nums">{formatMoney(order.totals.delivery_fee_cents)}</dd>
                </div>
              ) : null}
              {order.totals.discount_cents > 0 ? (
                <div className="flex justify-between gap-3 text-success">
                  <dt>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</dt>
                  <dd className="tabular-nums">−{formatMoney(order.totals.discount_cents)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 border-t border-border-warm pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-xl tabular-nums">{formatMoney(order.totals.total_cents)}</dd>
              </div>
            </dl>
            <p className="mt-3 flex items-center gap-2 text-xs text-ink-600">
              <CreditCard className="h-3.5 w-3.5 text-strawberry-600" />
              {order.payment_method === "pay_on_delivery" ? "Pay on delivery" : "Pay on collection"} ·{" "}
              {order.payment_status === "unpaid" ? "Unpaid" : order.payment_status}
            </p>
          </section>

          <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-6">
            <h2 className="text-lg font-semibold">
              {order.fulfillment_type === "delivery" ? "Delivery" : order.fulfillment_type === "dine_in" ? "At the table" : "Pickup"}
            </h2>
            <div className="mt-3 flex items-start gap-2.5 text-sm text-ink-600">
              {order.fulfillment_type === "delivery" ? (
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-strawberry-600" />
              ) : order.fulfillment_type === "dine_in" ? (
                <Store className="mt-0.5 h-4 w-4 shrink-0 text-strawberry-600" />
              ) : (
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-strawberry-600" />
              )}
              <div>
                {order.table ? (
                  <p>
                    {order.table.name}
                    {order.table.zone ? ` · ${order.table.zone}` : ""}
                  </p>
                ) : order.delivery_address ? (
                  <p>
                    {order.delivery_address.line1}
                    {order.delivery_address.line2 ? `, ${order.delivery_address.line2}` : ""}
                    <br />
                    {order.delivery_address.city} {order.delivery_address.postal_code}
                  </p>
                ) : (
                  <p>Collect at {settings.address}.</p>
                )}
                <p className="mt-2 text-xs">
                  {order.customer.name}
                  {order.customer.phone ? ` · ${order.customer.phone}` : ""}
                  {order.customer.email ? ` · ${order.customer.email}` : ""}
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Link href="/menu" className={buttonClasses("secondary", "sm")}>
              Order again
            </Link>
            <Link href="/account/orders" className={buttonClasses("ghost", "sm")}>
              All orders
            </Link>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-ink-600">
            <Clock3 className="h-3 w-3" /> This page refreshes while the order is active.
          </p>
        </div>
      </div>
    </div>
  );
}
