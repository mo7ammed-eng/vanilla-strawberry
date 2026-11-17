"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  Check,
  ChefHat,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Badge, OrderStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { CardSkeleton } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { cn, formatMoney, relativeTime } from "@/lib/format";
import { useToast } from "@/providers/toast-provider";
import type { Order, OrderStatus, PaginationMeta } from "@/lib/types";

const columns: { status: OrderStatus; title: string }[] = [
  { status: "pending", title: "New" },
  { status: "confirmed", title: "Confirmed" },
  { status: "preparing", title: "Preparing" },
  { status: "ready", title: "Ready" },
];

const actionLabels: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm order",
  preparing: "Start preparing",
  ready: "Mark ready",
  completed: "Complete order",
};

type BoardMeta = PaginationMeta & { counts?: Record<string, number> };

function FulfillmentIcon({ order }: { order: Order }) {
  if (order.table) return <Store className="h-3.5 w-3.5" />;
  if (order.fulfillment_type === "delivery") return <Truck className="h-3.5 w-3.5" />;
  return <MapPin className="h-3.5 w-3.5" />;
}

export default function ChefBoardPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<BoardMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await api.get<Order[]>("/chef/orders?scope=active&per_page=50");
      setOrders(response.data);
      setMeta((response.meta as BoardMeta | undefined) ?? null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  const advance = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id);
    try {
      await api.patch<Order>(`/chef/orders/${order.order_number}/status`, { status });
      toast(`${order.order_number} moved to ${status.replace("_", " ")}.`, "success");
      await load(true);
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(term) ||
        order.customer.name.toLowerCase().includes(term) ||
        order.table?.name.toLowerCase().includes(term),
    );
  }, [orders, search]);

  const byStatus = (status: OrderStatus) => filtered.filter((order) => order.status === status);
  const totalActive = orders.length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <ChefHat className="h-3.5 w-3.5" /> Kitchen board
          </p>
          <h1 className="mt-2 text-h2">Active orders</h1>
          <p className="mt-1 text-sm text-ink-600">
            {totalActive === 0 ? "Nothing in the pass." : `${totalActive} order${totalActive === 1 ? "" : "s"} in progress.`}
            {lastUpdated ? <span className="ml-2 text-xs">Updated {relativeTime(lastUpdated.toISOString())}</span> : null}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Order, guest, table"
              className="pl-9"
              aria-label="Search active orders"
            />
          </div>
          <Button variant="secondary" size="md" onClick={() => load(true)} loading={refreshing}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {meta?.counts ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {columns.map((column) => (
            <Badge key={column.status} tone={column.status === "pending" ? "warning" : "neutral"}>
              {meta.counts?.[column.status] ?? 0} {column.title.toLowerCase()}
            </Badge>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={ChefHat}
            title={search ? "No matching orders" : "The kitchen is clear"}
            description={
              search
                ? "Try another order number, guest name, or table."
                : "New QR and online orders will land here automatically. This board refreshes every 15 seconds."
            }
            action={
              <Button variant="secondary" onClick={() => load(true)}>
                Check again
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => {
            const columnOrders = byStatus(column.status);
            return (
              <section key={column.status} aria-labelledby={`column-${column.status}`} className="min-w-0">
                <div className="flex items-center justify-between gap-2 border-b border-border-warm pb-2">
                  <h2 id={`column-${column.status}`} className="text-xs font-bold uppercase tracking-[0.14em] text-ink-700">
                    {column.title}
                  </h2>
                  <span className="text-xs tabular-nums text-ink-600">{columnOrders.length}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {columnOrders.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border-warm px-3 py-6 text-center text-xs text-ink-600">
                      Empty
                    </p>
                  ) : (
                    columnOrders.map((order) => {
                      const nextStatus = order.available_statuses[0];
                      return (
                        <article
                          key={order.id}
                          className={cn(
                            "rounded-xl border bg-vanilla-0 p-4 shadow-soft",
                            order.status === "pending" ? "border-strawberry-200" : "border-border-warm",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                href={`/chef/orders/${order.order_number}`}
                                className="font-display text-lg leading-none hover:underline"
                              >
                                {order.order_number}
                              </Link>
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-600">
                                <Clock3 className="h-3 w-3" />
                                {relativeTime(order.placed_at ?? order.created_at)}
                              </p>
                            </div>
                            <Badge tone={order.source === "qr" ? "strawberry" : "neutral"}>{order.source_label}</Badge>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-600">
                            <span className="flex items-center gap-1">
                              <FulfillmentIcon order={order} />
                              {order.table ? `${order.table.name}${order.table.zone ? ` · ${order.table.zone}` : ""}` : order.fulfillment_label}
                            </span>
                            <span>{order.customer.name}</span>
                          </div>

                          <ul className="mt-3 space-y-1.5 border-t border-border-warm pt-3">
                            {order.items.map((item) => (
                              <li key={item.id} className="text-sm">
                                <span className="flex justify-between gap-2">
                                  <span className="font-medium">
                                    {item.quantity} × {item.product_name}
                                  </span>
                                </span>
                                {item.variant_name || item.add_ons.length > 0 ? (
                                  <p className="text-[11px] text-ink-600">
                                    {[item.variant_name, ...item.add_ons.map((addOn) => addOn.name)].filter(Boolean).join(" · ")}
                                  </p>
                                ) : null}
                                {item.notes ? <p className="text-[11px] italic text-strawberry-700">{item.notes}</p> : null}
                              </li>
                            ))}
                          </ul>

                          {order.notes ? (
                            <p className="mt-3 flex gap-1.5 rounded-lg bg-strawberry-50 px-2.5 py-2 text-[11px] leading-relaxed text-strawberry-800">
                              <BellRing className="mt-0.5 h-3 w-3 shrink-0" />
                              {order.notes}
                            </p>
                          ) : null}

                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border-warm pt-3">
                            <span className="text-xs font-semibold tabular-nums">{formatMoney(order.totals.total_cents)}</span>
                            {nextStatus ? (
                              <Button
                                size="sm"
                                variant={nextStatus === "completed" ? "secondary" : "primary"}
                                loading={busyId === order.id}
                                onClick={() => advance(order, nextStatus)}
                              >
                                {nextStatus === "completed" ? <Check className="h-3.5 w-3.5" /> : <UtensilsCrossed className="h-3.5 w-3.5" />}
                                {actionLabels[nextStatus] ?? nextStatus}
                              </Button>
                            ) : (
                              <OrderStatusBadge status={order.status} label={order.status_label} />
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
