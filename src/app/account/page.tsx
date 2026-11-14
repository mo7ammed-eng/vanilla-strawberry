"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, ClipboardList, MapPin, ShoppingBag, Sparkles } from "lucide-react";
import { OrderStatusBadge, ReservationStatusBadge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { formatDateOnly, formatMoney, formatTime, relativeTime } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import type { Address, Order, Reservation } from "@/lib/types";

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<Order[]>("/account/orders?page=1"),
      api.get<Reservation[]>("/account/reservations"),
      api.get<Address[]>("/account/addresses"),
    ])
      .then(([orderResponse, reservationResponse, addressResponse]) => {
        if (!active) return;
        setOrders(orderResponse.data);
        setOrderTotal(orderResponse.meta?.total ?? orderResponse.data.length);
        setReservations(reservationResponse.data);
        setAddresses(addressResponse.data);
      })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <div className="grid gap-4 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p>
    );
  }

  const activeOrder = orders.find((order) => !["completed", "cancelled"].includes(order.status));
  const today = new Date().toLocaleDateString("en-CA");
  const upcoming = reservations
    .filter(
      (reservation) =>
        ["pending", "confirmed", "seated"].includes(reservation.status) &&
        reservation.reservation_date >= today,
    )
    .sort((a, b) => `${a.reservation_date}${a.reservation_time}`.localeCompare(`${b.reservation_date}${b.reservation_time}`))[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Your account</p>
        <h1 className="mt-2 text-h2">Hello, {user?.name.split(" ")[0] ?? "friend"}.</h1>
        <p className="mt-2 text-sm text-ink-600">
          Your orders, tables, and saved details in one quiet place.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/account/orders" className="rounded-2xl border border-border-warm bg-vanilla-0 p-5 transition hover:border-ink-900/20">
          <ClipboardList className="h-4 w-4 text-strawberry-600" />
          <p className="mt-3 font-display text-3xl">{orderTotal}</p>
          <p className="text-xs text-ink-600">Orders placed</p>
        </Link>
        <Link href="/account/reservations" className="rounded-2xl border border-border-warm bg-vanilla-0 p-5 transition hover:border-ink-900/20">
          <CalendarCheck className="h-4 w-4 text-strawberry-600" />
          <p className="mt-3 font-display text-3xl">
            {reservations.filter((item) => ["pending", "confirmed", "seated"].includes(item.status)).length}
          </p>
          <p className="text-xs text-ink-600">Open reservations</p>
        </Link>
        <Link href="/account/addresses" className="rounded-2xl border border-border-warm bg-vanilla-0 p-5 transition hover:border-ink-900/20">
          <MapPin className="h-4 w-4 text-strawberry-600" />
          <p className="mt-3 font-display text-3xl">{addresses.length}</p>
          <p className="text-xs text-ink-600">Saved addresses</p>
        </Link>
      </div>

      {activeOrder ? (
        <section className="overflow-hidden rounded-2xl border border-strawberry-100 bg-strawberry-50/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-strawberry-700">
                Order in progress
              </p>
              <p className="mt-1 font-display text-2xl">{activeOrder.order_number}</p>
            </div>
            <OrderStatusBadge status={activeOrder.status} label={activeOrder.status_label} />
          </div>
          <p className="mt-3 text-sm text-ink-600">
            {activeOrder.items.reduce((total, item) => total + item.quantity, 0)} items ·{" "}
            {formatMoney(activeOrder.totals.total_cents)} · updated {relativeTime(activeOrder.created_at)}
          </p>
          <Link href={`/account/orders/${activeOrder.order_number}`} className={buttonClasses("primary", "sm", "mt-4")}>
            Follow this order
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent orders</h2>
            <Link href="/account/orders" className="text-xs font-semibold text-strawberry-700 hover:underline">
              View all
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="mt-6 text-sm text-ink-600">
              <ShoppingBag className="h-5 w-5 text-ink-600" />
              <p className="mt-2">No orders yet. Your first scoop is waiting.</p>
              <Link href="/menu" className={buttonClasses("secondary", "sm", "mt-4")}>
                Browse the menu
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border-warm">
              {orders.slice(0, 3).map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.order_number}`}
                    className="flex items-center justify-between gap-3 py-3 transition hover:text-strawberry-700"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{order.order_number}</p>
                      <p className="text-xs text-ink-600">
                        {formatDateOnly(order.placed_at ? order.placed_at.slice(0, 10) : new Date().toLocaleDateString("en-CA"))} ·{" "}
                        {formatMoney(order.totals.total_cents)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} label={order.status_label} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Next reservation</h2>
            <Link href="/account/reservations" className="text-xs font-semibold text-strawberry-700 hover:underline">
              View all
            </Link>
          </div>
          {upcoming ? (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl">{formatDateOnly(upcoming.reservation_date)}</p>
                <ReservationStatusBadge status={upcoming.status} label={upcoming.status_label} />
              </div>
              <p className="mt-1 text-sm text-ink-600">
                {formatTime(upcoming.reservation_time)} · {upcoming.party_size} guests · {upcoming.reservation_code}
              </p>
              {upcoming.notes ? <p className="mt-2 text-xs italic text-ink-600">“{upcoming.notes}”</p> : null}
            </div>
          ) : (
            <div className="mt-6 text-sm text-ink-600">
              <CalendarCheck className="h-5 w-5" />
              <p className="mt-2">Nothing on the book. Save a table for another afternoon.</p>
              <Link href="/reservations" className={buttonClasses("secondary", "sm", "mt-4")}>
                Request a table
              </Link>
            </div>
          )}
        </section>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink-900 p-6 text-vanilla-0">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-strawberry-300" />
          <div>
            <p className="font-display text-xl">Something sweet, delivered.</p>
            <p className="mt-1 text-xs text-vanilla-200">Pickup, delivery, or straight to your table.</p>
          </div>
        </div>
        <Link href="/menu" className={buttonClasses("primary", "sm")}>
          Order now
        </Link>
      </section>
    </div>
  );
}
