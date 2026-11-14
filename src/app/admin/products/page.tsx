"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminThumb } from "@/components/admin/admin-thumb";
import { CentsInput } from "@/components/admin/cents-input";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Pagination } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton } from "@/components/ui/spinner";
import { useToast } from "@/providers/toast-provider";
import { ApiError, api, errorMessage } from "@/lib/api";
import { cn, formatMoney, slugify } from "@/lib/format";
import type { AddOn, Category, PaginationMeta, Product } from "@/lib/types";

interface VariantDraft {
  id?: number;
  name: string;
  price_delta_cents: number;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

interface ProductDraft {
  category_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  ingredients: string;
  allergens: string;
  image_url: string;
  price_cents: number;
  compare_at_price_cents: number;
  is_active: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_budget: boolean;
  is_premium: boolean;
  is_featured: boolean;
  sort_order: number;
  variants: VariantDraft[];
  add_on_ids: number[];
}

function emptyDraft(categoryId = ""): ProductDraft {
  return {
    category_id: categoryId,
    name: "",
    slug: "",
    short_description: "",
    description: "",
    ingredients: "",
    allergens: "",
    image_url: "/images/strawberry-cloud.jpg",
    price_cents: 0,
    compare_at_price_cents: 0,
    is_active: true,
    is_new_arrival: false,
    is_best_seller: false,
    is_budget: false,
    is_premium: false,
    is_featured: false,
    sort_order: 0,
    variants: [{ name: "Classic", price_delta_cents: 0, is_default: true, is_active: true, sort_order: 0 }],
    add_on_ids: [],
  };
}

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [archiving, setArchiving] = useState(false);

  const loadLookups = useCallback(async () => {
    try {
      const [categoryResponse, addOnResponse] = await Promise.all([
        api.get<Category[]>("/admin/categories"),
        api.get<AddOn[]>("/admin/add-ons"),
      ]);
      setCategories(categoryResponse.data);
      setAddOns(addOnResponse.data);
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), per_page: "24" });
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category_id", categoryFilter);
    if (activeFilter) params.set("active", activeFilter);

    try {
      const response = await api.get<Product[]>(`/admin/products?${params.toString()}`);
      setProducts(response.data);
      setMeta(response.meta ?? null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, activeFilter]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDraft(emptyDraft(categories[0] ? String(categories[0].id) : ""));
    setFormError(null);
    setFieldErrors({});
  }

  function openEdit(product: Product) {
    setEditing(product);
    setDraft({
      category_id: String(product.category_id),
      name: product.name,
      slug: product.slug,
      short_description: product.short_description,
      description: product.description,
      ingredients: product.ingredients ?? "",
      allergens: product.allergens ?? "",
      image_url: product.image_url,
      price_cents: product.price_cents,
      compare_at_price_cents: product.compare_at_price_cents ?? 0,
      is_active: product.is_active,
      is_new_arrival: product.is_new_arrival,
      is_best_seller: product.is_best_seller,
      is_budget: product.is_budget,
      is_premium: product.is_premium,
      is_featured: product.is_featured,
      sort_order: product.sort_order,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        price_delta_cents: variant.price_delta_cents,
        is_default: variant.is_default,
        is_active: variant.is_active,
        sort_order: variant.sort_order,
      })),
      add_on_ids: product.add_ons.map((addOn) => addOn.id),
    });
    setFormError(null);
    setFieldErrors({});
  }

  function patchDraft(patch: Partial<ProductDraft>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function patchVariant(index: number, patch: Partial<VariantDraft>) {
    setDraft((current) => {
      if (!current) return current;
      const variants = current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      );
      if (patch.is_default) {
        return {
          ...current,
          variants: variants.map((variant, variantIndex) => ({
            ...variant,
            is_default: variantIndex === index,
          })),
        };
      }
      return { ...current, variants };
    });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setFormError(null);
    setFieldErrors({});

    const payload = {
      category_id: Number(draft.category_id),
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      short_description: draft.short_description.trim(),
      description: draft.description.trim(),
      ingredients: draft.ingredients.trim() || null,
      allergens: draft.allergens.trim() || null,
      image_url: draft.image_url.trim(),
      price_cents: draft.price_cents,
      compare_at_price_cents: draft.compare_at_price_cents > 0 ? draft.compare_at_price_cents : null,
      is_active: draft.is_active,
      is_new_arrival: draft.is_new_arrival,
      is_best_seller: draft.is_best_seller,
      is_budget: draft.is_budget,
      is_premium: draft.is_premium,
      is_featured: draft.is_featured,
      sort_order: draft.sort_order,
      variants: draft.variants.map((variant, index) => ({
        ...(variant.id ? { id: variant.id } : {}),
        name: variant.name.trim(),
        price_delta_cents: variant.price_delta_cents,
        is_default: variant.is_default,
        is_active: variant.is_active,
        sort_order: index,
      })),
      add_on_ids: draft.add_on_ids,
    };

    try {
      if (editing) {
        await api.patch<Product>(`/admin/products/${editing.id}`, payload);
        toast("Product updated.", "success");
      } else {
        await api.post<Product>("/admin/products", payload);
        toast("Product created.", "success");
      }
      setDraft(null);
      setEditing(null);
      void load();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.errors);
        setFormError(err.message);
        const first = Object.values(err.errors)[0]?.[0];
        if (first) setFormError(first);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await api.delete(`/admin/products/${archiveTarget.id}`);
      toast(`${archiveTarget.name} archived.`, "success");
      setArchiveTarget(null);
      void load();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setArchiving(false);
    }
  }

  const activeFilters = Boolean(search || categoryFilter || activeFilter);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Menu"
        title="Products"
        description="Scoops, desserts, and drinks. Archive an item to hide it without touching past orders."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New product
          </Button>
        }
      />

      <form
        className="grid gap-2 rounded-2xl border border-border-warm bg-vanilla-0 p-3 sm:grid-cols-2 xl:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          <Input
            aria-label="Search products"
            placeholder="Search product names"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select aria-label="Filter by category" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </Select>
        <Select aria-label="Filter by visibility" value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1); }}>
          <option value="">All visibility</option>
          <option value="1">Active</option>
          <option value="0">Archived</option>
        </Select>
        <div className="flex gap-2">
          <Button type="submit" size="sm">Search</Button>
          {activeFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => {
              setSearch("");
              setSearchInput("");
              setCategoryFilter("");
              setActiveFilter("");
              setPage(1);
            }}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          ) : null}
        </div>
      </form>

      {error ? <p className="rounded-xl border border-danger/20 bg-strawberry-50 px-4 py-3 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <CardSkeleton />
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-border-warm bg-vanilla-0 px-5 py-12 text-center">
          <p className="font-medium">No products found.</p>
          <p className="mt-1 text-sm text-ink-600">Create your first product or clear the filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border-warm bg-vanilla-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-vanilla-50 text-[10px] uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Sizes</th>
                  <th className="px-4 py-3 font-semibold">Tags</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-vanilla-50/70">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AdminThumb src={product.image_url} alt={product.name} />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-[11px] text-ink-600">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{product.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(product.price_cents)}</td>
                    <td className="px-4 py-3 text-ink-600">{product.variants.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {product.is_featured ? <Badge tone="strawberry">Featured</Badge> : null}
                        {product.is_new_arrival ? <Badge tone="neutral">New</Badge> : null}
                        {product.is_best_seller ? <Badge tone="neutral">Best</Badge> : null}
                        {!product.is_featured && !product.is_new_arrival && !product.is_best_seller ? (
                          <span className="text-[11px] text-ink-600">—</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={product.is_active ? "success" : "neutral"}>{product.is_active ? "Active" : "Archived"}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(product)}>Edit</Button>
                        {product.is_active ? (
                          <Button size="sm" variant="ghost" onClick={() => setArchiveTarget(product)} aria-label={`Archive ${product.name}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta ? (
            <div className="px-4 pb-4">
              <Pagination page={meta.current_page} lastPage={meta.last_page} total={meta.total} onPage={setPage} busy={loading} />
            </div>
          ) : null}
        </div>
      )}

      <Modal
        open={draft !== null}
        onClose={() => {
          setDraft(null);
          setEditing(null);
        }}
        title={editing ? `Edit ${editing.name}` : "New product"}
        description="Prices are in dollars. Sizes add or subtract from the base price."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setDraft(null); setEditing(null); }}>Cancel</Button>
            <Button type="submit" form="product-form" loading={saving}>{editing ? "Save changes" : "Create product"}</Button>
          </>
        }
      >
        {draft ? (
          <form
            id="product-form"
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <FormError message={formError} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="product-name" required error={fieldErrors.name?.[0]}>
                <Input
                  id="product-name"
                  value={draft.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    patchDraft({
                      name,
                      ...(editing || draft.slug === slugify(draft.name) ? { slug: slugify(name) } : {}),
                    });
                  }}
                  required
                />
              </Field>
              <Field label="Slug" htmlFor="product-slug" required error={fieldErrors.slug?.[0]} hint="Used in the product URL.">
                <Input id="product-slug" value={draft.slug} onChange={(event) => patchDraft({ slug: event.target.value })} required />
              </Field>
              <Field label="Category" htmlFor="product-category" required error={fieldErrors.category_id?.[0]}>
                <Select id="product-category" value={draft.category_id} onChange={(event) => patchDraft({ category_id: event.target.value })} required>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Sort order" htmlFor="product-sort" hint="Lower numbers appear first.">
                <Input
                  id="product-sort"
                  type="number"
                  min={0}
                  value={draft.sort_order}
                  onChange={(event) => patchDraft({ sort_order: Number(event.target.value) })}
                />
              </Field>
              <Field label="Base price" htmlFor="product-price" required error={fieldErrors.price_cents?.[0]}>
                <CentsInput id="product-price" value={draft.price_cents} onChange={(cents) => patchDraft({ price_cents: cents })} />
              </Field>
              <Field label="Compare-at price" htmlFor="product-compare" hint="Optional original price for a sale badge.">
                <CentsInput id="product-compare" value={draft.compare_at_price_cents} onChange={(cents) => patchDraft({ compare_at_price_cents: cents })} />
              </Field>
            </div>

            <Field label="Image URL" htmlFor="product-image" required error={fieldErrors.image_url?.[0]}>
              <Input id="product-image" value={draft.image_url} onChange={(event) => patchDraft({ image_url: event.target.value })} required />
            </Field>
            <div className="flex items-center gap-3 rounded-xl border border-border-warm bg-vanilla-50 p-3">
              <AdminThumb src={draft.image_url || null} alt="Product image preview" className="h-16 w-16" />
              <p className="text-xs text-ink-600">Use a local `/images/...` path or a hosted image URL.</p>
            </div>

            <Field label="Short description" htmlFor="product-short" required error={fieldErrors.short_description?.[0]}>
              <Input
                id="product-short"
                value={draft.short_description}
                onChange={(event) => patchDraft({ short_description: event.target.value })}
                maxLength={280}
                required
              />
            </Field>
            <Field label="Full description" htmlFor="product-description" required error={fieldErrors.description?.[0]}>
              <Textarea
                id="product-description"
                value={draft.description}
                onChange={(event) => patchDraft({ description: event.target.value })}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ingredients" htmlFor="product-ingredients">
                <Textarea
                  id="product-ingredients"
                  value={draft.ingredients}
                  onChange={(event) => patchDraft({ ingredients: event.target.value })}
                  className="min-h-20"
                />
              </Field>
              <Field label="Allergens" htmlFor="product-allergens">
                <Textarea
                  id="product-allergens"
                  value={draft.allergens}
                  onChange={(event) => patchDraft({ allergens: event.target.value })}
                  className="min-h-20"
                />
              </Field>
            </div>

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">Highlights</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {([
                  ["is_active", "Visible on the menu"],
                  ["is_featured", "Featured"],
                  ["is_new_arrival", "New arrival"],
                  ["is_best_seller", "Best seller"],
                  ["is_budget", "Everyday"],
                  ["is_premium", "Premium"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft[key]}
                      onChange={(event) => patchDraft({ [key]: event.target.checked })}
                      className="h-4 w-4 rounded border-border-warm accent-strawberry-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <div className="flex items-center justify-between">
                <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">Sizes</legend>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patchDraft({
                      variants: [
                        ...draft.variants,
                        {
                          name: "",
                          price_delta_cents: 0,
                          is_default: draft.variants.length === 0,
                          is_active: true,
                          sort_order: draft.variants.length,
                        },
                      ],
                    })
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add size
                </Button>
              </div>
              {fieldErrors["variants"]?.[0] ? <p className="mt-1 text-xs text-danger">{fieldErrors["variants"][0]}</p> : null}
              <div className="mt-2 space-y-2">
                {draft.variants.map((variant, index) => (
                  <div key={variant.id ?? `new-${index}`} className="grid gap-2 rounded-xl border border-border-warm p-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600" htmlFor={`variant-name-${index}`}>Name</label>
                      <Input
                        id={`variant-name-${index}`}
                        value={variant.name}
                        onChange={(event) => patchVariant(index, { name: event.target.value })}
                        placeholder="Single scoop"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-600" htmlFor={`variant-price-${index}`}>Price delta</label>
                      <CentsInput id={`variant-price-${index}`} value={variant.price_delta_cents} onChange={(cents) => patchVariant(index, { price_delta_cents: cents })} className="mt-1" />
                    </div>
                    <div className="flex items-center gap-3 pb-2">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name="default-variant"
                          checked={variant.is_default}
                          onChange={() => patchVariant(index, { is_default: true })}
                          className="accent-strawberry-500"
                        />
                        Default
                      </label>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={variant.is_active}
                          onChange={(event) => patchVariant(index, { is_active: event.target.checked })}
                          className="accent-strawberry-500"
                        />
                        Active
                      </label>
                      <button
                        type="button"
                        onClick={() => patchDraft({ variants: draft.variants.filter((_, variantIndex) => variantIndex !== index) })}
                        className="rounded-full p-1.5 text-ink-600 hover:bg-vanilla-100 hover:text-danger"
                        aria-label={`Remove ${variant.name || "size"}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {draft.variants.length === 0 ? <p className="text-xs text-ink-600">Add at least one size so the product can be ordered.</p> : null}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-700">Available add-ons</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {addOns.map((addOn) => (
                  <label key={addOn.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-warm px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={draft.add_on_ids.includes(addOn.id)}
                        onChange={(event) =>
                          patchDraft({
                            add_on_ids: event.target.checked
                              ? [...draft.add_on_ids, addOn.id]
                              : draft.add_on_ids.filter((id) => id !== addOn.id),
                          })
                        }
                        className="h-4 w-4 accent-strawberry-500"
                      />
                      {addOn.name}
                    </span>
                    <span className={cn("text-xs tabular-nums", addOn.is_active ? "text-ink-600" : "text-ink-600 line-through")}>
                      {formatMoney(addOn.price_cents)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={archiveTarget !== null}
        title={archiveTarget ? `Archive ${archiveTarget.name}?` : "Archive product"}
        description="The product disappears from the menu. Existing orders keep their item history."
        confirmLabel="Archive product"
        dangerous
        busy={archiving}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void archive()}
      />
    </div>
  );
}
