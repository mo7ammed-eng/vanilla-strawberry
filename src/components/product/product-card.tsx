"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/providers/toast-provider";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const needsChoices = product.variants.length > 0 || product.add_ons.length > 0;

  const quickAdd = () => {
    addItem({ product, variant: null, addOns: [], quantity: 1 });
    toast(`${product.name} added to your bag.`, "success");
  };

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-vanilla-100">
        <Link href={`/menu/${product.slug}`} aria-label={`View ${product.name}`} className="relative block h-full">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {product.is_new_arrival ? <Badge tone="ink">New</Badge> : null}
            {product.is_best_seller ? <Badge tone="strawberry">Most loved</Badge> : null}
          </div>
          {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents ? (
            <Badge tone="neutral" className="bg-vanilla-0/90">
              Save {formatMoney(product.compare_at_price_cents - product.price_cents)}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[1.05rem] leading-snug">
            <Link href={`/menu/${product.slug}`} className="transition hover:text-strawberry-600">
              {product.name}
            </Link>
          </h3>
          <p className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums">{formatMoney(product.price_cents)}</p>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-600">{product.short_description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600/80">
            {product.category?.name ?? "The counter"}
          </span>
          {needsChoices ? (
            <Link
              href={`/menu/${product.slug}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-900/15 px-3.5 text-xs font-semibold transition hover:border-ink-900/35 hover:bg-vanilla-100"
            >
              Choose
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={quickAdd}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-900 px-3.5 text-xs font-semibold text-vanilla-0 transition hover:bg-strawberry-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
