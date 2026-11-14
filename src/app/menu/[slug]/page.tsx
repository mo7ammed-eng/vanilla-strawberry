"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { PageLoader } from "@/components/ui/spinner";
import { ProductGrid } from "@/components/product/product-grid";
import { api, errorMessage } from "@/lib/api";
import { cn, formatMoney } from "@/lib/format";
import { useCart } from "@/providers/cart-provider";
import { useTableSession } from "@/providers/table-session-provider";
import { useToast } from "@/providers/toast-provider";
import type { AddOn, Product, ProductVariant } from "@/lib/types";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { addItem } = useCart();
  const { toast } = useToast();
  const { session, clearSession } = useTableSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [addOnIds, setAddOnIds] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Product>(`/products/${slug}`);
      setProduct(response.data);
      const activeVariants = response.data.variants.filter((item) => item.is_active);
      setVariant(activeVariants.find((item) => item.is_default) ?? activeVariants[0] ?? null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!product?.category?.slug) return;
    let active = true;
    api
      .get<Product[]>(`/products?category=${encodeURIComponent(product.category.slug)}&per_page=5`)
      .then((response) => {
        if (active) setRelated(response.data.filter((item) => item.id !== product.id).slice(0, 4));
      })
      .catch(() => {
        if (active) setRelated([]);
      });
    return () => {
      active = false;
    };
  }, [product?.category?.slug, product?.id]);

  const activeVariants = useMemo(() => product?.variants.filter((item) => item.is_active) ?? [], [product]);
  const activeAddOns = useMemo(() => product?.add_ons.filter((item) => item.is_active) ?? [], [product]);
  const selectedAddOns = useMemo(
    () => activeAddOns.filter((addOn) => addOnIds.includes(addOn.id)),
    [activeAddOns, addOnIds],
  );

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    return (
      product.price_cents +
      (variant?.price_delta_cents ?? 0) +
      selectedAddOns.reduce((total, addOn) => total + addOn.price_cents, 0)
    );
  }, [product, variant, selectedAddOns]);

  const toggleAddOn = (addOn: AddOn) => {
    setAddOnIds((current) =>
      current.includes(addOn.id) ? current.filter((id) => id !== addOn.id) : [...current, addOn.id],
    );
  };

  const handleAdd = () => {
    if (!product) return;
    addItem({ product, variant, addOns: selectedAddOns, quantity, notes });
    setAdded(true);
    toast(`${quantity} × ${product.name} added to your bag.`, "success");
    window.setTimeout(() => setAdded(false), 4000);
  };

  if (loading) {
    return <PageLoader label="Fetching from the counter" />;
  }

  if (error || !product) {
    return (
      <div className="container-page flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
        <p className="eyebrow">Not on the counter</p>
        <h1 className="mt-4 text-h1">We could not find that flavour.</h1>
        <p className="mt-3 max-w-md text-sm text-ink-600">
          {error ?? "It may have sold out or been retired for the season."}
        </p>
        <Link href="/menu" className={buttonClasses("primary", "md", "mt-7")}>
          Back to the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-ink-600">
        <Link href="/menu" className="transition hover:text-ink-900">
          Menu
        </Link>
        <span aria-hidden>/</span>
        {product.category ? (
          <>
            <Link href={`/menu?category=${product.category.slug}`} className="transition hover:text-ink-900">
              {product.category.name}
            </Link>
            <span aria-hidden>/</span>
          </>
        ) : null}
        <span className="text-ink-900">{product.name}</span>
      </nav>

      {session ? (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-ink-900 px-4 py-3 text-sm text-vanilla-0">
          <p>
            Ordering for <span className="font-semibold">{session.tableName}</span> — sent to the kitchen
            for your table.
          </p>
          <button
            type="button"
            onClick={clearSession}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-vanilla-0/10"
            aria-label="End table session"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-vanilla-100">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 44vw, 92vw"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {product.is_new_arrival ? <Badge tone="ink">New</Badge> : null}
              {product.is_best_seller ? <Badge tone="strawberry">Most loved</Badge> : null}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-vanilla-100 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600">Churned</p>
              <p className="mt-1 text-xs font-semibold">This morning</p>
            </div>
            <div className="rounded-xl bg-vanilla-100 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600">Batch</p>
              <p className="mt-1 text-xs font-semibold">24 litres</p>
            </div>
            <div className="rounded-xl bg-vanilla-100 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600">Serve</p>
              <p className="mt-1 text-xs font-semibold">Best today</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">{product.category?.name ?? "The counter"}</p>
            {product.is_premium ? <Badge tone="warning">Premium</Badge> : null}
          </div>
          <h1 className="mt-3 text-h1">{product.name}</h1>
          <p className="mt-3 text-base text-ink-600">{product.short_description}</p>
          <p className="mt-5 font-display text-3xl">{formatMoney(unitPrice)}</p>

          <p className="mt-5 border-t border-border-warm pt-5 text-sm leading-relaxed text-ink-600">
            {product.description}
          </p>

          {activeVariants.length > 0 ? (
            <fieldset className="mt-7">
              <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">
                Choose a size
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {activeVariants.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition",
                      variant?.id === item.id
                        ? "border-strawberry-500 bg-strawberry-50"
                        : "border-border-warm bg-vanilla-0 hover:border-ink-900/25",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="variant"
                        value={item.id}
                        checked={variant?.id === item.id}
                        onChange={() => setVariant(item)}
                        className="h-3.5 w-3.5 accent-strawberry-500"
                      />
                      <span className="font-medium">{item.name}</span>
                    </span>
                    <span className="text-xs text-ink-600">
                      {item.price_delta_cents === 0
                        ? "Included"
                        : `${item.price_delta_cents > 0 ? "+" : "−"}${formatMoney(Math.abs(item.price_delta_cents))}`}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {activeAddOns.length > 0 ? (
            <fieldset className="mt-7">
              <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">
                Add a little extra
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {activeAddOns.map((addOn) => {
                  const checked = addOnIds.includes(addOn.id);
                  return (
                    <label
                      key={addOn.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition",
                        checked
                          ? "border-strawberry-500 bg-strawberry-50"
                          : "border-border-warm bg-vanilla-0 hover:border-ink-900/25",
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddOn(addOn)}
                          className="h-3.5 w-3.5 accent-strawberry-500"
                        />
                        <span className="font-medium">{addOn.name}</span>
                      </span>
                      <span className="text-xs text-ink-600">+{formatMoney(addOn.price_cents)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <div className="mt-7 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">Quantity</p>
              <div className="mt-2 inline-flex h-11 items-center rounded-full border border-border-warm bg-vanilla-0">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="flex h-full w-11 items-center justify-center rounded-l-full text-ink-700 transition hover:bg-vanilla-100 disabled:opacity-40"
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(20, value + 1))}
                  className="flex h-full w-11 items-center justify-center rounded-r-full text-ink-700 transition hover:bg-vanilla-100 disabled:opacity-40"
                  disabled={quantity >= 20}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <Field label="Notes for the kitchen" htmlFor="notes" hint="Allergies, sweetness, or a special occasion.">
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value.slice(0, 200))}
                placeholder="Optional"
                className="min-h-20"
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" size="lg" onClick={handleAdd} className="sm:min-w-52">
              {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {added ? "Added to bag" : `Add to bag — ${formatMoney(unitPrice * quantity)}`}
            </Button>
            {added ? (
              <Link href="/cart" className="inline-flex h-13 items-center justify-center gap-1.5 rounded-full border border-border-warm px-5 text-sm font-semibold transition hover:bg-vanilla-100">
                View bag
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          <div className="mt-8 divide-y divide-border-warm border-y border-border-warm">
            <details className="group py-3" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                Ingredients
                <Plus className="h-4 w-4 text-ink-600 transition group-open:rotate-45" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {product.ingredients ?? "Full ingredient details are available from our team on request."}
              </p>
            </details>
            <details className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold">
                Allergens
                <Plus className="h-4 w-4 text-ink-600 transition group-open:rotate-45" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {product.allergens ?? "Ask our team about allergens before ordering."}
              </p>
            </details>
          </div>

          <Link href="/menu" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700 hover:text-ink-900">
            <ArrowLeft className="h-4 w-4" />
            Back to the menu
          </Link>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20 border-t border-border-warm pt-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-h2">More from {product.category?.name ?? "the counter"}</h2>
            <Link href="/menu" className="text-sm font-semibold text-strawberry-700 hover:underline">
              See all
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
