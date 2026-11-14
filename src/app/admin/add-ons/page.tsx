"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CentsInput } from "@/components/admin/cents-input";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { ApiError, api, errorMessage } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import type { AddOn } from "@/lib/types";

interface AddOnDraft {
  name: string;
  price_cents: number;
  is_active: boolean;
  sort_order: number;
}

export default function AdminAddOnsPage() {
  const { toast } = useToast();
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AddOn | null>(null);
  const [draft, setDraft] = useState<AddOnDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<AddOn | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AddOn[]>("/admin/add-ons");
      setAddOns(response.data);
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
      if (editing) {
        await api.patch<AddOn>(`/admin/add-ons/${editing.id}`, draft);
        toast("Add-on updated.", "success");
      } else {
        await api.post<AddOn>("/admin/add-ons", draft);
        toast("Add-on created.", "success");
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
      await api.delete(`/admin/add-ons/${deleteTarget.id}`);
      toast("Add-on deleted.", "success");
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
        eyebrow="Menu"
        title="Add-ons"
        description="Toppings and extras offered with products. Deleting one detaches it from the menu."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDraft({ name: "", price_cents: 0, is_active: true, sort_order: addOns.length });
              setFormError(null);
              setFieldErrors({});
            }}
          >
            <Plus className="h-4 w-4" /> New add-on
          </Button>
        }
      />

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : addOns.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">No add-ons yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-warm bg-vanilla-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-vanilla-50 text-[10px] uppercase tracking-[0.12em] text-ink-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Add-on</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm">
              {addOns.map((addOn) => (
                <tr key={addOn.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{addOn.name}</p>
                    <p className="text-[11px] text-ink-600">Sort {addOn.sort_order}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(addOn.price_cents)}</td>
                  <td className="px-4 py-3"><Badge tone={addOn.is_active ? "success" : "neutral"}>{addOn.is_active ? "Active" : "Hidden"}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditing(addOn);
                          setDraft({
                            name: addOn.name,
                            price_cents: addOn.price_cents,
                            is_active: addOn.is_active,
                            sort_order: addOn.sort_order,
                          });
                          setFormError(null);
                          setFieldErrors({});
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(addOn)} aria-label={`Delete ${addOn.name}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => { setDraft(null); setEditing(null); }}
        title={editing ? `Edit ${editing.name}` : "New add-on"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDraft(null); setEditing(null); }}>Cancel</Button>
            <Button type="submit" form="addon-form" loading={saving}>{editing ? "Save changes" : "Create add-on"}</Button>
          </>
        }
      >
        {draft ? (
          <form
            id="addon-form"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <FormError message={formError} />
            <Field label="Name" htmlFor="addon-name" required error={fieldErrors.name?.[0]}>
              <Input id="addon-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
            </Field>
            <Field label="Price" htmlFor="addon-price" required error={fieldErrors.price_cents?.[0]}>
              <CentsInput id="addon-price" value={draft.price_cents} onChange={(cents) => setDraft({ ...draft, price_cents: cents })} />
            </Field>
            <Field label="Sort order" htmlFor="addon-sort">
              <Input
                id="addon-sort"
                type="number"
                min={0}
                value={draft.sort_order}
                onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) })}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })}
                className="h-4 w-4 accent-strawberry-500"
              />
              Available to order
            </label>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : "Delete add-on"}
        description="It will be removed from every product. Past orders keep their record."
        confirmLabel="Delete add-on"
        dangerous
        busy={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}

