"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Pagination } from "@/components/admin/pagination";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge, OrderStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Order, OrderStatus, PaginationMeta } from "@/lib/types";

const statuses: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelOrder, setCancelOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), per_page: "20" });
    if (status) params.set("status", status);
    if (source) params.set("source", source);
    if (fulfillment) params.set("fulfillment_type", fulfillment);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (search) params.set("search", search);

    try {
      const response = await api.get<Order[]>(`/admin/orders?${params.toString()}`);
      setOrders(response.data);
      setMeta(response.meta ?? null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, status, source, fulfillment, from, to, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openOrder(order: Order) {
    setDetailLoading(true);
    setSelected(order);
    try {
      const response = await api.get<Order>(`/admin/orders/${order.order_number}`);
      setSelected(response.data);
    } catch (err) {
      toast(errorMessage(err), "error");
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(order: Order, next: OrderStatus, reason?: string) {
    setBusy(true);
    try {
      const response = await api.patch<Order>(`/admin/orders/${order.order_number}/status`, {
        status: next,
        reason: reason ?? null,
      });
      setSelected(response.data);
      setOrders((current) => current.map((item) => (item.id === order.id ? response.data : item)));
      toast(`Order ${order.order_number} marked ${next.replace("_", " ")}.`, "success");
      setCancelOrder(null);
      void load();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  const counts = meta?.counts;
  const activeFilters = Boolean(status || source || fulfillment || from || to || search);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Service"
        title="Orders"
        description="Every online and QR order, with kitchen status and admin controls."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void load()} loading={loading}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            status === "" ? "border-ink-900 bg-ink-900 text-vanilla-0" : "border-border-warm bg-vanilla-0 text-ink-600 hover:text-ink-900"
          }`}
        >
          All {meta?.total ?? ""}
        </button>
        {statuses.slice(1).map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setStatus(status === item.value ? "" : item.value);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              status === item.value
                ? "border-ink-900 bg-ink-900 text-vanilla-0"
                : "border-border-warm bg-vanilla-0 text-ink-600 hover:text-ink-900"
            }`}
          >
            {item.label} {counts?.[item.value] ?? 0}
          </button>
        ))}
      </div>

      <form
        className="grid gap-2 rounded-2xl border border-border-warm bg-vanilla-0 p-3 sm:grid-cols-2 xl:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          <Input
            aria-label="Search orders"
            placeholder="Order number, guest, email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select aria-label="Filter by source" value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }}>
          <option value="">All sources</option>
          <option value="online">Online</option>
          <option value="qr">QR table</option>
        </Select>
        <Select
          aria-label="Filter by fulfillment"
          value={fulfillment}
          onChange={(event) => { setFulfillment(event.target.value); setPage(1); }}
        >
          <option value="">All fulfillment</option>
          <option value="delivery">Delivery</option>
          <option value="pickup">Pickup</option>
          <option value="dine_in">Dine in</option>
        </Select>
        <Input aria-label="From date" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
        <Input aria-label="To date" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
        <div className="flex gap-2 sm:col-span-2 xl:col-span-6">
          <Button type="submit" size="sm">Search</Button>
          {activeFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatus("");
                setSource("");
                setFulfillment("");
                setFrom("");
                setTo("");
                setSearch("");
                setSearchInput("");
                setPage(1);
              }}
            >
              <X className="h-3.5 w-3.5" /> Clear filters
            </Button>
          ) : null}
        </div>
      </form>

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">No orders match these filters.</p>
          <p className="mt-1 text-sm text-ink-600">Try widening the date range or clearing the search.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-warm bg-vanilla-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-vanilla-50 text-[10px] uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Placed</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-vanilla-50/70">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => void openOrder(order)} className="font-semibold hover:text-strawberry-700">
                        {order.order_number}
                      </button>
                      <p className="text-[11px] text-ink-600">{order.items.length} item{order.items.length === 1 ? "" : "s"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer.name}</p>
                      <p className="text-[11px] text-ink-600">{order.customer.phone ?? order.customer.email ?? "Guest"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{order.table ? order.table.name : order.fulfillment_label}</p>
                      <p className="text-[11px] text-ink-600">{order.source_label}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{formatDateTime(order.placed_at ?? order.created_at)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatMoney(order.totals.total_cents)}</td>
                    <td className="px-4 py-3"><OrderStatusBadge status={order.status} label={order.status_label} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" size="sm" onClick={() => void openOrder(order)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <div className="px-4 pb-4">
              <Pagination page={meta.current_page} lastPage={meta.last_page} total={meta.total} onPage={setPage} busy={loading} />
            </div>
          ) : null}
        </div>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.order_number}` : "Order"}
        description={selected ? `${selected.source_label} · ${selected.fulfillment_label} · ${formatDateTime(selected.placed_at ?? selected.created_at)}` : undefined}
        size="lg"
        footer={
          selected ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {selected.status === "cancelled" ? null : (
                  <Button variant="danger" size="sm" onClick={() => setCancelOrder(selected)}>
                    Cancel order
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.available_statuses.map((next) => (
                  <Button
                    key={next}
                    size="sm"
                    variant={next === "completed" ? "primary" : "secondary"}
                    loading={busy}
                    onClick={() => void changeStatus(selected, next)}
                  >
                    Mark {next.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5">
            {detailLoading ? <p className="text-xs text-ink-600">Refreshing order…</p> : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-vanilla-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-600">Status</p>
                <div className="mt-1"><OrderStatusBadge status={selected.status} label={selected.status_label} /></div>
              </div>
              <div className="rounded-xl bg-vanilla-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-600">Guest</p>
                <p className="mt-1 text-sm font-medium">{selected.customer.name}</p>
                <p className="text-xs text-ink-600">{selected.customer.phone ?? selected.customer.email ?? "No contact"}</p>
              </div>
              <div className="rounded-xl bg-vanilla-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-600">Payment</p>
                <p className="mt-1 text-sm font-medium capitalize">{selected.payment_method.replaceAll("_", " ")}</p>
                <p className="text-xs text-ink-600 capitalize">{selected.payment_status}</p>
              </div>
            </div>

            {selected.fulfillment_type === "delivery" && selected.delivery_address ? (
              <div>
                <h3 className="text-sm font-semibold">Delivery address</h3>
                <p className="mt-1 text-sm text-ink-600">
                  {selected.delivery_address.line1}
                  {selected.delivery_address.line2 ? `, ${selected.delivery_address.line2}` : ""}, {selected.delivery_address.city}{" "}
                  {selected.delivery_address.postal_code}
                </p>
              </div>
            ) : null}

            {selected.table ? (
              <div>
                <h3 className="text-sm font-semibold">Table</h3>
                <p className="mt-1 text-sm text-ink-600">
                  {selected.table.name}{selected.table.zone ? ` · ${selected.table.zone}` : ""}
                </p>
              </div>
            ) : null}

            <div>
              <h3 className="text-sm font-semibold">Items</h3>
              <ul className="mt-2 divide-y divide-border-warm rounded-xl border border-border-warm">
                {selected.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 px-3 py-2.5 text-sm">
                    <div>
                      <p>
                        <span className="font-semibold">{item.quantity}×</span> {item.product_name}
                        {item.variant_name ? <span className="text-ink-600"> · {item.variant_name}</span> : null}
                      </p>
                      {item.add_ons.length > 0 ? (
                        <p className="text-xs text-ink-600">{item.add_ons.map((addOn) => addOn.name).join(", ")}</p>
                      ) : null}
                      {item.notes ? <p className="text-xs italic text-ink-600">“{item.notes}”</p> : null}
                    </div>
                    <span className="shrink-0 tabular-nums">{formatMoney(item.line_total_cents)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <Row label="Subtotal" value={selected.totals.subtotal_cents} />
              {selected.totals.discount_cents > 0 ? (
                <Row label={`Discount${selected.coupon_code ? ` (${selected.coupon_code})` : ""}`} value={-selected.totals.discount_cents} />
              ) : null}
              <Row label="Tax" value={selected.totals.tax_cents} />
              {selected.totals.service_fee_cents > 0 ? <Row label="Service fee" value={selected.totals.service_fee_cents} /> : null}
              {selected.totals.delivery_fee_cents > 0 ? <Row label="Delivery" value={selected.totals.delivery_fee_cents} /> : null}
              <div className="flex justify-between border-t border-border-warm pt-1 font-semibold">
                <span>Total</span>
                <span>{formatMoney(selected.totals.total_cents)}</span>
              </div>
            </div>

            {selected.notes ? (
              <div className="rounded-xl border border-vanilla-200 bg-vanilla-50 p-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-600">Guest note</h3>
                <p className="mt-1 text-sm">{selected.notes}</p>
              </div>
            ) : null}

            {selected.cancellation_reason ? (
              <p className="rounded-xl border border-danger/20 bg-strawberry-50 p-3 text-sm text-danger">
                Cancelled: {selected.cancellation_reason}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-600">
              <Badge tone="neutral">{selected.status === "cancelled" ? "Cancelled" : "Active record"}</Badge>
              <span>Order ID {selected.id}</span>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={cancelOrder !== null}
        title={cancelOrder ? `Cancel ${cancelOrder.order_number}?` : "Cancel order"}
        description="This releases the kitchen ticket and notifies the customer. Add a short reason for their order history."
        confirmLabel="Cancel order"
        dangerous
        withReason
        busy={busy}
        onClose={() => setCancelOrder(null)}
        onConfirm={(reason) => {
          if (cancelOrder) void changeStatus(cancelOrder, "cancelled", reason);
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-ink-600">
      <span>{label}</span>
      <span className="tabular-nums text-ink-900">{formatMoney(value)}</span>
    </div>
  );
}
