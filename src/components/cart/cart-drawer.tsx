import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { cartLineUnitPrice, useCart } from "@/providers/cart-provider";
import { useSettings } from "@/providers/settings-provider";
import { formatMoney } from "@/lib/format";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, itemCount, subtotalCents, updateQuantity, removeItem } = useCart();
  const { settings } = useSettings();

  const taxCents = Math.round(subtotalCents * (settings.tax_rate_bps / 10000));
  const serviceCents = Math.round(subtotalCents * (settings.service_fee_bps / 10000));
  const totalCents = subtotalCents + taxCents + serviceCents;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your bag"
      description={itemCount === 1 ? "One creation from the counter." : `${itemCount} creations from the counter.`}
      size="md"
      footer={
        lines.length > 0 ? (
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-600">Estimated total</p>
              <p className="font-display text-xl tabular-nums">{formatMoney(totalCents)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/cart" className={buttonClasses("secondary", "md")} onClick={onClose}>
                View bag
              </Link>
              <Link href="/checkout" className={buttonClasses("primary", "md")} onClick={onClose}>
                Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center">
          <EmptyState
            icon={ShoppingBag}
            title="Your bag is empty"
            description="The counter is open. Pick a flavour, choose a size, and we will take it from there."
            action={
              <Link href="/menu" className={buttonClasses("primary", "md")} onClick={onClose}>
                Browse the menu
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-border-warm">
          {lines.map((line) => {
            const unit = cartLineUnitPrice(line);
            return (
              <li key={line.key} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-vanilla-100">
                  <Image src={line.imageUrl} alt={line.name} fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{line.name}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-600">
                        {[line.variantName, ...line.addOns.map((addOn) => addOn.name)].filter(Boolean).join(" · ") ||
                          "Classic serve"}
                      </p>
                      {line.notes ? <p className="mt-1 truncate text-xs italic text-ink-600">“{line.notes}”</p> : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(unit * line.quantity)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex h-9 items-center rounded-full border border-border-warm bg-vanilla-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.key, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        className="flex h-full w-9 items-center justify-center rounded-l-full text-ink-700 transition hover:bg-vanilla-100 disabled:opacity-40"
                        aria-label={`Decrease ${line.name} quantity`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-semibold tabular-nums">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.key, line.quantity + 1)}
                        className="flex h-full w-9 items-center justify-center rounded-r-full text-ink-700 transition hover:bg-vanilla-100"
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
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
