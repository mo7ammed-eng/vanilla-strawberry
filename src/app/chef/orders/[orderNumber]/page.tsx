"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BellRing, Clock3, MapPin, RefreshCw, Store, Truck, UtensilsCrossed } from "lucide-react";
import { Badge, OrderStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, formatMoney, relativeTime } from "@/lib/format";
import { useToast } from "@/providers/toast-provider";
import type { Order, OrderStatus } from "@/lib/types";

const actionLabels: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm order",
  preparing: "Start preparing",
  ready: "Mark ready",
  completed: "Complete order",
};

export default function ChefOrderPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = typeof params.orderNumber === "string" ? params.orderNumber : "";
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!orderNumber) return;
      if (silent) setRefreshing(true);
      try {
        const response = await api.get<Order>(`/chef/orders/${encodeURIComponent(orderNumber)}`);
        setOrder(response.data);
        setError(null);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderNumber],
  );

  useEffect(() => {
    load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  const advance = async (status: OrderStatus) => {
    if (!order) return;
    setBusy(true);
    try {
      const response = await api.patch<Order>(`/chef/orders/${order.id}/status`, { status });
      setOrder(response.data);
      toast(`Order moved to ${status.replace("_", " ")}.`, "success");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader label="Loading kitchen order" />;

  if (error || !order) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-h2">Order not found</h1>
        <p className="mt-2 text-sm text-ink-600">{error ?? "This order is no longer available."}</p>
        <Link href="/chef" className="mt-6 inline-flex text-sm font-semibold text-strawberry-700 hover:underline">
          Back to the board
        </Link>
      </div>
    );
  }

  const nextStatus = order.available_statuses[0];

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/chef" className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-900">
        <ArrowLeft className="h-3.5 w-3.5" />
        Kitchen board
      </Link>

      <div className="rounded-2xl border border-border-warm bg-vanilla-0 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Order ticket</p>
            <h1 className="mt-2 font-display text-3xl">{order.order_number}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
              <Clock3 className="h-4 w-4" /> Placed {formatDateTime(order.placed_at ?? order.created_at)} ·{" "}
              {relativeTime(order.placed_at ?? order.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <OrderStatusBadge status={order.status} label={order.status_label} />
            <Badge tone={order.source === "qr" ? "strawberry" : "neutral"}>{order.source_label}</Badge>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-border-warm pt-5 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-600">Where it goes</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
              {order.table ? <Store className="h-4 w-4 text-strawberry-600" /> : order.fulfillment_type === "delivery" ? <Truck className="h-4 w-4 text-strawberry-600" /> : <MapPin className="h-4 w-4 text-strawberry-600" />}
              {order.table ? order.table.name : order.fulfillment_label}
            </p>
            {order.table?.zone ? <p className="mt-1 text-sm text-ink-600">{order.table.zone}</p> : null}
            {order.delivery_address ? (
              <p className="mt-1 text-sm text-ink-600">
                {order.delivery_address.line1}
                {order.delivery_address.line2 ? `, ${order.delivery_address.line2}` : ""}
                <br />
                {order.delivery_address.city} {order.delivery_address.postal_code}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-600">Guest</p>
            <p className="mt-2 text-sm font-semibold">{order.customer.name}</p>
            <p className="text-sm text-ink-600">
              {order.customer.phone ?? "No phone"} · {order.customer.email ?? "No email"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border-warm bg-vanilla-0 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Items to make</h2>
          <span className="text-xs text-ink-600">
            {order.items.reduce((count, item) => count + item.quantity, 0)} total
          </span>
        </div>
        <ul className="mt-4 divide-y divide-border-warm">
          {order.items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex justify-between gap-3">
                <p className="text-base font-semibold">
                  {item.quantity} × {item.product_name}
                </p>
                <p className="shrink-0 text-sm tabular-nums text-ink-600">{formatMoney(item.line_total_cents)}</p>
              </div>
              {item.variant_name || item.add_ons.length > 0 ? (
                <p className="mt-0.5 text-sm text-ink-600">
                  {[item.variant_name, ...item.add_ons.map((addOn) => addOn.name)].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              {item.notes ? <p className="mt-1 text-sm italic text-strawberry-700">{item.notes}</p> : null}
            </li>
          ))}
        </ul>

        {order.notes ? (
          <div className="mt-4 flex gap-2 rounded-xl bg-strawberry-50 px-4 py-3 text-sm text-strawberry-800">
            <BellRing className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em]">Order note</p>
              <p className="mt-1 leading-relaxed">{order.notes}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-warm bg-vanilla-0 p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-600">Order total</p>
          <p className="mt-1 font-display text-2xl">{formatMoney(order.totals.total_cents)}</p>
          <p className="text-xs text-ink-600">
            {order.payment_method === "pay_on_delivery" ? "Pay on delivery" : "Pay on collection"} ·{" "}
            {order.payment_status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => load(true)} loading={refreshing}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {nextStatus ? (
            <Button loading={busy} onClick={() => advance(nextStatus)}>
              <UtensilsCrossed className="h-4 w-4" />
              {actionLabels[nextStatus] ?? nextStatus}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
