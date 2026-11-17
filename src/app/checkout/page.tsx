"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CreditCard, MapPin, Store, Truck, X } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { PageLoader } from "@/components/ui/spinner";
import { ApiError, api, errorMessage } from "@/lib/api";
import { cn, formatMoney } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { useCart } from "@/providers/cart-provider";
import { useSettings } from "@/providers/settings-provider";
import { useTableSession } from "@/providers/table-session-provider";
import { useToast } from "@/providers/toast-provider";
import type { Address, Coupon, Order } from "@/lib/types";

type Fulfillment = "delivery" | "pickup";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { lines, hydrated, subtotalCents, clearCart } = useCart();
  const { settings } = useSettings();
  const { session, clearSession } = useTableSession();
  const { toast } = useToast();

  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (user) {
      setName((value) => value || user.name);
      setEmail((value) => value || user.email);
      setPhone((value) => value || (user.phone ?? ""));
      api
        .get<Address[]>("/account/addresses")
        .then((response) => {
          setAddresses(response.data);
          const preferred = response.data.find((address) => address.is_default);
          if (preferred) {
            setPhone((value) => value || (preferred.phone ?? ""));
          }
        })
        .catch(() => setAddresses([]));
    }
  }, [user]);

  const discountCents = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.discount_type === "percentage") {
      return Math.round((subtotalCents * coupon.value) / 10000);
    }
    return Math.min(coupon.value, subtotalCents);
  }, [coupon, subtotalCents]);

  const taxCents = useMemo(
    () => Math.round(Math.max(0, subtotalCents - discountCents) * (settings.tax_rate_bps / 10000)),
    [subtotalCents, discountCents, settings.tax_rate_bps],
  );
  const serviceCents = useMemo(
    () => Math.round(subtotalCents * (settings.service_fee_bps / 10000)),
    [subtotalCents, settings.service_fee_bps],
  );
  const deliveryCents = useMemo(() => {
    if (session || fulfillment !== "delivery") return 0;
    if (settings.free_delivery_threshold_cents > 0 && subtotalCents >= settings.free_delivery_threshold_cents) {
      return 0;
    }
    return settings.delivery_fee_cents;
  }, [session, fulfillment, settings, subtotalCents]);
  const totalCents = subtotalCents + taxCents + serviceCents + deliveryCents - discountCents;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const response = await api.post<Coupon>("/coupons/validate", { code });
      if (subtotalCents < response.data.min_order_cents) {
        setCouponError(`This coupon needs a minimum order of ${formatMoney(response.data.min_order_cents)}.`);
        return;
      }
      setCoupon(response.data);
      setCouponInput(response.data.code);
      toast(`${response.data.code} applied — ${response.data.display_value} off.`, "success");
    } catch (err) {
      setCouponError(errorMessage(err));
    } finally {
      setCouponLoading(false);
    }
  };

  const chooseAddress = (value: string) => {
    const address = addresses.find((item) => String(item.id) === value);
    if (!address) return;
    setLine1(address.line1);
    setLine2(address.line2 ?? "");
    setCity(address.city);
    setPostalCode(address.postal_code);
    setPhone(address.phone ?? phone);
  };

  const fieldError = (key: string) => fieldErrors[key]?.[0];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    const selectedFulfillment = session ? "dine_in" : fulfillment;

    try {
      const response = await api.post<Order>("/orders", {
        items: lines.map((line) => ({
          product_id: line.productId,
          variant_id: line.variantId,
          quantity: line.quantity,
          add_on_ids: line.addOns.map((addOn) => addOn.id),
          notes: line.notes || null,
        })),
        fulfillment_type: selectedFulfillment,
        customer_name: name.trim(),
        customer_email: email.trim() || null,
        customer_phone: phone.trim() || null,
        delivery_address_line1: !session && fulfillment === "delivery" ? line1.trim() : null,
        delivery_address_line2: !session && fulfillment === "delivery" ? line2.trim() || null : null,
        delivery_city: !session && fulfillment === "delivery" ? city.trim() : null,
        delivery_postal_code: !session && fulfillment === "delivery" ? postalCode.trim() : null,
        table_session_token: session?.sessionToken ?? null,
        coupon_code: coupon?.code ?? null,
        notes: notes.trim() || null,
        payment_method: !session && fulfillment === "delivery" ? "pay_on_delivery" : "pay_on_collection",
      });

      const order = response.data;
      if (order.guest_token) {
        window.localStorage.setItem(`vs_guest_token_${order.order_number}`, order.guest_token);
      }
      clearCart();
      toast("Order placed. The kitchen has it.", "success");
      setSubmitting(false);
      router.push(`/order/${order.order_number}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors);
        setError(err.message);
      } else {
        setError(errorMessage(err));
      }
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return <PageLoader label="Preparing checkout" />;
  }

  if (lines.length === 0 && !submitting) {
    return (
      <div className="container-page py-16 sm:py-24">
        <EmptyState
          icon={Store}
          title="Nothing to check out yet"
          description="Add a scoop or two to your bag, then come back to finish the order."
          action={
            <Link href="/menu" className={buttonClasses("primary", "md")}>
              Browse the menu
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-3 text-h1">Almost at the table.</h1>
        <p className="mt-3 text-sm text-ink-600">
          {user
            ? `Signed in as ${user.email}. We will keep this order in your history.`
            : "Checking out as a guest. Keep this browser open to follow your order, or sign in first to save it."}
        </p>
        {!user ? (
          <p className="mt-2 text-sm">
            <Link href="/login?next=/checkout" className="font-semibold text-strawberry-700 hover:underline">
              Sign in for faster checkout
            </Link>
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="mt-6">
          <FormError message={error} />
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16" noValidate>
        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-xl">How should we serve you?</h2>
              {session ? (
                <button
                  type="button"
                  onClick={clearSession}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-600 hover:text-danger"
                >
                  <X className="h-3 w-3" />
                  End table session
                </button>
              ) : null}
            </div>

            {session ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-strawberry-100 bg-strawberry-50 px-4 py-4">
                <Store className="mt-0.5 h-5 w-5 text-strawberry-600" />
                <div>
                  <p className="text-sm font-semibold">Dine-in at {session.tableName}</p>
                  <p className="mt-0.5 text-xs text-ink-600">
                    {session.zone ? `${session.zone} · ` : ""}Your order goes straight to the kitchen. Pay at the
                    table when you are finished.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { value: "pickup" as const, title: "Pickup", note: "Ready at the counter", icon: Store },
                  { value: "delivery" as const, title: "Delivery", note: "Within our neighbourhood", icon: Truck },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-4 transition",
                      fulfillment === option.value
                        ? "border-strawberry-500 bg-strawberry-50"
                        : "border-border-warm bg-vanilla-0 hover:border-ink-900/25",
                    )}
                  >
                    <input
                      type="radio"
                      name="fulfillment"
                      value={option.value}
                      checked={fulfillment === option.value}
                      onChange={() => setFulfillment(option.value)}
                      className="mt-1 h-3.5 w-3.5 accent-strawberry-500"
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <option.icon className="h-4 w-4 text-strawberry-600" />
                        {option.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-600">{option.note}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl">Your details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name" required error={fieldError("customer_name")}>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </Field>
              <Field label="Phone" htmlFor="phone" error={fieldError("customer_phone")}>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="For order updates"
                />
              </Field>
              <Field label="Email" htmlFor="email" error={fieldError("customer_email")} className="sm:col-span-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="Optional — for a digital receipt"
                />
              </Field>
            </div>
          </section>

          {!session && fulfillment === "delivery" ? (
            <section>
              <h2 className="text-xl">Delivery address</h2>
              {addresses.length > 0 ? (
                <div className="mt-4">
                  <Field label="Saved address" htmlFor="saved-address">
                    <Select
                      id="saved-address"
                      defaultValue=""
                      onChange={(event) => chooseAddress(event.target.value)}
                    >
                      <option value="">Enter a new address</option>
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.label} — {address.line1}, {address.city}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              ) : null}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Street address" htmlFor="line1" required error={fieldError("delivery_address_line1")} className="sm:col-span-2">
                  <Input
                    id="line1"
                    value={line1}
                    onChange={(event) => setLine1(event.target.value)}
                    autoComplete="address-line1"
                    required
                  />
                </Field>
                <Field label="Apartment, suite, etc." htmlFor="line2" error={fieldError("delivery_address_line2")} className="sm:col-span-2">
                  <Input
                    id="line2"
                    value={line2}
                    onChange={(event) => setLine2(event.target.value)}
                    autoComplete="address-line2"
                    placeholder="Optional"
                  />
                </Field>
                <Field label="City" htmlFor="city" required error={fieldError("delivery_city")}>
                  <Input
                    id="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    autoComplete="address-level2"
                    required
                  />
                </Field>
                <Field label="Postal code" htmlFor="postal" required error={fieldError("delivery_postal_code")}>
                  <Input
                    id="postal"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                    autoComplete="postal-code"
                    required
                  />
                </Field>
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs text-ink-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-strawberry-600" />
                We deliver within our Brooklyn neighbourhood. If you are outside the radius, the kitchen will call
                you.
              </p>
            </section>
          ) : null}

          <section>
            <h2 className="text-xl">Notes & payment</h2>
            <div className="mt-4 space-y-4">
              <Field label="Notes for the kitchen" htmlFor="order-notes" error={fieldError("notes")}>
                <Textarea
                  id="order-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value.slice(0, 500))}
                  placeholder="Allergies, buzzer name, or a note for the chef"
                />
              </Field>
              <div className="flex items-start gap-3 rounded-xl border border-border-warm bg-vanilla-100 px-4 py-3">
                <CreditCard className="mt-0.5 h-4 w-4 text-strawberry-600" />
                <div>
                  <p className="text-sm font-semibold">
                    {!session && fulfillment === "delivery" ? "Pay on delivery" : "Pay on collection"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-600">
                    Card or cash is collected in person. No payment is taken online.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-border-warm bg-vanilla-0 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Your order</h2>
          <ul className="mt-4 divide-y divide-border-warm">
            {lines.map((line) => (
              <li key={line.key} className="flex justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {line.quantity} × {line.name}
                  </span>
                  <span className="block truncate text-xs text-ink-600">
                    {[line.variantName, ...line.addOns.map((addOn) => addOn.name)].filter(Boolean).join(" · ") ||
                      "Classic serve"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatMoney(
                    (line.basePriceCents +
                      line.variantDeltaCents +
                      line.addOns.reduce((total, addOn) => total + addOn.price_cents, 0)) *
                      line.quantity,
                  )}
                </span>
              </li>
            ))}
          </ul>

          {settings.coupons_enabled ? (
            <div className="mt-5 border-t border-border-warm pt-5">
              {coupon ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-success/10 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-success">
                    <Check className="h-4 w-4" />
                    {coupon.code} · {coupon.display_value} off
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCoupon(null);
                      setCouponInput("");
                    }}
                    className="text-ink-600 hover:text-danger"
                    aria-label="Remove coupon"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      aria-label="Coupon code"
                      className="h-10"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={applyCoupon}
                      loading={couponLoading}
                      disabled={!couponInput.trim()}
                      className="shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError ? <p className="mt-1.5 text-xs text-danger">{couponError}</p> : null}
                </div>
              )}
            </div>
          ) : null}

          <dl className="mt-5 space-y-2.5 border-t border-border-warm pt-5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(subtotalCents)}</dd>
            </div>
            {discountCents > 0 ? (
              <div className="flex justify-between gap-3 text-success">
                <dt>Discount</dt>
                <dd className="tabular-nums">−{formatMoney(discountCents)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="text-ink-600">Tax</dt>
              <dd className="tabular-nums">{formatMoney(taxCents)}</dd>
            </div>
            {serviceCents > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Service fee</dt>
                <dd className="tabular-nums">{formatMoney(serviceCents)}</dd>
              </div>
            ) : null}
            {!session ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Delivery</dt>
                <dd className="tabular-nums">
                  {fulfillment === "delivery" ? (deliveryCents === 0 ? "Free" : formatMoney(deliveryCents)) : "—"}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 border-t border-border-warm pt-3 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-xl tabular-nums">{formatMoney(totalCents)}</dd>
            </div>
          </dl>

          <Button type="submit" size="lg" loading={submitting} className="mt-5 w-full">
            Place order
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-600">
            Final totals are calculated on the server. By placing the order you agree to pay in person.
          </p>
        </aside>
      </form>
    </div>
  );
}
