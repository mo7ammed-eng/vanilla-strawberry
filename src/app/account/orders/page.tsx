"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, UtensilsCrossed } from "lucide-react";
import { OrderStatusBadge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get<Order[]>(`/account/orders?page=${page}`)
      .then((response) => {
        if (!active) return;
        setOrders(response.data);
        setLastPage(response.meta?.last_page ?? 1);
        setTotal(response.meta?.total ?? response.data.length);
      })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Order history</p>
          <h1 className="mt-2 text-h2">Your orders</h1>
          <p className="mt-1 text-sm text-ink-600">
            {total === 0 ? "Nothing here yet." : `${total} order${total === 1 ? "" : "s"} placed.`}
          </p>
        </div>
        <Link href="/menu" className={buttonClasses("secondary", "sm")}>
          Start a new order
        </Link>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="When you order, this is where you will find every scoop and every receipt."
          action={
            <Link href="/menu" className={buttonClasses("primary", "md")}>
              Browse the menu
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.order_number}`}
                className="block rounded-2xl border border-border-warm bg-vanilla-0 p-5 transition hover:border-ink-900/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl">{order.order_number}</p>
                    <p className="mt-1 text-xs text-ink-600">{formatDateTime(order.placed_at ?? order.created_at)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} label={order.status_label} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-warm pt-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-600">
                    <UtensilsCrossed className="h-4 w-4" />
                    {order.items.reduce((count, item) => count + item.quantity, 0)} items · {order.fulfillment_label}
                  </span>
                  <span className="font-semibold tabular-nums">{formatMoney(order.totals.total_cents)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {lastPage > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-border-warm pt-4">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1 || loading}
            className={buttonClasses("secondary", "sm")}
          >
            Previous
          </button>
          <span className="text-xs text-ink-600">
            Page {page} of {lastPage}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(lastPage, value + 1))}
            disabled={page === lastPage || loading}
            className={buttonClasses("secondary", "sm")}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
