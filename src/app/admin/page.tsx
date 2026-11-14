"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  ChefHat,
  ClipboardList,
  Coffee,
  DollarSign,
  UsersRound,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderStatusBadge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { cn, formatCompactMoney, formatMoney, relativeTime } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardData>("/admin/dashboard")
      .then((response) => setData(response.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <div className="grid gap-3 sm:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error ?? "Dashboard unavailable."}</p>;
  }

  const { stats } = data;
  const revenueDelta = stats.revenue_today_cents - stats.revenue_yesterday_cents;
  const maxSales = Math.max(...data.sales_last_7_days.map((day) => day.total_cents), 1);

  const metrics = [
    {
      label: "Orders today",
      value: stats.orders_today.toString(),
      hint: `${stats.active_orders} active now`,
      icon: ClipboardList,
      href: "/admin/orders",
    },
    {
      label: "Revenue today",
      value: formatMoney(stats.revenue_today_cents),
      hint:
        revenueDelta === 0
          ? "Same as yesterday"
          : `${revenueDelta > 0 ? "+" : "−"}${formatMoney(Math.abs(revenueDelta))} vs yesterday`,
      icon: DollarSign,
      href: "/admin/orders",
      trend: revenueDelta,
    },
    {
      label: "Upcoming tables",
      value: stats.upcoming_reservations.toString(),
      hint: "Pending and confirmed",
      icon: CalendarCheck,
      href: "/admin/reservations",
    },
    {
      label: "Customers",
      value: stats.customers.toString(),
      hint: "Registered accounts",
      icon: UsersRound,
      href: "/admin/customers",
    },
    {
      label: "Active products",
      value: stats.active_products.toString(),
      hint: "On the menu",
      icon: Coffee,
      href: "/admin/products",
    },
  ];

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Operations"
        title="Dashboard"
        description="A live view of the restaurant: orders, revenue, and the book."
        actions={
          <>
            <Link href="/chef" className={buttonClasses("secondary", "sm")}>
              <ChefHat className="h-4 w-4" />
              Kitchen board
            </Link>
            <Link href="/admin/orders" className={buttonClasses("primary", "sm")}>
              Manage orders
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-2xl border border-border-warm bg-vanilla-0 p-4 transition hover:border-ink-900/20"
          >
            <div className="flex items-center justify-between">
              <metric.icon className="h-4 w-4 text-strawberry-600" />
              {metric.trend !== undefined && metric.trend !== 0 ? (
                <span className={cn("flex items-center gap-0.5 text-[10px] font-bold", metric.trend > 0 ? "text-success" : "text-danger")}>
                  {metric.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {metric.trend > 0 ? "up" : "down"}
                </span>
              ) : null}
            </div>
            <p className="mt-3 truncate font-display text-2xl leading-none">{metric.value}</p>
            <p className="mt-1.5 text-xs font-medium text-ink-700">{metric.label}</p>
            <p className="text-[11px] text-ink-600">{metric.hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Sales, last 7 days</h2>
              <p className="text-xs text-ink-600">Completed and in-progress orders, excluding cancellations.</p>
            </div>
            <p className="font-display text-xl">
              {formatCompactMoney(data.sales_last_7_days.reduce((sum, day) => sum + day.total_cents, 0))}
            </p>
          </div>
          <div className="mt-6 flex h-44 items-end gap-2 sm:gap-3">
            {data.sales_last_7_days.map((day) => {
              const height = Math.max(4, Math.round((day.total_cents / maxSales) * 100));
              return (
                <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-strawberry-500/85 transition-all"
                      style={{ height: `${height}%` }}
                      title={`${formatMoney(day.total_cents)}`}
                    />
                  </div>
                  <span className="text-[10px] text-ink-600">
                    {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(`${day.date}T12:00:00`))}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Top products</h2>
              <p className="text-xs text-ink-600">Last 30 days by quantity.</p>
            </div>
          </div>
          {data.top_products.length === 0 ? (
            <p className="mt-6 text-sm text-ink-600">No product sales yet.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {data.top_products.map((product, index) => (
                <li key={product.product_name} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vanilla-100 text-[10px] font-bold text-ink-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.product_name}</p>
                    <p className="text-[11px] text-ink-600">{product.quantity} sold · {formatMoney(product.revenue_cents)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border-warm bg-vanilla-0">
        <div className="flex items-center justify-between border-b border-border-warm px-5 py-4">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-strawberry-700 hover:underline">
            View all orders
          </Link>
        </div>
        {data.recent_orders.length === 0 ? (
          <p className="px-5 py-8 text-sm text-ink-600">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-vanilla-50 text-[10px] uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Guest</th>
                  <th className="px-5 py-3 font-semibold">Where</th>
                  <th className="px-5 py-3 font-semibold">Placed</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {data.recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3 font-semibold">{order.order_number}</td>
                    <td className="px-5 py-3 text-ink-600">{order.customer.name}</td>
                    <td className="px-5 py-3 text-ink-600">
                      {order.table ? order.table.name : order.fulfillment_label}
                    </td>
                    <td className="px-5 py-3 text-ink-600">{relativeTime(order.placed_at ?? order.created_at)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatMoney(order.totals.total_cents)}</td>
                    <td className="px-5 py-3">
                      <OrderStatusBadge status={order.status} label={order.status_label} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
