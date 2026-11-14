"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useToast } from "@/providers/toast-provider";
import type { Address } from "@/lib/types";

interface AddressFormState {
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  postal_code: string;
  is_default: boolean;
}

const emptyForm: AddressFormState = {
  label: "Home",
  recipient_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  postal_code: "",
  is_default: false,
};

function payloadFrom(address: Address, isDefault: boolean) {
  return {
    label: address.label,
    recipient_name: address.recipient_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    postal_code: address.postal_code,
    latitude: address.latitude,
    longitude: address.longitude,
    is_default: isDefault,
  };
}

export default function AddressesPage() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<AddressFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<Address[]>("/account/addresses")
      .then((response) => setAddresses(response.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setForm({
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setFormError(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setFieldErrors({});

    const payload = {
      label: form.label.trim() || "Home",
      recipient_name: form.recipient_name.trim(),
      phone: form.phone.trim() || null,
      line1: form.line1.trim(),
      line2: form.line2.trim() || null,
      city: form.city.trim(),
      postal_code: form.postal_code.trim(),
      is_default: form.is_default,
    };

    try {
      if (editing) {
        await api.patch<Address>(`/account/addresses/${editing.id}`, payload);
        toast("Address updated.", "success");
      } else {
        await api.post<Address>("/account/addresses", payload);
        toast("Address saved.", "success");
      }
      setFormOpen(false);
      load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors);
        setFormError(err.message);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (address: Address) => {
    try {
      await api.patch<Address>(`/account/addresses/${address.id}`, payloadFrom(address, true));
      toast("Default address updated.", "success");
      load();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/account/addresses/${deleting.id}`);
      toast("Address removed.", "success");
      setDeleting(null);
      load();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const fieldError = (key: string) => fieldErrors[key]?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Delivery details</p>
          <h1 className="mt-2 text-h2">Saved addresses</h1>
          <p className="mt-1 text-sm text-ink-600">Keep the places we deliver to ready at checkout.</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4" />
          Add address
        </Button>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add an address now, or save one during your next delivery checkout."
          action={
            <Button onClick={openCreate} size="md">
              Add your first address
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-2xl border border-border-warm bg-vanilla-0 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{address.label}</p>
                  <p className="mt-1 text-xs text-ink-600">{address.recipient_name}</p>
                </div>
                {address.is_default ? <Badge tone="strawberry">Default</Badge> : null}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">
                {address.line1}
                {address.line2 ? <>, {address.line2}</> : null}
                <br />
                {address.city} {address.postal_code}
              </p>
              {address.phone ? <p className="mt-1 text-xs text-ink-600">{address.phone}</p> : null}
              <div className="mt-4 flex flex-wrap gap-1 border-t border-border-warm pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(address)}
                  className={buttonClasses("ghost", "sm")}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                {!address.is_default ? (
                  <button
                    type="button"
                    onClick={() => makeDefault(address)}
                    className={buttonClasses("ghost", "sm")}
                  >
                    <Star className="h-3.5 w-3.5" />
                    Make default
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDeleting(address)}
                  className={buttonClasses("ghost", "sm", "text-danger hover:bg-strawberry-50")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit address" : "Add an address"}
        description="We only use this to deliver your order."
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          {formError ? <FormError message={formError} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label" htmlFor="addr-label" error={fieldError("label")}>
              <Input
                id="addr-label"
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
                placeholder="Home, Studio…"
              />
            </Field>
            <Field label="Recipient" htmlFor="addr-recipient" required error={fieldError("recipient_name")}>
              <Input
                id="addr-recipient"
                value={form.recipient_name}
                onChange={(event) => setForm({ ...form, recipient_name: event.target.value })}
                autoComplete="name"
                required
              />
            </Field>
          </div>
          <Field label="Phone" htmlFor="addr-phone" error={fieldError("phone")}>
            <Input
              id="addr-phone"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              autoComplete="tel"
              inputMode="tel"
              placeholder="For delivery updates"
            />
          </Field>
          <Field label="Street address" htmlFor="addr-line1" required error={fieldError("line1")}>
            <Input
              id="addr-line1"
              value={form.line1}
              onChange={(event) => setForm({ ...form, line1: event.target.value })}
              autoComplete="address-line1"
              required
            />
          </Field>
          <Field label="Apartment, floor, etc." htmlFor="addr-line2" error={fieldError("line2")}>
            <Input
              id="addr-line2"
              value={form.line2}
              onChange={(event) => setForm({ ...form, line2: event.target.value })}
              autoComplete="address-line2"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" htmlFor="addr-city" required error={fieldError("city")}>
              <Input
                id="addr-city"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                autoComplete="address-level2"
                required
              />
            </Field>
            <Field label="Postal code" htmlFor="addr-postal" required error={fieldError("postal_code")}>
              <Input
                id="addr-postal"
                value={form.postal_code}
                onChange={(event) => setForm({ ...form, postal_code: event.target.value })}
                autoComplete="postal-code"
                required
              />
            </Field>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(event) => setForm({ ...form, is_default: event.target.checked })}
              className="h-4 w-4 rounded border-border-warm text-strawberry-600 focus:ring-strawberry-500"
            />
            Use as my default delivery address
          </label>
          <div className="flex justify-end gap-2 border-t border-border-warm pt-4">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Save address"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Remove this address?"
        description={deleting ? `${deleting.label} · ${deleting.line1}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Keep it
            </Button>
            <Button variant="danger" loading={deleteBusy} onClick={confirmDelete}>
              Remove address
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          This only removes the saved address. Past orders keep the address they were delivered to.
        </p>
      </Modal>
    </div>
  );
}
