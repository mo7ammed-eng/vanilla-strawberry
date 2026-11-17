"use client";

import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CentsInput } from "@/components/admin/cents-input";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { useSettings } from "@/providers/settings-provider";
import { ApiError, api, errorMessage } from "@/lib/api";
import type { WeekdayHours } from "@/lib/types";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface SettingsDraft {
  restaurant_name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  map_url: string;
  currency: string;
  currency_symbol: string;
  established_year: number;
  hours: WeekdayHours[];
  tax_rate_bps: number;
  service_fee_bps: number;
  delivery_fee_cents: number;
  free_delivery_threshold_cents: number;
  reservations_enabled: boolean;
  coupons_enabled: boolean;
  reservation_capacity_per_slot: number;
  reservation_slots: string;
}

interface SettingsPayload {
  settings: Record<string, unknown>;
  public: unknown;
  schema?: Record<string, string>;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : Number(value) || fallback;
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  if (typeof value === "number") return value === 1;
  return fallback;
}

function normalise(raw: Record<string, unknown>): SettingsDraft {
  const seen = new Map<string, WeekdayHours>();
  if (Array.isArray(raw.hours)) {
    for (const entry of raw.hours) {
      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const day = str(record.day);
        if (day) {
          seen.set(day, {
            day,
            open: str(record.open, "12:00"),
            close: str(record.close, "22:00"),
          });
        }
      }
    }
  }

  return {
    restaurant_name: str(raw.restaurant_name, "Vanilla & Strawberry"),
    tagline: str(raw.tagline),
    address: str(raw.address),
    phone: str(raw.phone),
    email: str(raw.email),
    instagram: str(raw.instagram),
    map_url: str(raw.map_url),
    currency: str(raw.currency, "USD"),
    currency_symbol: str(raw.currency_symbol, "$"),
    established_year: num(raw.established_year, 2018),
    hours: days.map((day) => seen.get(day) ?? { day, open: "12:00", close: "22:00" }),
    tax_rate_bps: num(raw.tax_rate_bps, 888),
    service_fee_bps: num(raw.service_fee_bps, 0),
    delivery_fee_cents: num(raw.delivery_fee_cents, 600),
    free_delivery_threshold_cents: num(raw.free_delivery_threshold_cents, 6000),
    reservations_enabled: bool(raw.reservations_enabled, true),
    coupons_enabled: bool(raw.coupons_enabled, true),
    reservation_capacity_per_slot: num(raw.reservation_capacity_per_slot, 24),
    reservation_slots: Array.isArray(raw.reservation_slots) ? raw.reservation_slots.join(", ") : "",
  };
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { refresh } = useSettings();
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<SettingsPayload>("/admin/settings");
      setDraft(normalise(response.data.settings));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch(patchValue: Partial<SettingsDraft>) {
    setDraft((current) => (current ? { ...current, ...patchValue } : current));
  }

  function patchHour(index: number, patchValue: Partial<WeekdayHours>) {
    setDraft((current) => {
      if (!current) return current;
      const hours = current.hours.map((hour, hourIndex) =>
        hourIndex === index ? { ...hour, ...patchValue } : hour,
      );
      return { ...current, hours };
    });
  }

  async function save() {
    if (!draft) return;
    setFormError(null);
    setFieldErrors({});

    const slots = draft.reservation_slots
      .split(",")
      .map((slot) => slot.trim())
      .filter(Boolean);
    if (slots.some((slot) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot))) {
      setFormError("Reservation slots must use 24-hour HH:MM times, separated by commas.");
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch<SettingsPayload>("/admin/settings", {
        settings: {
          restaurant_name: draft.restaurant_name.trim(),
          tagline: draft.tagline.trim(),
          address: draft.address.trim(),
          phone: draft.phone.trim(),
          email: draft.email.trim(),
          instagram: draft.instagram.trim(),
          map_url: draft.map_url.trim(),
          currency: draft.currency.trim().toUpperCase(),
          currency_symbol: draft.currency_symbol.trim(),
          established_year: draft.established_year,
          hours: draft.hours,
          tax_rate_bps: draft.tax_rate_bps,
          service_fee_bps: draft.service_fee_bps,
          delivery_fee_cents: draft.delivery_fee_cents,
          free_delivery_threshold_cents: draft.free_delivery_threshold_cents,
          reservations_enabled: draft.reservations_enabled,
          coupons_enabled: draft.coupons_enabled,
          reservation_capacity_per_slot: draft.reservation_capacity_per_slot,
          reservation_slots: slots,
        },
      });
      setDraft(normalise(response.data.settings));
      await refresh();
      toast("Settings saved. Public pages will reflect the changes.", "success");
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

  if (loading) {
    return <CardSkeleton />;
  }

  if (error || !draft) {
    return <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error ?? "Settings unavailable."}</p>;
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <AdminPageHeader
        eyebrow="System"
        title="Restaurant settings"
        description="Public information, service hours, fees, and feature switches. Changes apply immediately."
        actions={
          <Button type="submit" size="sm" loading={saving}>
            <Save className="h-4 w-4" /> Save settings
          </Button>
        }
      />

      <FormError message={formError} />

      <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-5">
        <h2 className="text-lg font-semibold">Restaurant identity</h2>
        <p className="text-xs text-ink-600">Shown in the site title, navigation, footer, search results, and receipts.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Website name" htmlFor="settings-name" required>
            <Input id="settings-name" value={draft.restaurant_name} onChange={(event) => patch({ restaurant_name: event.target.value })} required />
          </Field>
          <Field label="Tagline" htmlFor="settings-tagline">
            <Input id="settings-tagline" value={draft.tagline} onChange={(event) => patch({ tagline: event.target.value })} />
          </Field>
          <Field label="Address" htmlFor="settings-address" className="sm:col-span-2">
            <Textarea id="settings-address" value={draft.address} onChange={(event) => patch({ address: event.target.value })} className="min-h-16" />
          </Field>
          <Field label="Phone" htmlFor="settings-phone">
            <Input id="settings-phone" value={draft.phone} onChange={(event) => patch({ phone: event.target.value })} />
          </Field>
          <Field label="Email" htmlFor="settings-email">
            <Input id="settings-email" type="email" value={draft.email} onChange={(event) => patch({ email: event.target.value })} />
          </Field>
          <Field label="Instagram handle" htmlFor="settings-instagram">
            <Input id="settings-instagram" value={draft.instagram} onChange={(event) => patch({ instagram: event.target.value })} />
          </Field>
          <Field label="Map URL" htmlFor="settings-map">
            <Input id="settings-map" value={draft.map_url} onChange={(event) => patch({ map_url: event.target.value })} />
          </Field>
          <Field label="Established year" htmlFor="settings-year">
            <Input
              id="settings-year"
              type="number"
              min={1900}
              max={2100}
              value={draft.established_year}
              onChange={(event) => patch({ established_year: Number(event.target.value) })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency code" htmlFor="settings-currency">
              <Input id="settings-currency" value={draft.currency} onChange={(event) => patch({ currency: event.target.value })} />
            </Field>
            <Field label="Symbol" htmlFor="settings-symbol">
              <Input id="settings-symbol" value={draft.currency_symbol} onChange={(event) => patch({ currency_symbol: event.target.value })} />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-5">
        <h2 className="text-lg font-semibold">Opening hours</h2>
        <p className="text-xs text-ink-600">Shown to guests and used as restaurant information.</p>
        <div className="mt-4 space-y-2">
          {draft.hours.map((hour, index) => (
            <div key={hour.day} className="grid items-center gap-2 sm:grid-cols-[8rem_1fr_1fr]">
              <span className="text-sm font-medium">{hour.day}</span>
              <label className="flex items-center gap-2 text-xs text-ink-600">
                Open
                <Input
                  type="time"
                  aria-label={`${hour.day} opening time`}
                  value={hour.open}
                  onChange={(event) => patchHour(index, { open: event.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-600">
                Close
                <Input
                  type="time"
                  aria-label={`${hour.day} closing time`}
                  value={hour.close}
                  onChange={(event) => patchHour(index, { close: event.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-5">
        <h2 className="text-lg font-semibold">Fees &amp; tax</h2>
        <p className="text-xs text-ink-600">Tax and service fees are added to the subtotal by the server at checkout.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Tax rate" htmlFor="settings-tax" hint="Percent, e.g. 8.88">
            <div className="relative">
              <Input
                id="settings-tax"
                type="number"
                min={0}
                max={50}
                step={0.01}
                value={draft.tax_rate_bps / 100}
                onChange={(event) => patch({ tax_rate_bps: Math.round(Number(event.target.value) * 100) })}
                className="pr-9"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-600">%</span>
            </div>
          </Field>
          <Field label="Service fee" htmlFor="settings-service" hint="Percent, e.g. 2.5">
            <div className="relative">
              <Input
                id="settings-service"
                type="number"
                min={0}
                max={50}
                step={0.01}
                value={draft.service_fee_bps / 100}
                onChange={(event) => patch({ service_fee_bps: Math.round(Number(event.target.value) * 100) })}
                className="pr-9"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-600">%</span>
            </div>
          </Field>
          <Field label="Delivery fee" htmlFor="settings-delivery">
            <CentsInput id="settings-delivery" value={draft.delivery_fee_cents} onChange={(cents) => patch({ delivery_fee_cents: cents })} />
          </Field>
          <Field label="Free delivery over" htmlFor="settings-free-delivery">
            <CentsInput
              id="settings-free-delivery"
              value={draft.free_delivery_threshold_cents}
              onChange={(cents) => patch({ free_delivery_threshold_cents: cents })}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border-warm bg-vanilla-0 p-5">
        <h2 className="text-lg font-semibold">Features &amp; reservations</h2>
        <p className="text-xs text-ink-600">Disabling a feature hides its customer controls and rejects it on the server.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-border-warm px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={draft.reservations_enabled}
              onChange={(event) => patch({ reservations_enabled: event.target.checked })}
              className="h-4 w-4 accent-strawberry-500"
            />
            Reservations enabled
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-border-warm px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={draft.coupons_enabled}
              onChange={(event) => patch({ coupons_enabled: event.target.checked })}
              className="h-4 w-4 accent-strawberry-500"
            />
            Coupons enabled
          </label>
          <Field label="Guests per slot" htmlFor="settings-capacity">
            <Input
              id="settings-capacity"
              type="number"
              min={1}
              max={200}
              value={draft.reservation_capacity_per_slot}
              onChange={(event) => patch({ reservation_capacity_per_slot: Number(event.target.value) })}
            />
          </Field>
          <Field
            label="Reservation slots"
            htmlFor="settings-slots"
            hint="Comma-separated 24-hour times. Guests choose from these."
            className="sm:col-span-2"
            error={fieldErrors["settings.reservation_slots"]?.[0]}
          >
            <Textarea
              id="settings-slots"
              value={draft.reservation_slots}
              onChange={(event) => patch({ reservation_slots: event.target.value })}
              className="min-h-16 font-mono text-xs"
              placeholder="12:00, 12:30, 18:00"
            />
          </Field>
        </div>
      </section>

      <div className="sticky bottom-0 flex justify-end rounded-2xl border border-border-warm bg-vanilla-0/95 p-3 backdrop-blur">
        <Button type="submit" loading={saving}>
          <Save className="h-4 w-4" /> Save settings
        </Button>
      </div>
    </form>
  );
}
