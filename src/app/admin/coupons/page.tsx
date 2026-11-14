"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CentsInput } from "@/components/admin/cents-input";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { ApiError, api, errorMessage } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import type { Coupon, DiscountType } from "@/lib/types";

interface CouponDraft {
  code: string;
  description: string;
  discount_type: DiscountType;
  percentage: number;
  fixed_cents: number;
  min_order_cents: number;
  max_uses: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const emptyDraft: CouponDraft = {
  code: "",
  description: "",
  discount_type: "percentage",
  percentage: 10,
  fixed_cents: 500,
  min_order_cents: 0,
  max_uses: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
};

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export default function AdminCouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [draft, setDraft] = useState<CouponDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Coupon[]>("/admin/coupons");
      setCoupons(response.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const payload = {
        code: draft.code.trim(),
        description: draft.description.trim() || null,
        discount_type: draft.discount_type,
        value: draft.discount_type === "percentage" ? Math.round(draft.percentage * 100) : draft.fixed_cents,
        min_order_cents: draft.min_order_cents,
        max_uses: draft.max_uses.trim() ? Number(draft.max_uses) : null,
        starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
        ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
        is_active: draft.is_active,
      };
      if (editing) {
        await api.patch<Coupon>(`/admin/coupons/${editing.id}`, payload);
        toast("Coupon updated.", "success");
      } else {
        await api.post<Coupon>("/admin/coupons", payload);
        toast("Coupon created.", "success");
      }
      setDraft(null);
      setEditing(null);
      void load();
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

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/coupons/${deleteTarget.id}`);
      toast("Coupon removed.", "success");
      setDeleteTarget(null);
      void load();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Marketing"
        title="Coupons"
        description="Codes are validated on the server against dates, usage limits, and minimum spend."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDraft({ ...emptyDraft });
              setFormError(null);
              setFieldErrors({});
            }}
          >
            <Plus className="h-4 w-4" /> New coupon
          </Button>
        }
      />

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">No coupons yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-warm bg-vanilla-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[50rem] text-left text-sm">
              <thead className="bg-vanilla-50 text-[10px] uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Conditions</th>
                  <th className="px-4 py-3 font-semibold">Usage</th>
                  <th className="px-4 py-3 font-semibold">Window</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="align-top hover:bg-vanilla-50/70">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold">{coupon.code}</p>
                      {coupon.description ? <p className="max-w-[14rem] text-[11px] text-ink-600">{coupon.description}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{coupon.display_value}</p>
                      <p className="text-[11px] capitalize text-ink-600">{coupon.discount_type}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {coupon.min_order_cents > 0 ? <p>Min {formatMoney(coupon.min_order_cents)}</p> : <p>No minimum</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {coupon.times_used} used{coupon.max_uses ? ` of ${coupon.max_uses}` : ""}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-ink-600">
                      <p>{coupon.starts_at ? formatDate(coupon.starts_at) : "Anytime"}</p>
                      <p>to {coupon.ends_at ? formatDate(coupon.ends_at) : "no end"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={coupon.is_available ? "success" : coupon.is_active ? "warning" : "neutral"}>
                        {coupon.is_available ? "Available" : coupon.is_active ? "Not currently valid" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditing(coupon);
                            setDraft({
                              code: coupon.code,
                              description: coupon.description ?? "",
                              discount_type: coupon.discount_type,
                              percentage: coupon.discount_type === "percentage" ? coupon.value / 100 : 10,
                              fixed_cents: coupon.discount_type === "fixed" ? coupon.value : 500,
                              min_order_cents: coupon.min_order_cents,
                              max_uses: coupon.max_uses ? String(coupon.max_uses) : "",
                              starts_at: toLocalInput(coupon.starts_at),
                              ends_at: toLocalInput(coupon.ends_at),
                              is_active: coupon.is_active,
                            });
                            setFormError(null);
                            setFieldErrors({});
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(coupon)} aria-label={`Delete ${coupon.code}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => { setDraft(null); setEditing(null); }}
        title={editing ? `Edit ${editing.code}` : "New coupon"}
        description="Percentage discounts use whole percents. Fixed discounts come off the subtotal."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDraft(null); setEditing(null); }}>Cancel</Button>
            <Button type="submit" form="coupon-form" loading={saving}>{editing ? "Save changes" : "Create coupon"}</Button>
          </>
        }
      >
        {draft ? (
          <form
            id="coupon-form"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <div className="sm:col-span-2"><FormError message={formError} /></div>
            <Field label="Code" htmlFor="coupon-code" required error={fieldErrors.code?.[0]} hint="Letters, numbers, dashes, underscores.">
              <Input
                id="coupon-code"
                value={draft.code}
                onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })}
                required
              />
            </Field>
            <Field label="Status">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-border-warm px-4 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })}
                  className="h-4 w-4 accent-strawberry-500"
                />
                Active
              </label>
            </Field>
            <Field label="Description" htmlFor="coupon-description" className="sm:col-span-2">
              <Textarea
                id="coupon-description"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                className="min-h-16"
                placeholder="Shown at checkout when the code applies."
              />
            </Field>
            <Field label="Discount type" htmlFor="coupon-type" required>
              <Select
                id="coupon-type"
                value={draft.discount_type}
                onChange={(event) => setDraft({ ...draft, discount_type: event.target.value as DiscountType })}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </Select>
            </Field>
            {draft.discount_type === "percentage" ? (
              <Field label="Percent off" htmlFor="coupon-percent" required error={fieldErrors.value?.[0]}>
                <div className="relative">
                  <Input
                    id="coupon-percent"
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={draft.percentage}
                    onChange={(event) => setDraft({ ...draft, percentage: Number(event.target.value) })}
                    className="pr-9"
                    required
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-600">%</span>
                </div>
              </Field>
            ) : (
              <Field label="Amount off" htmlFor="coupon-fixed" required error={fieldErrors.value?.[0]}>
                <CentsInput id="coupon-fixed" value={draft.fixed_cents} onChange={(cents) => setDraft({ ...draft, fixed_cents: cents })} />
              </Field>
            )}
            <Field label="Minimum order" htmlFor="coupon-minimum" hint="Leave at zero for no minimum.">
              <CentsInput id="coupon-minimum" value={draft.min_order_cents} onChange={(cents) => setDraft({ ...draft, min_order_cents: cents })} />
            </Field>
            <Field label="Maximum uses" htmlFor="coupon-max" hint="Leave blank for unlimited.">
              <Input
                id="coupon-max"
                type="number"
                min={1}
                value={draft.max_uses}
                onChange={(event) => setDraft({ ...draft, max_uses: event.target.value })}
              />
            </Field>
            <Field label="Starts" htmlFor="coupon-start" error={fieldErrors.starts_at?.[0]}>
              <Input
                id="coupon-start"
                type="datetime-local"
                value={draft.starts_at}
                onChange={(event) => setDraft({ ...draft, starts_at: event.target.value })}
              />
            </Field>
            <Field label="Ends" htmlFor="coupon-end" error={fieldErrors.ends_at?.[0]}>
              <Input
                id="coupon-end"
                type="datetime-local"
                value={draft.ends_at}
                onChange={(event) => setDraft({ ...draft, ends_at: event.target.value })}
              />
            </Field>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete ${deleteTarget.code}?` : "Delete coupon"}
        description="Coupons with redemptions are deactivated instead of deleted so order history stays intact."
        confirmLabel="Delete coupon"
        dangerous
        busy={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
