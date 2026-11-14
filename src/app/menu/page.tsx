"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { CardSkeleton } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/format";
import { useTableSession } from "@/providers/table-session-provider";
import type { Category, Product } from "@/lib/types";

const collections = [
  { value: "all", label: "Everything" },
  { value: "new", label: "New arrivals" },
  { value: "best", label: "Most loved" },
  { value: "budget", label: "Everyday" },
  { value: "premium", label: "Premium" },
];

function MenuBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, clearSession } = useTableSession();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [collection, setCollection] = useState(searchParams.get("collection") ?? "all");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "recommended");
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (collection !== "all") params.set("collection", collection);
    if (sort !== "recommended") params.set("sort", sort);
    if (search) params.set("search", search);
    params.set("per_page", "48");

    try {
      const response = await api.get<Product[]>(`/products?${params.toString()}`);
      setProducts(response.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [category, collection, sort, search]);

  useEffect(() => {
    api
      .get<Category[]>("/categories")
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (collection !== "all") params.set("collection", collection);
    if (sort !== "recommended") params.set("sort", sort);
    if (search) params.set("search", search);
    const next = params.toString();
    router.replace(next ? `/menu?${next}` : "/menu", { scroll: false });
  }, [category, collection, sort, search, router]);

  const activeFilters = useMemo(
    () => (category !== "all" ? 1 : 0) + (collection !== "all" ? 1 : 0) + (search ? 1 : 0),
    [category, collection, search],
  );

  const resetFilters = () => {
    setCategory("all");
    setCollection("all");
    setSort("recommended");
    setSearch("");
    setSearchInput("");
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">The counter</p>
        <h1 className="mt-4 text-h1">Every scoop, sorbet and sundae.</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
          Our menu shifts with the fruit. Choose a family, follow your mood, or simply start with
          what is new this week.
        </p>
      </div>

      {session ? (
        <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-ink-900 px-5 py-4 text-vanilla-0 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-semibold">Ordering for {session.tableName}</span>
            {session.zone ? <span className="text-vanilla-0/65"> · {session.zone}</span> : null}
            <span className="block text-xs text-vanilla-0/65">
              Anything you add will be sent to the kitchen for your table.
            </span>
          </p>
          <button
            type="button"
            onClick={clearSession}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-vanilla-0/25 px-4 text-xs font-semibold text-vanilla-0 transition hover:bg-vanilla-0/10"
          >
            <X className="h-3.5 w-3.5" />
            End table session
          </button>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 border-y border-border-warm py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition",
              category === "all"
                ? "border-ink-900 bg-ink-900 text-vanilla-0"
                : "border-border-warm bg-vanilla-0 text-ink-700 hover:border-ink-900/30",
            )}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.slug)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition",
                category === item.slug
                  ? "border-ink-900 bg-ink-900 text-vanilla-0"
                  : "border-border-warm bg-vanilla-0 text-ink-700 hover:border-ink-900/30",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="relative"
            role="search"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search flavours"
              aria-label="Search flavours"
              className="h-10 w-full rounded-full pl-10 pr-9 sm:w-56"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 hover:text-ink-900"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </form>
          <label className="flex items-center gap-2 text-xs text-ink-600">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="sr-only">Sort products</span>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 w-auto rounded-full py-0 pr-8 text-xs"
            >
              <option value="recommended">Recommended</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="newest">Newest</option>
            </Select>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {collections.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setCollection(item.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition",
              collection === item.value
                ? "bg-strawberry-100 text-strawberry-700"
                : "bg-vanilla-100 text-ink-600 hover:bg-vanilla-200/60 hover:text-ink-900",
            )}
          >
            {item.label}
          </button>
        ))}
        {activeFilters > 0 ? (
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-strawberry-700 hover:underline"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">
          {loading ? "Loading" : `${products.length} ${products.length === 1 ? "creation" : "creations"}`}
        </p>
        <p className="hidden items-center gap-1.5 text-xs text-ink-600 sm:flex">
          <Sparkles className="h-3.5 w-3.5 text-strawberry-500" />
          Made fresh this morning
        </p>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-danger/20 bg-strawberry-50 px-5 py-6">
            <p className="text-sm text-danger">{error}</p>
            <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={loadProducts}>
              Try again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nothing matches that yet"
            description="Try another flavour, category, or clear the filters to see everything on the counter."
            action={
              <Button type="button" variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>

      <div className="mt-16 flex flex-col items-start justify-between gap-4 rounded-2xl bg-vanilla-100 px-6 py-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-display text-lg">Ordering for a table?</p>
          <p className="mt-1 text-sm text-ink-600">Scan the QR code on your table to send this straight to the kitchen.</p>
        </div>
        <Link href="/reservations" className="text-sm font-semibold text-strawberry-700 hover:underline">
          Book ahead instead
        </Link>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-14">
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        </div>
      }
    >
      <MenuBrowser />
    </Suspense>
  );
}
