"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoader } from "@/components/ui/spinner";
import { cartLineUnitPrice, useCart } from "@/providers/cart-provider";
import { useSettings } from "@/providers/settings-provider";
import { useTableSession } from "@/providers/table-session-provider";
import { formatMoney } from "@/lib/format";

export default function CartPage() {
  const { lines, hydrated, itemCount, subtotalCents, updateQuantity, removeItem, clearCart } = useCart();
  const { settings } = useSettings();
  const { session, clearSession } = useTableSession();

  if (!hydrated) {
    return <PageLoader label="Opening your bag" />;
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-16 sm:py-24">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="The counter is open. Pick a flavour, choose a size, and we will take it from there."
          action={
            <Link href="/menu" className={buttonClasses("primary", "md")}>
              Browse the menu
            </Link>
          }
        />
      </div>
    );
  }

  const taxCents = Math.round(subtotalCents * (settings.tax_rate_bps / 10000));
  const serviceCents = Math.round(subtotalCents * (settings.service_fee_bps / 10000));

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your bag</p>
          <h1 className="mt-3 text-h1">
            {itemCount} {itemCount === 1 ? "creation" : "creations"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Remove everything from your bag?")) clearCart();
          }}
          className="text-xs font-semibold text-ink-600 transition hover:text-danger"
        >
          Clear bag
        </button>
      </div>

      {session ? (
        <div className="mt-6 flex flex-col gap-3 rounded-xl bg-ink-900 px-4 py-3 text-sm text-vanilla-0 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Ordering for <span className="font-semibold">{session.tableName}</span>
            {session.zone ? ` · ${session.zone}` : ""} — dine-in service.
          </p>
          <button
            type="button"
            onClick={clearSession}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-vanilla-0/80 hover:text-vanilla-0"
          >
            <X className="h-3.5 w-3.5" />
            End table session
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16">
        <div className="divide-y divide-border-warm border-y border-border-warm">
          {lines.map((line) => {
            const unit = cartLineUnitPrice(line);
            return (
              <article key={line.key} className="flex gap-4 py-5 sm:gap-6">
                <Link href={`/menu/${line.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-vanilla-100 sm:h-28 sm:w-28">
                  <Image src={line.imageUrl} alt={line.name} fill sizes="112px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">
                        <Link href={`/menu/${line.slug}`} className="hover:text-strawberry-600">
                          {line.name}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-xs text-ink-600">
                        {[line.variantName, ...line.addOns.map((addOn) => addOn.name)].filter(Boolean).join(" · ") ||
                          "Classic serve"}
                      </p>
                      {line.notes ? <p className="mt-1 text-xs italic text-ink-600">“{line.notes}”</p> : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(unit * line.quantity)}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <div className="inline-flex h-9 items-center rounded-full border border-border-warm bg-vanilla-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.key, line.quantity - 1)}
                        className="flex h-full w-9 items-center justify-center rounded-l-full transition hover:bg-vanilla-100"
                        aria-label={`Decrease ${line.name} quantity`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.key, line.quantity + 1)}
                        className="flex h-full w-9 items-center justify-center rounded-r-full transition hover:bg-vanilla-100"
                        aria-label={`Increase ${line.name} quantity`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.key)}
                      className="inline-flex items-center gap-1.5 text-xs text-ink-600 transition hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="h-fit rounded-2xl border border-border-warm bg-vanilla-0 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-600">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatMoney(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-600">Estimated tax</dt>
              <dd className="font-medium tabular-nums">{formatMoney(taxCents)}</dd>
            </div>
            {serviceCents > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-600">Service fee</dt>
                <dd className="font-medium tabular-nums">{formatMoney(serviceCents)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 text-xs text-ink-600">
              <dt>{session ? "Dine-in" : "Delivery / pickup"}</dt>
              <dd>Calculated at checkout</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border-warm pt-3 text-base">
              <dt className="font-semibold">Estimated total</dt>
              <dd className="font-display text-xl tabular-nums">{formatMoney(subtotalCents + taxCents + serviceCents)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className={buttonClasses("primary", "lg", "mt-6 w-full")}>
            Continue to checkout
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-center text-xs leading-relaxed text-ink-600">
            Coupons and final totals are confirmed at checkout. Payment is collected in person.
          </p>
          <Link href="/menu" className="mt-4 block text-center text-xs font-semibold text-ink-700 hover:text-strawberry-600">
            Add something else
          </Link>
        </aside>
      </div>
    </div>
  );
}
