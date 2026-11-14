"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Pagination } from "@/components/admin/pagination";
import { Badge, OrderStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { ApiError, api, errorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { Order, PaginationMeta, User } from "@/lib/types";

interface CustomerDetail {
  customer: User;
  recent_orders: Order[];
}

export default function AdminCustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [draft, setDraft] = useState<{ name: string; email: string; phone: string; is_active: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), per_page: "20" });
    if (search) params.set("search", search);
    try {
      const response = await api.get<User[]>(`/admin/customers?${params.toString()}`);
      setCustomers(response.data);
      setMeta(response.meta ?? null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openCustomer(customer: User) {
    setDetail({ customer, recent_orders: [] });
    setDetailLoading(true);
    setFormError(null);
    setFieldErrors({});
    setDraft({
      name: customer.name,
      email: customer.email,
      phone: customer.phone ?? "",
      is_active: customer.is_active,
    });
    try {
      const response = await api.get<CustomerDetail>(`/admin/customers/${customer.id}`);
      setDetail(response.data);
      setDraft({
        name: response.data.customer.name,
        email: response.data.customer.email,
        phone: response.data.customer.phone ?? "",
        is_active: response.data.customer.is_active,
      });
    } catch (err) {
      toast(errorMessage(err), "error");
      setDetail(null);
      setDraft(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function save() {
    if (!detail || !draft) return;
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const response = await api.patch<User>(`/admin/customers/${detail.customer.id}`, {
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim() || null,
        is_active: draft.is_active,
      });
      setDetail({ ...detail, customer: response.data });
      setCustomers((current) => current.map((item) => (item.id === response.data.id ? { ...item, ...response.data } : item)));
      toast("Customer updated.", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors);
        setFormError(Object.values(err.errors)[0]?.[0] ?? err.message);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="People"
        title="Customers"
        description="Registered customer accounts and their recent orders."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void load()} loading={loading}>
            Refresh
          </Button>
        }
      />

      <form
        className="flex gap-2 rounded-2xl border border-border-warm bg-vanilla-0 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          <Input
            aria-label="Search customers"
            placeholder="Name, email, phone"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm">Search</Button>
        {search ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        ) : null}
      </form>

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">No customers found.</p>
          <p className="mt-1 text-sm text-ink-600">Accounts are created when guests register.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-warm bg-vanilla-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-vanilla-50 text-[10px] uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-vanilla-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium">{customer.name}</p>
                      {customer.last_login_at ? (
                        <p className="text-[11px] text-ink-600">Last seen {formatDate(customer.last_login_at)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink-700">{customer.email}</p>
                      <p className="text-[11px] text-ink-600">{customer.phone ?? "No phone"}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{customer.orders_count ?? 0}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(customer.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={customer.is_active ? "success" : "danger"}>{customer.is_active ? "Active" : "Disabled"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="secondary" onClick={() => void openCustomer(customer)}>Open</Button>
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
        open={detail !== null}
        onClose={() => { setDetail(null); setDraft(null); }}
        title={detail ? detail.customer.name : "Customer"}
        description={detail ? `Customer #${detail.customer.id} · ${detail.customer.orders_count ?? 0} orders` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDetail(null); setDraft(null); }}>Close</Button>
            <Button type="submit" form="customer-form" loading={saving}>Save changes</Button>
          </>
        }
      >
        {detail && draft ? (
          <div className="space-y-5">
            <FormError message={formError} />
            <form
              id="customer-form"
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <Field label="Name" htmlFor="customer-name" required error={fieldErrors.name?.[0]}>
                <Input id="customer-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
              </Field>
              <Field label="Email" htmlFor="customer-email" required error={fieldErrors.email?.[0]}>
                <Input id="customer-email" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required />
              </Field>
              <Field label="Phone" htmlFor="customer-phone" error={fieldErrors.phone?.[0]}>
                <Input id="customer-phone" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
              </Field>
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })}
                  className="h-4 w-4 accent-strawberry-500"
                />
                Account active
              </label>
            </form>

            <div>
              <h3 className="text-sm font-semibold">Recent orders</h3>
              {detailLoading ? (
                <p className="mt-2 text-xs text-ink-600">Loading orders…</p>
              ) : detail.recent_orders.length === 0 ? (
                <p className="mt-2 text-sm text-ink-600">No online orders yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-border-warm rounded-xl border border-border-warm">
                  {detail.recent_orders.map((order) => (
                    <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-[11px] text-ink-600">{formatDate(order.placed_at ?? order.created_at)} · {order.fulfillment_label}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums">{formatMoney(order.totals.total_cents)}</span>
                        <OrderStatusBadge status={order.status} label={order.status_label} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
